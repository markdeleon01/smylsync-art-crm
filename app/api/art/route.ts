import { createMCPClient } from '@ai-sdk/mcp';
import { streamText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '@/lib/mcp-server';

export const maxDuration = 120; // seconds (Vercel Pro/Enterprise; adjust to 60 on Hobby plan)

export async function POST(req: Request) {
    const { message, history = [], localDate }: { message: string; history: { role: 'user' | 'assistant'; content: string }[]; localDate?: string } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY environment variable is not set');
        return Response.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    try {
        // Use an in-process MCP transport so tool calls never leave the serverless function.
        // This eliminates the HTTP round-trips to /api/mcp that caused 504 timeouts on Netlify.
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
        const mcpServer = createMcpServer();
        await mcpServer.connect(serverTransport);

        const mcpClient = await createMCPClient({
            transport: clientTransport,
        });

        const tools = await mcpClient.tools();

        const systemPrompt = `Your name is ART, SMYLSYNC's internal operations agent capable of running tools. Use the available tools to answer questions and perform operations.
        You can ONLY answer questions about patients, appointments, and schedules by calling the available tools — never from your training knowledge. If a tool must be used to answer a question, always call it.
        The user's current local date is ${localDate ?? new Date().toLocaleDateString('en-CA')}. Always use this date when the user refers to "today" or requests today's appointments or available slots.
        - For read-only queries (checking available slots, retrieving appointments, looking up patients): call the appropriate tool immediately without asking for confirmation.\n
        - For write operations (booking, rebooking, cancelling, or completing appointments; creating, updating, or deleting patients; sending emails; autofill): ask the user to confirm the specific action before executing. If confirmed, run the tool. If declined, respond with "Okay, is there anything else I can help you with?"\n
        - If no tool can answer the user's question, say so and ask if you can help with something else.\n
        `;

        const conversationMessages: { role: 'user' | 'assistant'; content: string }[] = [
            ...history,
            { role: 'user', content: message },
        ];

        // Call the gpt-5.4-nano (faster and cheaper) model to decide which tool(s) to call and with what arguments.
        // stopWhen: stepCountIs(6) allows up to 5 sequential tool call steps plus 1 final text step.
        // e.g. look up patient → check slots → book → send email → verify = 5 tool calls.
        // Confirmation always happens in the preceding user turn — it is never a step inside this loop.
        // anyToolCalled tracks whether any step in the multi-step generation called a tool.
        // response.toolResults only reflects the LAST step, which is always a text step with
        // no tool calls, so we must track this ourselves via onStepFinish.
        let anyToolCalled = false;

        const response = streamText({
            model: openai('gpt-5.4-nano'),
            tools,
            stopWhen: stepCountIs(6), // allow up to 5 tool calls before final text response
            system: systemPrompt,
            messages: conversationMessages,
            onStepFinish: ({ toolCalls, toolResults: stepResults }) => {
                if (toolCalls && toolCalls.length > 0) {
                    anyToolCalled = true;
                    for (const tc of toolCalls) {
                        console.log(`[ART] Tool called: "${tc.toolName}"`, JSON.stringify(tc.input));
                    }
                    for (const tr of (stepResults ?? [])) {
                        console.log(`[ART] Tool result: "${tr.toolName}"`, tr.output);
                    }
                }
            },
            onFinish: async () => {
                await mcpClient.close();
            },
            onError: async error => {
                await mcpClient.close();
            },
        });

        // Pipe the response stream directly to the client. With multi-step the final step
        // already contains the human-readable synthesis, so no second streamText is needed.
        // After the stream closes, append the metadata sentinel if any tool was called so the
        // client sets toolsExecuted=true before isLoading goes false and the refresh fires.
        const textStream = response.toTextStreamResponse();
        const reader = textStream.body?.getReader();

        if (!reader) {
            return textStream;
        }

        const METADATA = new TextEncoder().encode('data: {"toolsExecuted": true}\n\n');

        const outStream = new ReadableStream({
            async start(controller) {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        controller.enqueue(value);
                    }
                } catch (err) {
                    controller.error(err);
                    return;
                }
                if (anyToolCalled) {
                    controller.enqueue(METADATA);
                }
                controller.close();
            },
        });

        return new Response(outStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error) {
        console.error('ART API error:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return Response.json({ error: message }, { status: 500 });
    }
}