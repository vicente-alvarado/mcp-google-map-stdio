#!/usr/bin/env node

import { config as dotenvConfig } from "dotenv";
import path, { resolve } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import serverConfigs from "./config.js";
import { BaseMcpServer } from "./core/BaseMcpServer.js";
import { Logger } from "./index.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env from current directory first, then from package directory
dotenvConfig({ path: resolve(process.cwd(), ".env") });
dotenvConfig({ path: resolve(__dirname, "../.env") });

export async function startServer(port?: number, apiKey?: string): Promise<void> {
  if (port) {
    process.env.MCP_SERVER_PORT = port.toString();
  }
  if (apiKey) {
    process.env.GOOGLE_MAPS_API_KEY = apiKey;
  }

  Logger.log("🚀 Starting Google Maps MCP Server...");
  Logger.log("📍 Available tools: search_nearby, get_place_details, maps_geocode, maps_reverse_geocode, maps_distance_matrix, maps_directions, maps_elevation, echo");
  Logger.log("");

  const startPromises = serverConfigs.map(async (config) => {
    const portString = process.env[config.portEnvVar];
    if (!portString) {
      Logger.error(
        `⚠️  [${config.name}] Port environment variable ${config.portEnvVar} not set.`
      );
      Logger.log(`💡 Please set ${config.portEnvVar} in your .env file or use --port parameter.`);
      Logger.log(`   Example: ${config.portEnvVar}=3000 or --port 3000`);
      return;
    }

    const serverPort = Number(portString);
    if (isNaN(serverPort) || serverPort <= 0) {
      Logger.error(
        `❌ [${config.name}] Invalid port number "${portString}" defined in ${config.portEnvVar}.`
      );
      return;
    }

    try {
      const server = new BaseMcpServer(config.name, config.tools);
      Logger.log(
        `🔧 [${config.name}] Initializing MCP Server in HTTP mode on port ${serverPort}...`
      );
      await server.startHttpServer(serverPort);
      Logger.log(
        `✅ [${config.name}] MCP Server started successfully!`
      );
      Logger.log(`   🌐 Endpoint: http://localhost:${serverPort}/mcp`);
      Logger.log(`   📚 Tools: ${config.tools.length} available`);
    } catch (error) {
      Logger.error(
        `❌ [${config.name}] Failed to start MCP Server on port ${serverPort}:`,
        error
      );
    }
  });

  await Promise.allSettled(startPromises);

  Logger.log("");
  Logger.log("🎉 Server initialization completed!");
  Logger.log("💡 Need help? Check the README.md for configuration details.");
}

// ✅ FUNCIÓN SEPARADA PARA MODO STDIO
async function startStdioServer(): Promise<void> {
  // ✅ En modo STDIO, TODOS los logs van a stderr
  const log = (...args: any[]) => console.error(...args);
  
  log("🔌 Starting Google Maps MCP Server in STDIO mode...");
  
  // Verificar API key
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    log("❌ Error: GOOGLE_MAPS_API_KEY not found in environment");
    log("   Please set it in your .env file or environment variables");
    process.exit(1);
  }

  try {
    const server = new BaseMcpServer("google-maps", serverConfigs[0].tools);
    await server.startStdioServer();
    
    log("✅ MCP Server running in STDIO mode");
    log("   Ready to receive requests from Claude Desktop");
    
    // Mantener el proceso activo
    process.stdin.resume();
  } catch (error) {
    log("❌ Failed to start STDIO server:", error);
    process.exit(1);
  }
}

// Check if this script is being run directly
const isRunDirectly = process.argv[1] && (
  process.argv[1].endsWith("cli.ts") || 
  process.argv[1].endsWith("cli.js") ||
  process.argv[1].endsWith("mcp-google-map-stdio") ||
  process.argv[1].includes("mcp-google-map-stdio")
);

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isRunDirectly || isMainModule) {
  // ✅ DETECCIÓN TEMPRANA DE MODO STDIO (antes de parsear args con yargs)
  if (process.argv.includes("--stdio")) {
    startStdioServer().catch((error) => {
      console.error("❌ Fatal error:", error);
      process.exit(1);
    });
  } else {
    // Modo HTTP normal con yargs
    let packageVersion = "0.0.0";
    try {
      const packageJsonPath = resolve(__dirname, "../package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      packageVersion = packageJson.version;
    } catch (e) {
      packageVersion = "0.0.0";
    }

    const argv = yargs(hideBin(process.argv))
      .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port to run the MCP server on',
        default: process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 3000
      })
      .option('apikey', {
        alias: 'k',
        type: 'string',
        description: 'Google Maps API key',
        default: process.env.GOOGLE_MAPS_API_KEY
      })
      .option('stdio', {
        type: 'boolean',
        description: 'Run in STDIO mode (for Claude Desktop)',
        default: false
      })
      .option('help', {
        alias: 'h',
        type: 'boolean',
        description: 'Show help'
      })
      .version(packageVersion)
      .alias('version', 'v')
      .example([
        ['$0', 'Start server in HTTP mode with default settings'],
        ['$0 --port 3000 --apikey "your_api_key"', 'Start HTTP server with custom port and API key'],
        ['$0 --stdio', 'Start server in STDIO mode for Claude Desktop']
      ])
      .help()
      .parseSync();

    Logger.log("🗺️  Google Maps MCP Server");
    Logger.log("   A Model Context Protocol server for Google Maps services");
    Logger.log("");
    
    if (!argv.apikey) {
      Logger.log("⚠️  Google Maps API Key not found!");
      Logger.log("   Please provide --apikey parameter or set GOOGLE_MAPS_API_KEY in your .env file");
      Logger.log("   Example: mcp-google-map-stdio --apikey your_api_key_here");
      Logger.log("");
    }
    
    startServer(argv.port, argv.apikey).catch((error) => {
      Logger.error("❌ Failed to start server:", error);
      process.exit(1);
    });
  }
}
