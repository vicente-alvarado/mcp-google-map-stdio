# 🗺️ MCP Google Maps Server

[![npm version](https://img.shields.io/npm/v/@vicente-alvarado/mcp-google-map-stdio.svg)](https://www.npmjs.com/package/@vicente-alvarado/mcp-google-map-stdio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Un servidor MCP (Model Context Protocol) para Google Maps que proporciona acceso a servicios de mapas, geocodificación, búsqueda de lugares y navegación.

## ✨ Características

- 🔌 **STDIO Nativo**: Comunicación directa sin proxies ni wrappers
- 🌐 **Modo HTTP**: También soporta HTTP para desarrollo y testing
- 🗺️ **APIs Completas**: Places, Geocoding, Directions, Distance Matrix y Elevation
- 🚀 **Alto Rendimiento**: Comunicación optimizada y sin latencias adicionales
- 🛡️ **Robusto**: Manejo de errores y validación de parámetros
- 📦 **Fácil de instalar**: Instalación via npm

## 📋 Requisitos

- Node.js >= 18.0.0
- API Key de Google Maps ([obtener aquí](#obtener-api-key-de-google-maps))

## 🚀 Instalación

### Opción 1: Instalación Global (Recomendado)

```bash
npm install -g @vicente-alvarado/mcp-google-map-stdio
```

### Opción 2: Desde el Repositorio

```bash
git clone https://github.com/vicente-alvarado/mcp-google-map-stdio.git
cd mcp-google-map-stdio
npm install
npm run build
npm install -g .
```

### Verificar Instalación

```bash
mcp-google-map-stdio --version
```

## 🔑 Obtener API Key de Google Maps

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente
3. Habilita las siguientes APIs:
   - **Places API (New)**
   - **Geocoding API**
   - **Directions API**
   - **Distance Matrix API**
   - **Elevation API**
4. Ve a "Credenciales" y crea una API Key
5. (Recomendado) Restringe la API key solo a las APIs habilitadas

**⚠️ Importante**: Nunca expongas tu API key en código fuente público. Usa variables de entorno.

## 🎯 Uso

Este servidor soporta dos modos de operación:

### Para Claude Desktop

Si quieres usar este servidor con Claude Desktop, consulta la guía específica:

📖 **[Guía de Configuración para Claude Desktop](./CLAUDE_DESKTOP.md)**

### Para Otros Clientes MCP

Si quieres integrar este servidor con tu propio cliente MCP:

📖 **[Guía de Uso con Clientes MCP](./MCP_USAGE.md)**

## 🛠️ Herramientas Disponibles

### `search_nearby`
Busca lugares cercanos a una ubicación específica.

**Parámetros**:
- `center`: Ubicación central (dirección o coordenadas)
- `radius`: Radio de búsqueda en metros (default: 1000)
- `keyword`: Palabra clave para filtrar (opcional)
- `minRating`: Calificación mínima (opcional)
- `openNow`: Solo lugares abiertos ahora (opcional)

**Ejemplo**: Buscar restaurantes cerca de Times Square

---

### `get_place_details`
Obtiene información detallada de un lugar específico.

**Parámetros**:
- `placeId`: ID del lugar de Google Maps

**Ejemplo**: Obtener detalles del Empire State Building

---

### `maps_geocode`
Convierte direcciones en coordenadas geográficas.

**Parámetros**:
- `address`: Dirección a geocodificar

**Ejemplo**: Obtener coordenadas de "Torre Eiffel, París"

---

### `maps_reverse_geocode`
Convierte coordenadas en direcciones legibles.

**Parámetros**:
- `latitude`: Latitud
- `longitude`: Longitud

**Ejemplo**: Obtener dirección de (40.7128, -74.0060)

---

### `maps_distance_matrix`
Calcula distancias y tiempos entre múltiples puntos.

**Parámetros**:
- `origins`: Lista de puntos de origen
- `destinations`: Lista de puntos de destino
- `mode`: Modo de viaje (driving, walking, bicycling, transit)

**Ejemplo**: Calcular tiempo de Manhattan a Brooklyn

---

### `maps_directions`
Obtiene direcciones detalladas entre dos puntos.

**Parámetros**:
- `origin`: Punto de partida
- `destination`: Punto de llegada
- `mode`: Modo de viaje (driving, walking, bicycling, transit)
- `departure_time`: Hora de salida (opcional)
- `arrival_time`: Hora de llegada (opcional)

**Ejemplo**: Direcciones del JFK a Times Square

---

### `maps_elevation`
Obtiene información de elevación de ubicaciones.

**Parámetros**:
- `locations`: Lista de ubicaciones (coordenadas)

**Ejemplo**: Obtener elevación del Monte Everest

## 🧪 Testing

### Test Rápido (STDIO)

```bash
# Ejecutar el servidor en modo STDIO
GOOGLE_MAPS_API_KEY="tu_api_key" mcp-google-map-stdio --stdio

# O usar el script de test incluido
node test-stdio.js
```

### Test en Modo HTTP (Desarrollo)

```bash
# Iniciar servidor HTTP
GOOGLE_MAPS_API_KEY="tu_api_key" MCP_SERVER_PORT=3000 mcp-google-map-stdio

# Probar con curl
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "X-Google-Maps-API-Key: tu_api_key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## 🏗️ Arquitectura

### Modo STDIO (Para MCP Clients como Claude Desktop)

```
MCP Client (Claude Desktop)
    ↓ stdin (JSON-RPC messages)
    ↓
BaseMcpServer (StdioServerTransport)
    ↓ Google Maps APIs
    ↓ stdout (JSON-RPC responses)
    ↓
MCP Client
```

### Modo HTTP (Para Desarrollo/Testing)

```
HTTP Client
    ↓ HTTP POST
    ↓
BaseMcpServer (HTTP :3000)
    ↓ Google Maps APIs
    ↓ HTTP Response
    ↓
HTTP Client
```

## 🔧 Desarrollo

### Estructura del Proyecto

```
mcp-google-map-stdio/
├── src/
│   ├── cli.ts                 # CLI principal
│   ├── index.ts               # Exports
│   ├── config.ts              # Configuración
│   ├── core/
│   │   └── BaseMcpServer.ts   # Servidor MCP base
│   ├── services/
│   │   ├── PlacesSearcher.ts  # Servicio de búsqueda
│   │   └── toolclass.ts       # Clase base herramientas
│   ├── tools/
│   │   └── maps/              # Implementación herramientas
│   └── utils/
│       ├── apiKeyManager.ts   # Gestión API keys
│       └── requestContext.ts  # Contexto requests
├── dist/                      # Build output
└── test-stdio.js              # Script de test
```

### Scripts Disponibles

```bash
npm run build        # Construir el proyecto
npm start            # Iniciar en modo HTTP
npm run start:stdio  # Iniciar en modo STDIO
npm run dev          # Desarrollo con watch mode
```

### Crear Tu Propia Herramienta

```typescript
import { z } from "zod";

export const MiHerramienta = {
  NAME: "mi_herramienta",
  DESCRIPTION: "Descripción de mi herramienta",
  SCHEMA: {
    param1: z.string().describe("Descripción parámetro 1"),
    param2: z.number().optional().describe("Descripción parámetro 2")
  },
  ACTION: async (params: any) => {
    // Lógica de tu herramienta
    return {
      content: [{
        type: "text",
        text: JSON.stringify(resultado)
      }],
      isError: false
    };
  }
};
```

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Add: Nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📝 Changelog

### v1.0.1 (2025-01-08)
- ✅ Implementación nativa de STDIO con StdioServerTransport
- ✅ Eliminado wrapper HTTP innecesario
- ✅ Logs correctos (stderr para logs, stdout para JSON-RPC)
- ✅ Mejor rendimiento (~80-180ms más rápido)
- ✅ Arquitectura simplificada
- ✅ Documentación reorganizada

### v1.0.0 (2025-01-07)
- 🎉 Release inicial
- ✅ Soporte HTTP básico
- ✅ 7 herramientas de Google Maps

## 📄 Licencia

Este proyecto está bajo la licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- [Anthropic](https://www.anthropic.com/) por Claude y el protocolo MCP
- [Google Maps Platform](https://developers.google.com/maps) por las APIs
- La comunidad de código abierto

## 📞 Soporte

- 🐛 [Reportar un bug](https://github.com/vicente-alvarado/mcp-google-map-stdio/issues)
- 💡 [Solicitar una feature](https://github.com/vicente-alvarado/mcp-google-map-stdio/issues)
- 📧 Email: contacto@example.com

## ⚠️ Importante

- **API Key**: Nunca compartas tu API key públicamente
- **Costos**: Las APIs de Google Maps pueden tener costos asociados
- **Límites**: Revisa los límites de uso en Google Cloud Console
- **Seguridad**: Restringe tu API key solo a las APIs necesarias

---

**Hecho con ❤️ para la comunidad MCP**
