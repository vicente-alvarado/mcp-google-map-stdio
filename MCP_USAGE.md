# 🔌 Uso con Clientes MCP

Esta guía muestra cómo integrar el servidor MCP Google Maps con cualquier cliente que soporte el protocolo MCP.

## 📋 Sobre el Protocolo MCP

El **Model Context Protocol (MCP)** es un protocolo estandarizado basado en JSON-RPC 2.0 que permite a LLMs y aplicaciones conectarse con herramientas externas de forma uniforme.

## 🚀 Modos de Transporte Soportados

Este servidor soporta dos modos de transporte:

### 1. STDIO (Standard Input/Output)

Comunicación a través de stdin/stdout, ideal para:
- Claude Desktop
- Aplicaciones de terminal
- Procesos spawn/exec

### 2. HTTP + SSE (Server-Sent Events)

Comunicación HTTP con soporte para streaming, ideal para:
- Desarrollo y testing
- Aplicaciones web
- Servicios distribuidos

## 📡 Uso con STDIO

### Iniciar el Servidor

```bash
# Con API key como variable de entorno
GOOGLE_MAPS_API_KEY="tu_api_key" mcp-google-map-stdio --stdio

# O con archivo .env
# Crear archivo .env con: GOOGLE_MAPS_API_KEY=tu_api_key
mcp-google-map-stdio --stdio
```

### Ejemplo de Cliente en Node.js

```javascript
import { spawn } from 'child_process';

class StdioMCPClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.server = null;
    this.requestId = 0;
  }

  start() {
    this.server = spawn('mcp-google-map-stdio', ['--stdio'], {
      env: {
        ...process.env,
        GOOGLE_MAPS_API_KEY: this.apiKey
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Capturar respuestas
    this.server.stdout.on('data', (data) => {
      const response = JSON.parse(data.toString());
      console.log('Respuesta:', response);
    });

    // Capturar logs (stderr)
    this.server.stderr.on('data', (data) => {
      console.error('[Server Log]:', data.toString());
    });
  }

  send(method, params = {}) {
    const message = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: method,
      params: params
    };

    this.server.stdin.write(JSON.stringify(message) + '\n');
  }

  async initialize() {
    this.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'mi-cliente',
        version: '1.0.0'
      }
    });
  }

  async listTools() {
    this.send('tools/list', {});
  }

  async callTool(toolName, args) {
    this.send('tools/call', {
      name: toolName,
      arguments: args
    });
  }

  close() {
    if (this.server) {
      this.server.kill();
    }
  }
}

// Uso
const client = new StdioMCPClient('tu_api_key');
client.start();

setTimeout(async () => {
  await client.initialize();
  
  setTimeout(() => {
    client.callTool('maps_geocode', {
      address: 'Torre Eiffel, París'
    });
  }, 1000);
}, 1000);
```

### Ejemplo con Python

```python
import subprocess
import json
import os

class StdioMCPClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.request_id = 0
        self.server = None

    def start(self):
        env = os.environ.copy()
        env['GOOGLE_MAPS_API_KEY'] = self.api_key
        
        self.server = subprocess.Popen(
            ['mcp-google-map-stdio', '--stdio'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True,
            bufsize=1
        )

    def send(self, method, params=None):
        self.request_id += 1
        message = {
            'jsonrpc': '2.0',
            'id': self.request_id,
            'method': method,
            'params': params or {}
        }
        
        self.server.stdin.write(json.dumps(message) + '\n')
        self.server.stdin.flush()

    def read_response(self):
        line = self.server.stdout.readline()
        if line:
            return json.loads(line)
        return None

    def initialize(self):
        self.send('initialize', {
            'protocolVersion': '2024-11-05',
            'capabilities': {},
            'clientInfo': {
                'name': 'mi-cliente-python',
                'version': '1.0.0'
            }
        })
        return self.read_response()

    def list_tools(self):
        self.send('tools/list', {})
        return self.read_response()

    def call_tool(self, tool_name, args):
        self.send('tools/call', {
            'name': tool_name,
            'arguments': args
        })
        return self.read_response()

    def close(self):
        if self.server:
            self.server.terminate()

# Uso
client = StdioMCPClient('tu_api_key')
client.start()

# Inicializar
init_response = client.initialize()
print('Inicializado:', init_response)

# Listar herramientas
tools = client.list_tools()
print('Herramientas:', tools)

# Usar una herramienta
result = client.call_tool('maps_geocode', {
    'address': 'Torre Eiffel, París'
})
print('Resultado:', result)

client.close()
```

## 🌐 Uso con HTTP

### Iniciar el Servidor

