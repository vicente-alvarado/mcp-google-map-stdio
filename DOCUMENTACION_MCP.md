# 📚 Documentación del Protocolo MCP (Model Context Protocol)

## Índice
1. [¿Qué es MCP?](#qué-es-mcp)
2. [Arquitectura del Protocolo](#arquitectura-del-protocolo)
3. [Flujo de Comunicación](#flujo-de-comunicación)
4. [Formato de Mensajes](#formato-de-mensajes)
5. [Métodos del Protocolo](#métodos-del-protocolo)
6. [Ejemplo Práctico con Cliente](#ejemplo-práctico-con-cliente)
7. [Implementación de Herramientas](#implementación-de-herramientas)
8. [Manejo de Errores](#manejo-de-errores)

---

## ¿Qué es MCP?

**Model Context Protocol (MCP)** es un protocolo estandarizado creado por Anthropic para permitir que modelos de lenguaje (LLMs) se conecten y utilicen herramientas externas de forma uniforme y segura.

### Características principales:
- 🔌 **Protocolo abierto**: Basado en JSON-RPC 2.0
- 🔄 **Bidireccional**: Cliente y servidor pueden enviarse mensajes
- 🛠️ **Extensible**: Permite crear herramientas personalizadas
- 🔒 **Seguro**: Manejo de sesiones y autenticación
- 📡 **Múltiples transportes**: HTTP/SSE, stdio, WebSocket

---

## Arquitectura del Protocolo

```
┌─────────────────┐                    ┌─────────────────┐
│                 │                    │                 │
│  Cliente MCP    │◄──────────────────►│  Servidor MCP   │
│  (LLM/App)      │   JSON-RPC 2.0     │  (Herramientas) │
│                 │                    │                 │
└─────────────────┘                    └─────────────────┘
         │                                      │
         │                                      │
    ┌────▼────┐                          ┌─────▼──────┐
    │ Session │                          │   Tools    │
    │ Manager │                          │ (geocode,  │
    └─────────┘                          │  search,   │
                                         │  etc.)     │
                                         └────────────┘
```

### Componentes:

1. **Cliente MCP**: 
   - Aplicación que quiere usar herramientas
   - Puede ser Claude Desktop, tu app, etc.
   - Inicia y mantiene la sesión

2. **Servidor MCP**:
   - Expone herramientas a través del protocolo
   - Maneja la lógica de negocio
   - Valida parámetros y ejecuta acciones

3. **Transporte**:
   - HTTP con Server-Sent Events (SSE)
   - stdio (entrada/salida estándar)
   - WebSocket

---

## Flujo de Comunicación

### 1. Inicialización de Sesión

```
Cliente                                 Servidor
  │                                        │
  │──────── initialize request ──────────►│
  │         (capabilities, version)       │
  │                                        │
  │◄──────── initialize response ─────────│
  │         (server info, sessionId)      │
  │                                        │
  │──────── initialized notification ────►│
  │                                        │
```

### 2. Uso de Herramientas

```
Cliente                                 Servidor
  │                                        │
  │──────── tools/list request ──────────►│
  │                                        │
  │◄──────── tools/list response ─────────│
  │         (available tools)             │
  │                                        │
  │──────── tools/call request ──────────►│
  │         (tool name + params)          │
  │                                        │
  │◄──────── tools/call response ─────────│
  │         (tool result)                 │
  │                                        │
```

### 3. Cierre de Sesión

```
Cliente                                 Servidor
  │                                        │
  │──────── DELETE /mcp ─────────────────►│
  │         (with session-id)             │
  │                                        │
  │◄──────── 200 OK ──────────────────────│
  │                                        │
```

---

## Formato de Mensajes

Todos los mensajes siguen el estándar **JSON-RPC 2.0**:

### Request (Solicitud)
```json
{
  "jsonrpc": "2.0",
  "method": "nombre_del_metodo",
  "params": {
    "param1": "valor1",
    "param2": "valor2"
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

### Error Response (Respuesta con Error)
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid params"
  },
  "id": 1
}
```

### Notification (Notificación - sin ID)
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized",
  "params": {}
}
```

---

## Métodos del Protocolo

### Métodos de Inicialización

#### 1. `initialize`
**Propósito**: Iniciar una nueva sesión MCP

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": {
        "listChanged": true
      },
      "sampling": {}
    },
    "clientInfo": {
      "name": "mi-cliente-mcp",
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
      "name": "MCP-Server",
      "version": "0.0.1"
    }
  },
  "id": 1
}
```

**Headers importantes**:
- `Content-Type: application/json`
- `Accept: application/json, text/event-stream`
- `mcp-session-id`: (recibido en response header)

#### 2. `notifications/initialized`
**Propósito**: Notificar al servidor que el cliente está listo

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized",
  "params": {}
}
```

**No tiene response** (es una notificación)

---

### Métodos de Herramientas

#### 3. `tools/list`
**Propósito**: Obtener lista de herramientas disponibles

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
        "description": "Search for nearby places",
        "inputSchema": {
          "type": "object",
          "properties": {
            "center": {
              "type": "object",
              "description": "Search center point"
            },
            "keyword": {
              "type": "string",
              "description": "Search keyword"
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

#### 4. `tools/call`
**Propósito**: Ejecutar una herramienta específica

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "maps_geocode",
    "arguments": {
      "address": "Malecón 2000, Guayaquil, Ecuador"
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
        "text": "{\"lat\": -2.1894128, \"lng\": -79.8844071}"
      }
    ]
  },
  "id": 3
}
```

---

### Métodos de Logging (Opcional)

#### 5. `logging/setLevel`
**Propósito**: Configurar nivel de logging

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "logging/setLevel",
  "params": {
    "level": "debug"
  },
  "id": 4
}
```

---

## Ejemplo Práctico con Cliente

### Código Completo de Cliente JavaScript

```javascript
import 'dotenv/config';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MCP_URL = "http://localhost:3000/mcp";

class MCPClient {
  constructor(serverUrl, apiKey) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.sessionId = null;
    this.requestId = 0;
  }

  // Obtener siguiente ID de request
  getNextId() {
    return ++this.requestId;
  }

  // Hacer request al servidor
  async request(method, params = {}) {
    const payload = {
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: this.getNextId()
    };

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "X-Google-Maps-API-Key": this.apiKey
    };

    // Agregar session ID si ya existe
    if (this.sessionId) {
      headers["mcp-session-id"] = this.sessionId;
    }

    const response = await fetch(this.serverUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    // Capturar session ID en primera conexión
    if (!this.sessionId) {
      this.sessionId = response.headers.get("mcp-session-id");
    }

    // Parsear respuesta SSE
    const text = await response.text();
    return this.parseSSE(text);
  }

  // Parsear formato SSE
  parseSSE(text) {
    const lines = text.split('\n');
    const events = [];
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
        events.push(currentEvent);
        currentEvent = {};
      }
    }

    // Retornar el mensaje principal
    const messageEvent = events.find(e => e.event === 'message');
    return messageEvent ? messageEvent.data : null;
  }

  // Inicializar conexión MCP
  async initialize() {
    const response = await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        roots: { listChanged: true },
        sampling: {}
      },
      clientInfo: {
        name: "ejemplo-cliente-mcp",
        version: "1.0.0"
      }
    });

    console.log("✅ Conexión inicializada");
    console.log("   Session ID:", this.sessionId);
    console.log("   Server:", response.result.serverInfo.name);

    // Enviar notificación de inicialización
    await this.notify("notifications/initialized", {});
    
    return response;
  }

  // Enviar notificación (sin esperar respuesta)
  async notify(method, params = {}) {
    const payload = {
      jsonrpc: "2.0",
      method: method,
      params: params
    };

    await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": this.sessionId,
        "X-Google-Maps-API-Key": this.apiKey
      },
      body: JSON.stringify(payload)
    });
  }

  // Listar herramientas disponibles
  async listTools() {
    const response = await this.request("tools/list");
    return response.result.tools;
  }

  // Llamar una herramienta
  async callTool(toolName, args) {
    const response = await this.request("tools/call", {
      name: toolName,
      arguments: args
    });

    if (response.error) {
      throw new Error(`Tool error: ${response.error.message}`);
    }

    return response.result;
  }

  // Cerrar sesión
  async close() {
    if (!this.sessionId) return;

    await fetch(this.serverUrl, {
      method: "DELETE",
      headers: {
        "mcp-session-id": this.sessionId
      }
    });

    console.log("✅ Sesión cerrada");
  }
}

