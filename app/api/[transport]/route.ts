import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextRequest } from "next/server";
import { createMcpServer } from "@/lib/mcp-server";

export const maxDuration = 120; // seconds (Vercel Pro/Enterprise; adjust to 60 on Hobby plan)

async function handleMcpRequest(req: NextRequest): Promise<Response> {
    // Stateless mode: create a fresh server + transport per request (no Redis needed)
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    const server = createMcpServer();
    await server.connect(transport);
    return transport.handleRequest(req);
}

export async function GET(req: NextRequest) {
    try {
        return await handleMcpRequest(req);
    } catch (error) {
        console.error("MCP GET error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        return await handleMcpRequest(req);
    } catch (error) {
        console.error("MCP POST error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        return await handleMcpRequest(req);
    } catch (error) {
        console.error("MCP DELETE error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