```bash
# Por defecto en puerto 3000
GOOGLE_MAPS_API_KEY="tu_api_key" MCP_SERVER_PORT=3000 mcp-google-map-stdio

# O con puerto personalizado
GOOGLE_MAPS_API_KEY="tu_api_key" MCP_SERVER_PORT=8080 mcp-google-map-stdio
```

### Flujo de Comunicación HTTP

1. **Initialize**: Crear sesión
2. **Capturar session-id**: Del header de respuesta
3. **Usar herramientas**: Con session-id en requests subsecuentes
4. **Cerrar sesión**: DELETE request (opcional)

### Ejemplo de Cliente HTTP en Node.js

```javascript
import fetch from 'node-fetch';

class HttpMCPClient {
  constructor(serverUrl, apiKey) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.sessionId = null;
    this.requestId = 0;
  }

  async request(method, params = {}) {
    const payload = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: ++this.requestId
    };

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'X-Google-Maps-API-Key': this.apiKey
    };

    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    // Capturar session ID
    if (!this.sessionId) {
      this.sessionId = response.headers.get('mcp-session-id');
    }

    // Parsear respuesta SSE
    const text = await response.text();
    return this.parseSSE(text);
  }

  parseSSE(text) {
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
      } else if (line === '' && currentEvent.event === 'message') {
        return currentEvent.data;
      }
    }
    return null;
  }

  async initialize() {
    return await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'mi-cliente-http',
        version: '1.0.0'
      }
    });
  }

  async listTools() {
    const response = await this.request('tools/list');
    return response.result.tools;
  }

  async callTool(toolName, args) {
    const response = await this.request('tools/call', {
      name: toolName,
      arguments: args
    });
    return response.result;
  }

  async close() {
    if (!this.sessionId) return;

    await fetch(this.serverUrl, {
      method: 'DELETE',
      headers: {
        'mcp-session-id': this.sessionId
      }
    });
  }
}

// Uso
async function main() {
  const client = new HttpMCPClient(
    'http://localhost:3000/mcp',
    'tu_api_key'
  );

  try {
    // Inicializar
    const init = await client.initialize();
    console.log('Sesión:', init);

    // Listar herramientas
    const tools = await client.listTools();
    console.log('Herramientas:', tools.map(t => t.name));

    // Usar herramienta
    const result = await client.callTool('maps_geocode', {
      address: 'Torre Eiffel, París'
    });
    console.log('Resultado:', result);

    // Cerrar sesión
    await client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### Ejemplo con curl

```bash
API_KEY="tu_api_key"
URL="http://localhost:3000/mcp"

# 1. Initialize y capturar session ID
RESPONSE=$(curl -i -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-Google-Maps-API-Key: $API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "curl", "version": "1.0.0"}
    }
  }')

# Extraer session ID del header
SESSION_ID=$(echo "$RESPONSE" | grep -i "mcp-session-id:" | cut -d' ' -f2 | tr -d '\r')

echo "Session ID: $SESSION_ID"

# 2. Listar herramientas
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "X-Google-Maps-API-Key: $API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'

# 3. Llamar herramienta
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "X-Google-Maps-API-Key: $API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "maps_geocode",
      "arguments": {
        "address": "Torre Eiffel, París"
      }
    }
  }'

# 4. Cerrar sesión (opcional)
curl -X DELETE "$URL" \
  -H "mcp-session-id: $SESSION_ID"
```

## 📝 Formato de Mensajes

### Request (Solicitud)

```json
{
  "jsonrpc": "2.0",
  "method": "nombre_del_metodo",
  "params": {
    "parametro1": "valor1"
  },
  "id": 1
}
```

### Response (Respuesta Exitosa)

```json
{
  "jsonrpc": "2.0",
  "result": {
    "data": "resultado"
  },
  "id": 1
}
```

### Error Response

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "..."
    }
  },
  "id": 1
}
```

## 🛠️ Métodos Disponibles

### initialize

Inicializa una nueva sesión MCP.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "mi-cliente",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "logging": {},
      "tools": {
        "listChanged": true
      }
    },
    "serverInfo": {
      "name": "google-maps",
      "version": "0.0.1"
    }
  },
  "id": 1
}
```

### tools/list

Lista todas las herramientas disponibles.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 2
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "search_nearby",
        "description": "Search for places near a location",
        "inputSchema": {
          "type": "object",
          "properties": {
            "center": {
              "type": "object",
              "description": "Search center point"
            }
          },
          "required": ["center"]
        }
      }
    ]
  },
  "id": 2
}
```

### tools/call

