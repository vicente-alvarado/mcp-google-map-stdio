#!/usr/bin/env node

/**
 * Test script para el modo STDIO
 * Envía un mensaje initialize y verifica la respuesta
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer API key del .env
const envContent = readFileSync(resolve(__dirname, '.env'), 'utf-8');
const apiKeyMatch = envContent.match(/GOOGLE_MAPS_API_KEY="([^"]+)"/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : '';

if (!apiKey) {
  console.error('❌ No se encontró GOOGLE_MAPS_API_KEY en .env');
  process.exit(1);
}

console.error('🧪 Iniciando test de modo STDIO...\n');

// Iniciar el servidor en modo STDIO
const server = spawn('node', ['dist/cli.js', '--stdio'], {
  env: {
    ...process.env,
    GOOGLE_MAPS_API_KEY: apiKey
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseReceived = false;
let timeout;

// Capturar stderr (logs del servidor)
server.stderr.on('data', (data) => {
  console.error('📋 [Server Log]:', data.toString().trim());
});

// Capturar stdout (respuestas JSON-RPC)
server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  console.log('\n✅ [Response JSON]:', response);
  
  try {
    const json = JSON.parse(response);
    if (json.result && json.result.serverInfo) {
      console.log('\n🎉 Test EXITOSO!');
      console.log('   Servidor:', json.result.serverInfo.name);
      console.log('   Versión:', json.result.serverInfo.version);
      console.log('   Protocolo:', json.result.protocolVersion);
      responseReceived = true;
      
      clearTimeout(timeout);
      setTimeout(() => {
        server.kill();
        process.exit(0);
      }, 500);
    }
  } catch (e) {
    console.error('❌ Error parseando respuesta:', e.message);
  }
});

server.on('error', (error) => {
  console.error('❌ Error al iniciar servidor:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (!responseReceived) {
    console.error('\n❌ Test FALLIDO: Servidor terminó sin respuesta');
    process.exit(1);
  }
});

// Timeout de 10 segundos
timeout = setTimeout(() => {
  if (!responseReceived) {
    console.error('\n❌ Test FALLIDO: Timeout (10s)');
    server.kill();
    process.exit(1);
  }
}, 10000);

// Esperar un momento para que el servidor se inicialice
setTimeout(() => {
  console.error('\n📤 Enviando mensaje initialize...\n');
  
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(initMessage) + '\n');
}, 2000);
