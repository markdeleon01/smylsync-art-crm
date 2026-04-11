import { createMCPClient } from '@ai-sdk/mcp';
import { streamText, stepCountIs } from 'ai';
//import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
//import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';

// Optional: Official transports if you prefer them
// import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
// import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse';
// import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';

export async function POST(req: Request) {
    const { message, history = [] }: { message: string; history: { role: 'user' | 'assistant'; content: string }[] } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY environment variable is not set');
        return Response.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // Derive the MCP URL from the incoming request so it works in any environment
    // (local, Vercel, Netlify, etc.) without needing MCP_URL set.
    const { origin } = new URL(req.url);
    const mcpUrl = process.env.MCP_URL ?? `${origin}/api/mcp`;

    const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    try {
        /*
        // Initialize an MCP client to connect to a `stdio` MCP server (local only):
        const transport = new Experimental_StdioMCPTransport({
            command: 'node',
            args: ['src/stdio/dist/server.js'],
        });

        const stdioClient = await createMCPClient({
            transport,
        });
        */

        // Connect to an HTTP MCP server directly via the client transport config
        const httpClient = await createMCPClient({
            transport: {
                type: 'http',
                url: mcpUrl,

                // optional: configure headers
                // headers: { Authorization: 'Bearer my-api-key' },

                // optional: provide an OAuth client provider for automatic authorization
                // authProvider: myOAuthClientProvider,
            },
        });

        /*
        // Connect to a Server-Sent Events (SSE) MCP server directly via the client transport config
        const sseClient = await createMCPClient({
            transport: {
                type: 'sse',
                url: process.env.SSE_URL ?? '/api/sse',

                // optional: configure headers
                // headers: { Authorization: 'Bearer my-api-key' },

                // optional: provide an OAuth client provider for automatic authorization
                // authProvider: myOAuthClientProvider,
            },
        });
        */

        // Alternatively, you can create transports with the official SDKs instead of direct config:
        // const httpTransport = new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp'));
        // const httpClient = await createMCPClient({ transport: httpTransport });
        // const sseTransport = new SSEClientTransport(new URL('http://localhost:3000/sse'));
        // const sseClient = await createMCPClient({ transport: sseTransport });

        //const toolSetOne = await stdioClient.tools();
        const toolSetTwo = await httpClient.tools();
        //const toolSetThree = await sseClient.tools();
        const tools = {
            //...toolSetOne,
            ...toolSetTwo,
            //...toolSetThree, // note: this approach causes subsequent tool sets to override tools with the same name
        };
        //console.log('Available tools:', Object.keys(tools));

        const systemPrompt = `Your name is ART, SMYLSYNC's internal operations agent capable of running tools.  Use the available tools to answer the prompt.  
        Be precise and answer the prompt directly using tools when possible.  Only run tools that are available.  You can only do things or answer questions based on the available tools.
        - If the user asks a question that could be answered by a tool:  Ask for confirmation to use the tool.\n
        - If user asks a general question and has not opted-in to tool use:  you must respond with a redirect + yes/no question.\n
        - If a tool requires confirmation and user declines, you must respond with a redirect: "Okay, is there anything else I can help you with?"\n
        - If a tool requires confirmation and user confirms, execute the tool and use the results to answer the original question.\n
        `;

        const conversationMessages: { role: 'user' | 'assistant'; content: string }[] = [
            ...history,
            { role: 'user', content: message },
        ];

        // Call the gpt-5-nano (faster and cheaper) model to decide which tool(s) to call and with what arguments.
        // stopWhen: stepCountIs(3) allows the model to make up to two sequential tool calls
        // (e.g. look up a patient, then book an appointment) before producing a final text response.
        // Confirmation always happens in the preceding user turn — it is never a step inside this loop.
        // anyToolCalled tracks whether any step in the multi-step generation called a tool.
        // response.toolResults only reflects the LAST step, which is always a text step with
        // no tool calls, so we must track this ourselves via onStepFinish.
        let anyToolCalled = false;

        const response = streamText({
            model: openai('gpt-5-nano'),
            tools,
            stopWhen: stepCountIs(5), // allow up to 4 tool calls before final text response
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
                await httpClient.close();
            },
            onError: async error => {
                await httpClient.close();
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