Ejecuta una herramienta específica.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "maps_geocode",
    "arguments": {
      "address": "Torre Eiffel, París"
    }
  },
  "id": 3
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"lat\": 48.8584, \"lng\": 2.2945}"
      }
    ],
    "isError": false
  },
  "id": 3
}
```

## 🔧 Headers HTTP Importantes

### Request Headers

- `Content-Type: application/json` - Requerido
- `Accept: application/json, text/event-stream` - Requerido para SSE
- `X-Google-Maps-API-Key: <api_key>` - API key de Google Maps
- `mcp-session-id: <session_id>` - ID de sesión (después del initialize)

### Response Headers

- `mcp-session-id: <session_id>` - ID de sesión (solo en initialize)
- `Content-Type: text/event-stream` - Para respuestas SSE

## ⚠️ Manejo de Errores

### Códigos de Error JSON-RPC

| Código | Nombre | Descripción |
|--------|--------|-------------|
| -32700 | Parse error | JSON inválido |
| -32600 | Invalid Request | Request no válido |
| -32601 | Method not found | Método no existe |
| -32602 | Invalid params | Parámetros inválidos |
| -32603 | Internal error | Error interno |
| -32000 | Server error | Error del servidor |

### Ejemplo de Manejo de Errores

```javascript
async callTool(toolName, args) {
  try {
    const response = await this.request('tools/call', {
      name: toolName,
      arguments: args
    });

    if (response.error) {
      console.error('Error de herramienta:', response.error.message);
      if (response.error.data) {
        console.error('Detalles:', response.error.data);
      }
      throw new Error(response.error.message);
    }

    return response.result;
  } catch (error) {
    console.error('Error de comunicación:', error.message);
    throw error;
  }
}
```

## 💡 Mejores Prácticas

### 1. Reutilizar Sesiones

```javascript
// ✅ Bueno: Una sesión para múltiples operaciones
const client = new MCPClient(url, apiKey);
await client.initialize();
await client.callTool('tool1', {});
await client.callTool('tool2', {});
await client.close();

// ❌ Malo: Nueva sesión para cada operación
for (const tool of tools) {
  const client = new MCPClient(url, apiKey);
  await client.initialize();
  await client.callTool(tool, {});
  await client.close();
}
```

### 2. Validar Parámetros

```javascript
// Validar antes de enviar
if (!args.center || !args.center.value) {
  throw new Error('center es requerido');
}

await client.callTool('search_nearby', args);
```

### 3. Timeouts

```javascript
async requestWithTimeout(method, params, timeout = 30000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeout);
  });

  return Promise.race([
    this.request(method, params),
    timeoutPromise
  ]);
}
```

### 4. Retry Logic

```javascript
async requestWithRetry(method, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.request(method, params);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 🧪 Testing

### Test Script de Ejemplo

```javascript
async function testClient() {
  const client = new HttpMCPClient(
    'http://localhost:3000/mcp',
    process.env.GOOGLE_MAPS_API_KEY
  );

  console.log('🧪 Testing MCP Client...\n');

  try {
    // Test 1: Initialize
    console.log('Test 1: Initialize');
    const init = await client.initialize();
    console.log('✅ Session ID:', client.sessionId);

    // Test 2: List Tools
    console.log('\nTest 2: List Tools');
    const tools = await client.listTools();
    console.log('✅ Tools:', tools.length);

    // Test 3: Geocode
    console.log('\nTest 3: Geocode');
    const geocode = await client.callTool('maps_geocode', {
      address: 'Torre Eiffel, París'
    });
    console.log('✅ Result:', geocode.content[0].text);

    // Test 4: Search Nearby
    console.log('\nTest 4: Search Nearby');
    const search = await client.callTool('search_nearby', {
      center: { value: 'Times Square, NY', isCoordinates: false },
      radius: 1000,
      keyword: 'restaurant'
    });
    console.log('✅ Found places');

    // Close
    await client.close();
    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testClient();
```

## 📚 Recursos

- [Especificación MCP](https://spec.modelcontextprotocol.io/)
- [README.md](./README.md) - Documentación general
- [CLAUDE_DESKTOP.md](./CLAUDE_DESKTOP.md) - Configuración Claude Desktop
- [Repositorio GitHub](https://github.com/vicente-alvarado/mcp-google-map-stdio)

## 💬 Soporte

Si tienes problemas integrando este servidor con tu cliente:

- 🐛 [Reportar un issue](https://github.com/vicente-alvarado/mcp-google-map-stdio/issues)
- 💡 Revisa los ejemplos de código arriba
- 📧 Contacto: contacto@example.com

---

**¡Feliz integración!** 🚀
