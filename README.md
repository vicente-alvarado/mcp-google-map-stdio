# 🗺️ MCP Google Maps - stdio Edition

**Servidor MCP de Google Maps con soporte stdio para Claude Desktop**

[![npm version](https://badge.fury.io/js/%40vicente-alvarado%2Fmcp-google-map-stdio.svg)](https://badge.fury.io/js/%40vicente-alvarado%2Fmcp-google-map-stdio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Instalación

### Instalación Global (Recomendada)
```bash
npm install -g @vicente-alvarado/mcp-google-map-stdio
```

### Instalación Local
```bash
npm install @vicente-alvarado/mcp-google-map-stdio
```

## ⚡ Uso Rápido

### 1. Configurar API Key

**Opción A: Variables de entorno**
```bash
# Windows
set GOOGLE_MAPS_API_KEY=tu_api_key_aqui

# macOS/Linux
export GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

**Opción B: Archivo .env (recomendado para desarrollo)**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tu API key real
# GOOGLE_MAPS_API_KEY=tu_api_key_real_aqui
```

### 2. Configurar Claude Desktop

**Ubicación del archivo de configuración:**
- **Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Contenido del archivo:**
```json
{
  "mcpServers": {
    "google-maps": {
      "command": "mcp-google-maps-stdio",
      "env": {
        "GOOGLE_MAPS_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

### 3. Reiniciar Claude Desktop

¡Listo! Ya puedes usar Google Maps desde Claude Desktop.

## 🛠️ Herramientas Disponibles

- **📍 Geocoding**: Convertir direcciones a coordenadas
- **🔄 Reverse Geocoding**: Convertir coordenadas a direcciones  
- **🔍 Búsqueda de Lugares**: Encontrar lugares cercanos
- **🗺️ Direcciones**: Calcular rutas entre puntos
- **📏 Matriz de Distancias**: Calcular distancias entre múltiples puntos
- **⛰️ Elevación**: Obtener datos de elevación
- **📋 Detalles de Lugares**: Información detallada de lugares

## 📋 Requisitos

- **Node.js**: >= 18.0.0
- **Google Maps API Key**: Obtener en [Google Cloud Console](https://console.cloud.google.com/)
- **Claude Desktop**: Instalado y configurado

## 🔧 Configuración Avanzada

### Variables de Entorno
- `GOOGLE_MAPS_API_KEY`: Tu API key de Google Maps (requerida)
- `MCP_SERVER_PORT`: Puerto del servidor HTTP interno (opcional, default: 3000)

### Instalación desde Fuente
```bash
git clone https://github.com/vicente-alvarado/mcp-google-map-stdio.git
cd mcp-google-map-stdio
npm install
npm run install-global
```

## 🆚 Diferencias con el Proyecto Original

| Característica | Original (HTTP) | stdio Edition |
|---|---|---|
| **Transporte** | HTTP/SSE | stdio (JSON-RPC) |
| **Cliente** | Cualquier cliente HTTP | Solo Claude Desktop |
| **Instalación** | Local | Global + Local |
| **Dependencias** | Múltiples | Mínimas |
| **Uso** | Servidor web | Comando directo |

## 🐛 Solución de Problemas

### Error: "GOOGLE_MAPS_API_KEY not set"
```bash
# Verificar que la variable esté configurada
echo $GOOGLE_MAPS_API_KEY  # macOS/Linux
echo %GOOGLE_MAPS_API_KEY% # Windows
```

### Error: "Command not found: mcp-google-maps-stdio"
```bash
# Reinstalar globalmente
npm install -g @vicente-alvarado/mcp-google-map-stdio
```

### Claude Desktop no detecta el servidor
1. Verificar la configuración en `claude_desktop_config.json`
2. Reiniciar Claude Desktop completamente
3. Verificar que el comando `mcp-google-maps-stdio` funciona en terminal

## 📚 Documentación Completa

### Para Usuarios:
- **`CONFIGURACION_CLAUDE.md`**: Guía paso a paso para Claude Desktop
- **`INSTALACION.md`**: Instrucciones de instalación detalladas

### Para Desarrolladores:
- **`DOCUMENTACION_MCP.md`**: Documentación técnica del protocolo MCP
- **`src/`**: Código fuente completo del proyecto

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Basado en [mcp-google-map](https://github.com/cablate/mcp-google-map) original
- Adaptado para soporte stdio con Claude Desktop
- Wrapper desarrollado para compatibilidad total
