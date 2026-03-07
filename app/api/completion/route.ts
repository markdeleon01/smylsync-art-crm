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
    const { prompt }: { prompt: string } = await req.json();

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
                url: 'http://localhost:3000/api/mcp',

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
                url: 'http://localhost:3000/api/sse',

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

        const promptWithToolCalls = `You are an AI agent capable of running tools.  Use the available tools to answer the prompt.  
        Be precise and answer the prompt directly using tools when possible.  Provide the answer that even a seven year old could understand. 
        Only run tools that are available.  If you don't know the answer, use the "search" tool to search the web for relevant information.\n\n
        Prompt: ${prompt}`;

        // Call the model with the prompt and tools, and stream the response back to the client
        // The onFinish callback is important to ensure resources are freed and connections are closed after the response is complete.
        // The onError callback is optional but recommended to handle any errors that occur during processing and ensure resources are cleaned up.
        // The tool results are available in the response object after the model has finished processing and can be used to inform subsequent calls or the final response.
        const response = await streamText({
            model: openai('gpt-5-nano'),
            tools,
            prompt: promptWithToolCalls,
            // When streaming, the client should be closed after the response is finished:
            onFinish: async () => {
                //await stdioClient.close();
                await httpClient.close();
                //await sseClient.close();
            },
            // Closing clients onError is optional
            // - Closing: Immediately frees resources, prevents hanging connections
            // - Not closing: Keeps connection open for retries
            onError: async error => {
                //await stdioClient.close();
                await httpClient.close();
                //await sseClient.close();
            },
        });

        let reply = response;
        const toolResults = await response.toolResults;

        // If no tools were called, you can return the model's response directly.  
        // If tools were called, you can use the tool results to determine how to formulate the final response.
        if (toolResults && toolResults.length > 0) {
            /*
            for (const toolResult of toolResults) {
                console.log(`Tool "${toolResult.toolName}" was called with input:`, toolResult.input);
                console.log(`Tool "${toolResult.toolName}" returned output:`, toolResult.output);
                const output = toolResult.output as { content: { type: string; text: string }[] };
                for (const contentItem of output.content) {
                    if (contentItem.type === 'text') {
                        console.log(`Tool "${toolResult.toolName}" output text:`, contentItem.text);
                    }
                }
            }
            */
            reply = await streamText({
                model: openai('gpt-5-nano'),
                prompt: `Based on the following tool results, provide a final answer to the original prompt:\n\n${JSON.stringify(toolResults)}`,
            });
        }

        return reply.toTextStreamResponse();
    } catch (error) {
        return new Response('Internal Server Error', { status: 500 });
    }
}