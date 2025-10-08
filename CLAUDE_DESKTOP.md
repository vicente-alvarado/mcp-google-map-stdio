# 🤖 Configuración para Claude Desktop

Esta guía te muestra cómo configurar el servidor MCP Google Maps con Claude Desktop.

## 📋 Requisitos Previos

1. **Claude Desktop** instalado
2. **Node.js** >= 18.0.0 instalado
3. **API Key de Google Maps** (ver [README.md](./README.md#obtener-api-key-de-google-maps))
4. Este servidor instalado:
   ```bash
   npm install -g @vicente-alvarado/mcp-google-map-stdio
   ```

## ⚙️ Configuración

### Paso 1: Ubicar el Archivo de Configuración

Claude Desktop usa un archivo JSON para configurar servidores MCP.

**Ubicaciones según sistema operativo**:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Windows - Acceso Rápido**:
1. Presiona `Win + R`
2. Escribe: `%APPDATA%\Claude`
3. Busca o crea el archivo `claude_desktop_config.json`

### Paso 2: Configurar el Servidor

Edita `claude_desktop_config.json` y agrega la configuración del servidor MCP Google Maps.

#### Opción A: Con Instalación Global

Si instalaste el paquete globalmente con npm:

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "mcp-google-map-stdio",
      "args": ["--stdio"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "TU_API_KEY_AQUI"
      }
    }
  }
}
```

#### Opción B: Sin Instalación Global

Si prefieres usar la ruta directa al proyecto:

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node",
      "args": [
        "/ruta/completa/al/proyecto/dist/cli.js",
        "--stdio"
      ],
      "env": {
        "GOOGLE_MAPS_API_KEY": "TU_API_KEY_AQUI"
      }
    }
  }
}
```

**⚠️ Importante**:
- Reemplaza `TU_API_KEY_AQUI` con tu API key real de Google Maps
- En Windows, usa doble barra invertida: `C:\\Users\\...\\dist\\cli.js`
- En macOS/Linux, usa barras normales: `/Users/.../dist/cli.js`
- La ruta debe ser absoluta