// Uso del cliente
async function main() {
  const client = new MCPClient(MCP_URL, API_KEY);

  try {
    // 1. Inicializar
    await client.initialize();

    // 2. Listar herramientas
    console.log("\n📋 Herramientas disponibles:");
    const tools = await client.listTools();
    tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });

    // 3. Usar una herramienta
    console.log("\n🔍 Geocodificando dirección...");
    const result = await client.callTool("maps_geocode", {
      address: "Malecón 2000, Guayaquil, Ecuador"
    });
    console.log("   Resultado:", result.content[0].text);

    // 4. Cerrar sesión
    await client.close();

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main();
```

---

## Implementación de Herramientas

### Estructura de una Herramienta

Cada herramienta debe definir:

1. **Nombre**: Identificador único
2. **Descripción**: Qué hace la herramienta
3. **Schema**: Validación de parámetros (usando Zod)
4. **Action**: Función que ejecuta la herramienta

### Ejemplo: Herramienta de Geocodificación

```typescript
import { z } from "zod";

const NAME = "maps_geocode";

const DESCRIPTION = "Convert addresses to coordinates";

const SCHEMA = {
  address: z.string().describe("Address to geocode"),
  region: z.string().optional().describe("Region bias")
};

type GeocodeParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: GeocodeParams) {
  try {
    // Lógica de la herramienta
    const apiKey = getCurrentApiKey();
    const client = new Client({ key: apiKey });
    
    const response = await client.geocode({
      params: { address: params.address }
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify(response.data.results[0].geometry.location)
      }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
}

export const Geocode = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION
};
```

### Registro de Herramientas

```typescript
const tools: ToolConfig[] = [
  {
    name: Geocode.NAME,
    description: Geocode.DESCRIPTION,
    schema: Geocode.SCHEMA,
    action: (params) => Geocode.ACTION(params)
  },
  // ... más herramientas
];

const server = new BaseMcpServer("MCP-Server", tools);
```

---

## Manejo de Errores

### Códigos de Error Estándar (JSON-RPC 2.0)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| -32700 | Parse error | JSON inválido |
| -32600 | Invalid Request | Request no válido |
| -32601 | Method not found | Método no existe |
| -32602 | Invalid params | Parámetros inválidos |
| -32603 | Internal error | Error interno del servidor |
| -32000 | Server error | Error personalizado del servidor |

### Ejemplo de Error

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid arguments for tool search_nearby",
    "data": {
      "validation_errors": [
        {
          "code": "invalid_type",
          "expected": "object",
          "received": "undefined",
          "path": ["center"],
          "message": "Required"
        }
      ]
    }
  },
  "id": 3
}
```

### Manejo en Cliente

```javascript
async callTool(toolName, args) {
  const response = await this.request("tools/call", {
    name: toolName,
    arguments: args
  });

  if (response.error) {
    console.error("❌ Error de herramienta:");
    console.error("   Código:", response.error.code);
    console.error("   Mensaje:", response.error.message);
    
    if (response.error.data) {
      console.error("   Detalles:", response.error.data);
    }
    
    throw new Error(response.error.message);
  }

  return response.result;
}
```

---

## Transporte HTTP + SSE

### ¿Por qué SSE (Server-Sent Events)?

MCP usa SSE para permitir:
- **Respuestas en tiempo real**: El servidor puede enviar múltiples mensajes
- **Notificaciones del servidor**: Logging, progreso, etc.
- **Streaming de datos**: Para respuestas grandes

### Formato SSE

```
event: message
data: {"jsonrpc":"2.0","result":{...},"id":1}

event: notification
data: {"jsonrpc":"2.0","method":"notification/progress","params":{...}}

```

### Headers Requeridos

```javascript
headers: {
  "Content-Type": "application/json",
  "Accept": "application/json, text/event-stream",  // ¡Importante!
  "mcp-session-id": "uuid-de-sesion"
}
```

---

## Buenas Prácticas

### 1. Manejo de Sesiones
```javascript
// ✅ Bueno: Reusar sesión
const client = new MCPClient(url, apiKey);
await client.initialize();
await client.callTool("tool1", {});
await client.callTool("tool2", {});
await client.close();

// ❌ Malo: Crear nueva sesión para cada llamada
for (const tool of tools) {
  const client = new MCPClient(url, apiKey);
  await client.initialize();
  await client.callTool(tool, {});
  await client.close();
}
```

### 2. Validación de Parámetros
```javascript
// ✅ Bueno: Validar antes de enviar
const args = {
  center: {
    value: "Guayaquil, Ecuador",
    isCoordinates: false
  },
  radius: 1000
};

// Validar que center existe
if (!args.center || !args.center.value) {
  throw new Error("center es requerido");
}

await client.callTool("search_nearby", args);
```

### 3. Manejo de Errores
```javascript
try {
  const result = await client.callTool("maps_geocode", {
    address: "dirección inválida"
  });
  
  // Verificar si hubo error en el resultado
  if (result.isError) {
    console.error("La herramienta reportó un error");
  }
} catch (error) {
  // Error de protocolo o red
  console.error("Error de comunicación:", error);
}
```

### 4. Timeout
```javascript
async requestWithTimeout(method, params, timeoutMs = 30000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
  });

  return Promise.race([
    this.request(method, params),
    timeoutPromise
  ]);
}
```

---

## Depuración

### 1. Logs del Cliente
```javascript
class MCPClient {
  constructor(serverUrl, apiKey, debug = false) {
    this.debug = debug;
    // ...
  }

  log(...args) {
    if (this.debug) {
      console.log("[MCP Client]", ...args);
    }
  }

  async request(method, params) {
    this.log("→ Request:", method, params);
    const response = await fetch(/* ... */);
    this.log("← Response:", response);
    return response;
  }
}

// Uso
const client = new MCPClient(url, apiKey, true); // debug = true
```

### 2. Inspeccionar Tráfico
```bash
# Usar curl para probar manualmente
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-Google-Maps-API-Key: YOUR_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    },
    "id": 1
  }'
```

---

## Recursos Adicionales

- **Especificación MCP**: https://spec.modelcontextprotocol.io/
- **SDK Oficial**: https://github.com/modelcontextprotocol/typescript-sdk
- **Ejemplos**: https://github.com/modelcontextprotocol/servers

---

## Siguientes Pasos

1. ✅ Entender el protocolo básico (este documento)
2. ⏭️ Integración con Claude Desktop
3. ⏭️ Crear herramientas personalizadas
4. ⏭️ Implementar autenticación avanzada
5. ⏭️ Optimización y escalabilidad

---

*Documentación generada para el proyecto mcp-google-map*
