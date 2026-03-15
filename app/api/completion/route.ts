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
    const { message }: { message: string } = await req.json();

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

        const promptWithToolCalls = `Your name is ART, SMYLSYNC's internal operations agent capable of running tools.  Use the available tools to answer the prompt.  
        Be precise and answer the prompt directly using tools when possible.  Provide the answer that even a seven year old could understand. 
        Only run tools that are available.  You can only do things or answer questions based on the available tools.\n\n
        Prompt: ${message}`;

        // Call the gpt-5-nano (faster and cheaper) model to decide which tool(s) to call and with what arguments.
        const response = streamText({
            model: openai('gpt-5-nano'),
            tools,
            prompt: promptWithToolCalls,
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
                prompt: `Based on the following tool results, provide a final answer to the original prompt:\n\nPrompt: ${message}\n\nTool Results: ${JSON.stringify(toolResults)}`,
            });

            return finalResponse.toTextStreamResponse();
        }

        // If no tools were called, return the original response
        return response.toTextStreamResponse();

    } catch (error) {
        return new Response('Internal Server Error', { status: 500 });
    }
}