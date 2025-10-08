#!/usr/bin/env node

/**
 * MCP stdio Wrapper para mcp-google-map
 * 
 * Este wrapper permite usar el servidor mcp-google-map (que solo soporta HTTP)
 * con Claude Desktop (que requiere stdio).
 * 
 * Funciona como un proxy:
 * - Escucha por stdin mensajes JSON-RPC de Claude
 * - Los reenvía al servidor HTTP local
 * - Devuelve las respuestas por stdout a Claude
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SERVER_PORT = process.env.MCP_SERVER_PORT || '3000';
const MCP_URL = `http://localhost:${SERVER_PORT}/mcp`;

let serverProcess = null;
let sessionId = null;
let isServerReady = false;

// Iniciar el servidor HTTP en segundo plano
function startHttpServer() {
  return new Promise((resolve, reject) => {
    const serverPath = join(__dirname, 'dist', 'cli.js');

    serverProcess = spawn('node', [serverPath], {
      env: {
        ...process.env,
        GOOGLE_MAPS_API_KEY: API_KEY,
        MCP_SERVER_PORT: SERVER_PORT
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stderr.on('data', (data) => {
      const message = data.toString();
      // Detectar cuando el servidor está listo
      if (message.includes('MCP Server started successfully')) {
        isServerReady = true;
        resolve();
      }
      // Log del servidor (no mostrar en stdout para no interferir con stdio)
      console.error('[HTTP Server]', message.trim());
    });

    serverProcess.on('error', (error) => {
      console.error('[Wrapper Error]', 'Failed to start HTTP server:', error);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      console.error('[HTTP Server]', `Exited with code ${code}`);
      process.exit(code || 0);
    });

    // Timeout si no inicia en 10 segundos
    setTimeout(() => {
      if (!isServerReady) {
        reject(new Error('Server startup timeout'));
      }
    }, 10000);
  });
}

// Hacer request HTTP al servidor local
async function makeHttpRequest(jsonrpcMessage) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  };

  // Agregar API key al header
  if (API_KEY) {
    headers['X-Google-Maps-API-Key'] = API_KEY;
  }

  // Agregar session ID si existe
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(jsonrpcMessage)
  });

  // Capturar session ID de la primera respuesta
  if (!sessionId) {
    const sid = response.headers.get('mcp-session-id');
    if (sid) {
      sessionId = sid;
    }
  }

  // Parsear respuesta SSE
  const text = await response.text();
  return parseSSEResponse(text);
}

// Parsear formato SSE a objeto JSON
function parseSSEResponse(text) {
  const lines = text.split('\n');
  let currentEvent = {};

  for (const line of lines) {
    if (line.startsWith('event:')) {
      currentEvent.event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      try {
        currentEvent.data = JSON.parse(line.slice(5).trim());
      } catch (e) {
        currentEvent.data = line.slice(5).trim();
      }
    } else if (line === '' && currentEvent.event) {
      // SSE completo, retornar el data
      if (currentEvent.event === 'message' && currentEvent.data) {
        return currentEvent.data;
      }
      currentEvent = {};
    }
  }

  return null;
}

// Procesar mensaje de Claude
async function handleStdinMessage(message) {
  try {
    const jsonrpcMessage = JSON.parse(message);
    
    // Esperar a que el servidor esté listo
    if (!isServerReady) {
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (isServerReady) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    // Hacer request al servidor HTTP
    const response = await makeHttpRequest(jsonrpcMessage);

    if (response) {
      // Enviar respuesta a Claude por stdout
      console.log(JSON.stringify(response));
    }
  } catch (error) {
    console.error('[Wrapper Error]', 'Error processing message:', error);
    
    // Enviar error a Claude
    const errorResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      },
      id: null
    };
    console.log(JSON.stringify(errorResponse));
  }
}

// Inicialización
async function main() {
  console.error('[Wrapper]', 'Starting MCP stdio wrapper...');
  
  // Validar API key
  if (!API_KEY) {
    console.error('[Wrapper Error]', 'GOOGLE_MAPS_API_KEY not set');
    process.exit(1);
  }

  try {
    // Iniciar servidor HTTP
    console.error('[Wrapper]', 'Starting HTTP server on port', SERVER_PORT);
    await startHttpServer();
    console.error('[Wrapper]', 'HTTP server ready');

    // Escuchar stdin para mensajes de Claude
    console.error('[Wrapper]', 'Ready to receive stdin messages');
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      if (line.trim()) {
        handleStdinMessage(line);
      }
    });

    rl.on('close', () => {
      console.error('[Wrapper]', 'stdin closed, shutting down');
      if (serverProcess) {
        serverProcess.kill();
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('[Wrapper Error]', 'Failed to start:', error);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.error('[Wrapper]', 'Received SIGINT, shutting down');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[Wrapper]', 'Received SIGTERM, shutting down');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Iniciar
main();
