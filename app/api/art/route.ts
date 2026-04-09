import { createMCPClient } from '@ai-sdk/mcp';
import { streamText } from 'ai';
//import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
//import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';

// Optional: Official transports if you prefer them
// import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
// import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse';
// import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';

export async function POST(req: Request) {
    const { message, history = [] }: { message: string; history: { role: 'user' | 'assistant'; content: string }[] } = await req.json();

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
                url: process.env.MCP_URL ?? '/api/mcp',

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
        - If user says “yes”:  Allow/force a tool call.\n
        - If a tool requires confirmation and user says “no”:  you must respond with a redirect: "Okay, is there anything else I can help you with?"\n
        - If a tool requires confirmation and user says "yes":  execute the tool and use the results to answer the original question.\n
        `;

        const conversationMessages: { role: 'user' | 'assistant'; content: string }[] = [
            ...history,
            { role: 'user', content: message },
        ];

        // Call the gpt-5-nano (faster and cheaper) model to decide which tool(s) to call and with what arguments.
        const response = streamText({
            model: openai('gpt-5-nano'),
            tools,
            system: systemPrompt,
            messages: conversationMessages,
            onFinish: async () => {
                await httpClient.close();
            },
            onError: async error => {
                await httpClient.close();
            },
        });

        // Wait for tool results to be processed
        const toolResults = await response.toolResults;

        // If tools were called, generate a final response based on the tool results only
        if (toolResults && toolResults.length > 0) {
            for (const toolResult of toolResults) {
                console.log(`Tool "${toolResult.toolName}" was called with input:`, toolResult.input);
                console.log(`Tool "${toolResult.toolName}" returned output:`, toolResult.output);
            }

            // Return only the final response based on tool results
            // Use a more powerful model for the final response if desired, since it won't be calling tools and just needs to synthesize the tool results into a final answer
            // Summarizes results and avoids “general knowledge” drift.
            const finalResponse = streamText({
                model: openai('gpt-5-nano'),
                system: `You are ART, SMYLSYNC’s internal operations agent.  Follow these rules when generating your final answer:\n
                - You must NOT answer general knowledge questions directly.\n
                - You may only answer using information returned by tools.\n
                - Provide the answer that even a seven year old could understand. \n
                - If a tool was executed successfully, you must use the tool results to answer the original question.  Do not use any general knowledge or make assumptions that are not based on the tool results.\n
                - Do not offer any other suggestions, just use the tools necessary to answer the question.`,
                messages: [
                    ...conversationMessages,
                    { role: 'assistant' as const, content: `Tool Results: ${JSON.stringify(toolResults)}` },
                ],
            });

            // Add tool execution metadata at the start of the stream
            const textStream = finalResponse.toTextStreamResponse();
            const reader = textStream.body?.getReader();

            if (reader) {
                // Create a new ReadableStream with tool execution flag prepended
                const newStream = new ReadableStream({
                    async start(controller) {
                        // Send metadata first
                        controller.enqueue(new TextEncoder().encode('data: {"toolsExecuted": true}\n\n'));

                        // Then pipe the rest
                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) {
                                    controller.close();
                                    break;
                                }
                                controller.enqueue(value);
                            }
                        } catch (error) {
                            controller.error(error);
                        }
                    },
                });

                return new Response(newStream, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                });
            }

            return textStream;
        }

        // If no tools were called, return the original response
        return response.toTextStreamResponse();

    } catch (error) {
        return new Response('Internal Server Error', { status: 500 });
    }
}