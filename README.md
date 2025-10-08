# 🗺️ MCP Google Maps Server (STDIO)

[![npm version](https://img.shields.io/npm/v/@vicente-alvarado/mcp-google-map-stdio.svg)](https://www.npmjs.com/package/@vicente-alvarado/mcp-google-map-stdio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Un servidor MCP (Model Context Protocol) para Google Maps con soporte nativo de STDIO, diseñado específicamente para Claude Desktop.

## ✨ Características

- 🔌 **STDIO Nativo**: Comunicación directa con Claude Desktop sin wrappers
- 🌐 **Modo HTTP**: También soporta HTTP para desarrollo y testing
- 🗺️ **APIs Completas**: Acceso a Places, Geocoding, Directions, Distance Matrix y Elevation
- 🚀 **Alto Rendimiento**: ~80-180ms más rápido que soluciones con proxy
- 🛡️ **Robusto**: Sin puntos de fallo intermedios
- 📦 **Fácil de instalar**: Instalación global con npm

## 🚀 Inicio Rápido

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/vicente-alvarado/mcp-google-map-stdio.git
cd mcp-google-map-stdio

# Instalar dependencias
npm install

# Construir el proyecto
npm run build

# Instalar globalmente (opcional)
npm install -g .
```

### Configuración de Claude Desktop

1. Edita el archivo de configuración de Claude Desktop:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Agrega la siguiente configuración:

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "mcp-google-map-stdio",
      "args": ["--stdio"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

3. Reinicia Claude Desktop

## 🔑 Obtener API Key de Google Maps

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente
3. Habilita las siguientes APIs:
   - Places API (New)
   - Geocoding API
   - Directions API
   - Distance Matrix API
   - Elevation API
4. Ve a "Credenciales" y crea una API key
5. Copia la API key y úsala en la configuración

## 🛠️ Herramientas Disponibles

### `search_nearby`
Busca lugares cercanos a una ubicación.

**Ejemplo**: "Busca cafeterías cerca de Times Square"

### `get_place_details`
Obtiene información detallada de un lugar específico.

**Ejemplo**: "Dame detalles del Empire State Building"

### `maps_geocode`
Convierte direcciones en coordenadas geográficas.

**Ejemplo**: "¿Cuáles son las coordenadas de la Torre Eiffel?"

### `maps_reverse_geocode`
Convierte coordenadas en direcciones legibles.

**Ejemplo**: "¿Qué hay en las coordenadas 40.7128° N, 74.0060° W?"

### `maps_distance_matrix`
Calcula distancias y tiempos entre múltiples puntos.

**Ejemplo**: "¿Cuánto tardo de Manhattan a Brooklyn?"

### `maps_directions`
Obtiene direcciones detalladas entre dos puntos.

**Ejemplo**: "¿Cómo llego del JFK a Times Square?"

### `maps_elevation`
Obtiene información de elevación de ubicaciones.

**Ejemplo**: "¿Cuál es la elevación del Monte Everest?"

## 📖 Documentación Completa

- [Configuración de Claude Desktop](./CONFIGURACION_CLAUDE.md)
- [Guía de Instalación](./INSTALACION.md)
- [Documentación de MCP](./DOCUMENTACION_MCP.md)

## 🧪 Testing

### Test en modo STDIO

```bash
# Ejecutar el servidor en modo STDIO
npm run start:stdio

# O ejecutar el script de test
node test-stdio.js
```

### Test en modo HTTP

```bash
# Iniciar servidor HTTP
npm start

# En otra terminal, probar con curl
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "X-Google-Maps-API-Key: tu_api_key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## 🏗️ Arquitectura

### Modo STDIO (Para Claude Desktop)

```
Claude Desktop
    ↓ stdin (JSON-RPC)
    ↓
BaseMcpServer (STDIO)
    ↓ Google Maps APIs
    ↓
    ↓ stdout (JSON-RPC responses)
    ↓
Claude Desktop
```

### Modo HTTP (Para desarrollo)

```
HTTP Client
    ↓ HTTP POST
    ↓
BaseMcpServer (HTTP :3000)
    ↓ Google Maps APIs
    ↓
    ↓ HTTP Response
    ↓
HTTP Client
```

## 🔧 Desarrollo

### Estructura del proyecto

```
mcp-google-map-stdio/
├── src/
│   ├── cli.ts                 # CLI principal con soporte STDIO/HTTP
│   ├── index.ts               # Exports principales
│   ├── config.ts              # Configuración del servidor
│   ├── core/
│   │   └── BaseMcpServer.ts   # Servidor MCP base
│   ├── services/
│   │   ├── PlacesSearcher.ts  # Servicio de búsqueda de lugares
│   │   └── toolclass.ts       # Clase base para herramientas
│   ├── tools/
│   │   └── maps/              # Implementación de herramientas
│   └── utils/
│       ├── apiKeyManager.ts   # Gestión de API keys
│       └── requestContext.ts  # Contexto de requests
├── dist/                      # Build output
├── test-stdio.js              # Script de test STDIO
└── package.json
```

### Scripts disponibles

```bash
npm run build        # Construir el proyecto
npm start            # Iniciar en modo HTTP
npm run start:stdio  # Iniciar en modo STDIO
npm run dev          # Desarrollo con watch mode
```

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Changelog

### v1.0.1 (2025-01-08)
- ✅ Implementación nativa de STDIO usando StdioServerTransport
- ✅ Eliminado wrapper HTTP innecesario
- ✅ Logs correctos (stderr para logs, stdout para JSON-RPC)
- ✅ Mejor rendimiento (~80-180ms más rápido)
- ✅ Arquitectura simplificada

### v1.0.0 (2025-01-07)
- 🎉 Release inicial
- ✅ Soporte básico HTTP
- ✅ Wrapper STDIO experimental

## 📄 Licencia

Este proyecto está bajo la licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- [Anthropic](https://www.anthropic.com/) por Claude y el protocolo MCP
- [Google Maps Platform](https://developers.google.com/maps) por las APIs
- La comunidad de código abierto

## 📞 Soporte

- 🐛 [Reportar un bug](https://github.com/vicente-alvarado/mcp-google-map-stdio/issues)
- 💡 [Solicitar una feature](https://github.com/vicente-alvarado/mcp-google-map-stdio/issues)
- 📧 Email: vicente.alvarado@example.com

## 🌟 Star History

Si este proyecto te ha sido útil, considera darle una estrella en GitHub! ⭐

---

**Hecho con ❤️ para la comunidad de Claude Desktop**
