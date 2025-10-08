import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from "express";
import { Server } from "http";
import { randomUUID } from "node:crypto";
import { Logger } from "../index.js";
import { ApiKeyManager } from "../utils/apiKeyManager.js";
import { runWithContext } from "../utils/requestContext.js";

const VERSION = "0.0.1";

// Define a structure for tool configurations
export interface ToolConfig {
  name: string;
  description: string;
  schema: any;
  action: (params: any) => Promise<any>;
}

export interface SessionContext {
  apiKey?: string;
  transport: Transport;
}

export class BaseMcpServer {
  protected readonly server: McpServer;
  private sessions: { [sessionId: string]: SessionContext } = {};
  private httpServer: Server | null = null;
  private serverName: string;
  private isStdioMode: boolean = false; // ✅ NUEVO: Flag para saber el modo

  constructor(name: string, tools: ToolConfig[]) {
    this.serverName = name;
    this.server = new McpServer(
      {
        name: this.serverName,
        version: VERSION,
      },
      {
        capabilities: {
          logging: {},
          tools: {},
        },
      }
    );

    this.registerTools(tools);
  }

  private registerTools(tools: ToolConfig[]): void {
    tools.forEach((tool) => {
      this.server.tool(tool.name, tool.description, tool.schema, async (params: any) => tool.action(params));
    });
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
    
    // ✅ Solo log en modo HTTP o a stderr en modo STDIO
    if (!this.isStdioMode) {
      Logger.log(`${this.serverName} connected and ready to process requests`);
    }
  }

  async startHttpServer(port: number): Promise<void> {
    this.isStdioMode = false; // ✅ Marcar como modo HTTP
    
    const app = express();
    app.use(express.json());

    // Handle POST requests for client-to-server communication
    app.post("/mcp", async (req: Request, res: Response) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let context: SessionContext;

      // Extract API key from headers if provided
      const apiKeyManager = ApiKeyManager.getInstance();
      const requestApiKey = apiKeyManager.getApiKey(req);

      Logger.log(`${this.serverName} Get API KEY: ${requestApiKey}`)

      if (sessionId && this.sessions[sessionId]) {
        // Reuse existing session
        context = this.sessions[sessionId];
        // Update API key if provided in this request
        if (requestApiKey) {
          context.apiKey = requestApiKey;
        }
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            this.sessions[sessionId] = context;
            Logger.log(`[${this.serverName}] New session initialized: ${sessionId}`);
          },
        });

        // Create session context
        context = {
          transport,
          apiKey: requestApiKey
        };

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            delete this.sessions[transport.sessionId];
            Logger.log(`[${this.serverName}] Session closed: ${transport.sessionId}`);
          }
        };

        await this.server.connect(transport);
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
        return;
      }

      // Run the request handler with the API key in context
      await runWithContext(
        { apiKey: context.apiKey, sessionId },
        async () => {
          await context.transport.handleRequest(req, res, req.body);
        }
      );
    });

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (req: Request, res: Response) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (!sessionId || !this.sessions[sessionId]) {
        res.status(400).send("Invalid or missing session ID");
        return;
      }

      const context = this.sessions[sessionId];

      // Check for updated API key in headers
      const apiKeyManager = ApiKeyManager.getInstance();
      const requestApiKey = apiKeyManager.getApiKey(req);
      if (requestApiKey) {
        context.apiKey = requestApiKey;
      }

      // Run the request handler with the API key in context
      await runWithContext(
        { apiKey: context.apiKey, sessionId },
        async () => {
          await context.transport.handleRequest(req, res);
        }
      );
    };

    // Handle GET requests for server-to-client notifications via SSE
    app.get("/mcp", handleSessionRequest);

    // Handle DELETE requests for session termination
    app.delete("/mcp", handleSessionRequest);

    this.httpServer = app.listen(port, () => {
      Logger.log(`[${this.serverName}] HTTP server listening on port ${port}`);
      Logger.log(`[${this.serverName}] MCP endpoint available at http://localhost:${port}/mcp`);
    });
  }

  async stopHttpServer(): Promise<void> {
    if (!this.httpServer) {
      Logger.error(`[${this.serverName}] HTTP server is not running or already stopped.`);
      return;
    }

    return new Promise((resolve, reject) => {
      this.httpServer!.close((err: Error | undefined) => {
        if (err) {
          Logger.error(`[${this.serverName}] Error stopping HTTP server:`, err);
          reject(err);
          return;
        }
        Logger.log(`[${this.serverName}] HTTP server stopped.`);
        this.httpServer = null;
        const closingSessions = Object.values(this.sessions).map((context) => {
          if (context.transport.sessionId) {
            delete this.sessions[context.transport.sessionId];
          }
          return Promise.resolve();
        });
        Promise.all(closingSessions)
          .then(() => {
            Logger.log(`[${this.serverName}] All transports closed.`);
            resolve();
          })
          .catch((transportCloseErr) => {
            Logger.error(`[${this.serverName}] Error during bulk transport closing:`, transportCloseErr);
            reject(transportCloseErr);
          });
      });
    });
  }

  /**
   * ✅ Start MCP Server in STDIO mode (for Claude Desktop)
   * STDIO mode requires:
   * - stdin for input (JSON-RPC requests)
   * - stdout for output (JSON-RPC responses ONLY)
   * - stderr for logs
   */
  async startStdioServer(): Promise<void> {
    this.isStdioMode = true; // ✅ Marcar como modo STDIO
    
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");

    // ✅ Logs a stderr en modo STDIO
    console.error(`[${this.serverName}] Starting STDIO MCP Server...`);

    const transport = new StdioServerTransport();
    await this.connect(transport);

    console.error(`[${this.serverName}] STDIO MCP Server ready and waiting for requests`);
  }

  /**
   * Gracefully stop the STDIO server
   */
  async stopStdioServer(): Promise<void> {
    console.error(`[${this.serverName}] Stopping STDIO MCP Server...`);
    process.exit(0);
  }
}