#### Ejemplo Completo con Múltiples Servidores

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "mcp-google-map-stdio",
      "args": ["--stdio"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "TU_API_KEY_AQUI"
      }
    },
    "otro-servidor": {
      "command": "otro-servidor-mcp",
      "args": ["--stdio"]
    }
  }
}
```

### Paso 3: Reiniciar Claude Desktop

1. **Cierra completamente** Claude Desktop
   - No solo minimices la ventana
   - Cierra desde la bandeja del sistema si está ahí
2. Espera 2-3 segundos
3. **Vuelve a abrir** Claude Desktop

## ✅ Verificación

### 1. Verificar que las Herramientas Están Disponibles

En Claude Desktop, escribe:

```
¿Qué herramientas tienes disponibles?
```

o

```
¿Tienes herramientas de Google Maps?
```

**Resultado esperado**: Claude debe listar estas 7 herramientas:

- `search_nearby` - Buscar lugares cercanos
- `get_place_details` - Obtener detalles de un lugar
- `maps_geocode` - Convertir direcciones a coordenadas
- `maps_reverse_geocode` - Convertir coordenadas a direcciones
- `maps_distance_matrix` - Calcular distancias y tiempos
- `maps_directions` - Obtener direcciones entre puntos
- `maps_elevation` - Obtener elevación de ubicaciones

### 2. Probar una Herramienta

Intenta con una pregunta simple:

```
¿Cuáles son las coordenadas de la Torre Eiffel?
```

Claude debería:
1. Mencionar que va a usar la herramienta `maps_geocode`
2. Devolver las coordenadas (aproximadamente 48.8584° N, 2.2945° E)

## 🎯 Ejemplos de Uso

### Búsqueda de Lugares

```
Busca cafeterías cerca del Rockefeller Center en Nueva York
```

```
Encuentra restaurantes italianos con buena calificación cerca de Times Square
```

### Geocodificación

```
¿Cuáles son las coordenadas de la Casa Blanca en Washington DC?
```

```
Dame la ubicación exacta del Empire State Building
```

### Reverse Geocoding

```
¿Qué lugar está en las coordenadas 40.7128° N, 74.0060° W?
```

### Direcciones

```
¿Cómo llego desde el Aeropuerto JFK a Manhattan?
```

```
Dame instrucciones para ir de Central Park al Metropolitan Museum of Art caminando
```

### Distancias

```
¿Cuánto tiempo toma ir de Brooklyn a Manhattan en auto?
```

```
¿A qué distancia está el Bronx de Queens?
```

### Detalles de Lugares

```
Dame información completa sobre el Museo de Historia Natural de Nueva York
```

## 🐛 Solución de Problemas

### Problema 1: Las Herramientas No Aparecen

**Síntomas**: Claude no lista las herramientas de Google Maps

**Soluciones**:

1. **Verifica la sintaxis del JSON**:
   ```bash
   # Windows (PowerShell)
   Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json
   
   # macOS/Linux
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
   ```
   Si hay errores, corrige la sintaxis (comas, llaves, comillas)

2. **Verifica la ruta del comando**:
   ```bash
   # Con instalación global
   which mcp-google-map-stdio  # macOS/Linux
   where mcp-google-map-stdio  # Windows
   
   # Sin instalación global
   node /ruta/completa/dist/cli.js --version
   ```

3. **Revisa los logs de Claude Desktop**:
   - **Windows**: `%APPDATA%\Claude\logs\`
   - **macOS**: `~/Library/Logs/Claude/`
   - **Linux**: `~/.config/Claude/logs/`
   
   Busca el archivo más reciente y ábrelo para ver errores.

4. **Prueba el servidor manualmente**:
   ```bash
   # Windows (PowerShell)
   $env:GOOGLE_MAPS_API_KEY="tu_key"; mcp-google-map-stdio --stdio
   
   # macOS/Linux
   GOOGLE_MAPS_API_KEY="tu_key" mcp-google-map-stdio --stdio
   ```
   
   Presiona `Ctrl+C` para salir.

### Problema 2: Error de API Key

**Síntomas**: Las herramientas aparecen pero devuelven errores al usarse

**Soluciones**:

1. **Verifica que la API key sea correcta**:
   - No debe tener espacios extra
   - Debe estar entre comillas en el JSON
   - Copia directamente desde Google Cloud Console

2. **Verifica que las APIs estén habilitadas** en Google Cloud:
   - Places API (New)
   - Geocoding API
   - Directions API
   - Distance Matrix API
   - Elevation API

3. **Verifica restricciones de la API key**:
   - La API key no debe estar restringida por IP si usas localhost
   - Debe permitir las APIs mencionadas arriba

### Problema 3: Claude Desktop No Inicia

**Síntomas**: Claude Desktop se cierra inmediatamente

**Soluciones**:

1. **Revisa la sintaxis del JSON**:
   - Usa un validador JSON online
   - Verifica que todas las llaves `{}` estén cerradas
   - Verifica que todas las comas estén en el lugar correcto

2. **Prueba con configuración vacía**:
   ```json
   {
     "mcpServers": {}
   }
   ```
   Si Claude inicia, el problema está en la configuración del servidor.

3. **Elimina la configuración temporalmente**:
   - Renombra `claude_desktop_config.json` a `claude_desktop_config.json.backup`
   - Inicia Claude Desktop
   - Si funciona, el problema está en la configuración

### Problema 4: Node.js No Encontrado

**Síntomas**: Error "node is not recognized" o "node: command not found"

**Soluciones**:

1. **Verifica que Node.js esté instalado**:
   ```bash
   node --version
   ```
   Debe mostrar v18.0.0 o superior

2. **Si no está instalado**, descarga desde: https://nodejs.org/

3. **Si está instalado pero no se encuentra**, usa la ruta completa:
   ```json
   {
     "mcpServers": {
       "google-maps": {
         "command": "C:\\Program Files\\nodejs\\node.exe",
         "args": ["/ruta/al/proyecto/dist/cli.js", "--stdio"],
         "env": {
           "GOOGLE_MAPS_API_KEY": "TU_API_KEY_AQUI"
         }
       }
     }
   }
   ```

## 🔍 Debugging Avanzado

### Ver Logs del Servidor en Tiempo Real

Si necesitas ver qué está pasando en el servidor:

```bash
# Ejecutar el servidor manualmente con logs a archivo
GOOGLE_MAPS_API_KEY="tu_key" mcp-google-map-stdio --stdio 2> server.log

# En otra terminal, monitorear los logs
tail -f server.log  # macOS/Linux
Get-Content server.log -Wait  # Windows PowerShell
```

### Test Rápido

Usa el script de test incluido:

```bash
cd /ruta/al/proyecto
node test-stdio.js
```

Debe mostrar "Test EXITOSO" si todo funciona.

## 📚 Recursos Adicionales

- [README.md](./README.md) - Documentación general
- [MCP_USAGE.md](./MCP_USAGE.md) - Uso con otros clientes MCP
- [Documentación de MCP](https://modelcontextprotocol.io/)
- [Google Maps Platform](https://developers.google.com/maps)

## ✅ Checklist de Configuración

Antes de usar con Claude Desktop:

- [ ] Node.js >= 18.0.0 instalado
- [ ] Servidor instalado globalmente o build compilado
- [ ] API key de Google Maps obtenida
- [ ] APIs necesarias habilitadas en Google Cloud
- [ ] `claude_desktop_config.json` creado/editado
- [ ] API key agregada a la configuración (SIN espacios extra)
- [ ] Claude Desktop reiniciado completamente
- [ ] Herramientas visibles al preguntar a Claude
- [ ] Al menos una herramienta probada con éxito

## 💡 Consejos

- **Seguridad**: No compartas screenshots de tu configuración que muestren tu API key
- **Performance**: Claude Desktop mantiene una sesión con el servidor, no hay necesidad de reconectar
- **Debugging**: Si algo no funciona, revisa primero los logs de Claude Desktop
- **Actualizaciones**: Para actualizar el servidor, ejecuta `npm update -g @vicente-alvarado/mcp-google-map-stdio` y reinicia Claude

---

¡Disfruta usando Google Maps con Claude Desktop! 🗺️✨
