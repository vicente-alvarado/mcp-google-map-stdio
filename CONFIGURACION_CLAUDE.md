# 🗺️ Configuración de Claude Desktop con Google Maps MCP

## 📋 Configuración Actualizada (Modo STDIO Nativo)

Este servidor ahora soporta **STDIO nativo**, eliminando la necesidad de un wrapper HTTP.

### ✅ Ventajas de la nueva implementación:

- 🚀 **Más rápido**: Sin latencia de HTTP (~80-180ms más rápido)
- 🧹 **Más simple**: Sin procesos intermedios
- 🛡️ **Más robusto**: Menos puntos de fallo
- ✅ **Nativo**: Usa el SDK de MCP correctamente

---

## 🚀 Instalación

### Opción 1: Instalación Global (Recomendado)

```bash
# Desde el directorio del proyecto
npm install -g .

# Verificar instalación
mcp-google-map-stdio --version
```

### Opción 2: Usar desde el directorio del proyecto

No es necesario instalar globalmente, puedes usar la ruta completa al ejecutable.

---

## ⚙️ Configuración de Claude Desktop

### 1. Ubicar el archivo de configuración

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 2. Configuración con instalación global

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

### 3. Configuración sin instalación global

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node",
      "args": [
        "D:\\ruta\\completa\\al\\proyecto\\dist\\cli.js",
        "--stdio"
      ],
      "env": {
        "GOOGLE_MAPS_API_KEY": "TU_API_KEY_AQUI"
      }
    }
  }
}
```

**Importante**: 
- Reemplaza `TU_API_KEY_AQUI` con tu API key de Google Maps
- En Windows, usa doble barra invertida `\\` en las rutas
- La ruta debe ser absoluta

---

## 🔑 Obtener API Key de Google Maps

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente
3. Habilita las siguientes APIs:
   - Places API
   - Geocoding API
   - Directions API
   - Distance Matrix API
   - Elevation API
4. Ve a "Credenciales" y crea una API key
5. (Opcional) Restringe la API key a las APIs habilitadas arriba

---

## 🧪 Verificación

### 1. Reiniciar Claude Desktop

Cierra completamente Claude Desktop y vuelve a abrirlo.

### 2. Verificar herramientas disponibles

En Claude Desktop, pregunta:

```
¿Qué herramientas de mapas tienes disponibles?
```

Deberías ver listadas:
- `search_nearby` - Buscar lugares cercanos
- `get_place_details` - Obtener detalles de un lugar
- `maps_geocode` - Convertir direcciones a coordenadas
- `maps_reverse_geocode` - Convertir coordenadas a direcciones
- `maps_distance_matrix` - Calcular distancias y tiempos
- `maps_directions` - Obtener direcciones entre puntos
- `maps_elevation` - Obtener elevación de ubicaciones

### 3. Probar una herramienta

```
¿Cuáles son las coordenadas de la Torre Eiffel?
```

Claude debería usar la herramienta `maps_geocode` y devolver las coordenadas.

---

## 🐛 Solución de Problemas

### Las herramientas no aparecen en Claude

**Problema**: Claude no muestra las herramientas de Google Maps

**Soluciones**:

1. **Verifica la sintaxis del JSON**:
   ```bash
   # Windows (PowerShell)
   Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json
   
   # macOS/Linux
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
   ```

2. **Verifica que el comando sea correcto**:
   ```bash
   # Con instalación global
   mcp-google-map-stdio --version
   
   # Sin instalación global
   node D:\ruta\al\proyecto\dist\cli.js --version
   ```

3. **Revisa los logs de Claude Desktop**:
   - Windows: `%APPDATA%\Claude\logs\`
   - macOS: `~/Library/Logs/Claude/`
   - Linux: `~/.config/Claude/logs/`

### Error: API Key inválida

**Problema**: El servidor responde con errores de API key

**Soluciones**:

1. Verifica que la API key sea correcta
2. Asegúrate de que las APIs necesarias estén habilitadas en Google Cloud
3. Verifica que la API key no tenga restricciones que impidan su uso

### El servidor no inicia

**Problema**: Claude muestra error al conectarse con el servidor

**Soluciones**:

1. **Verifica que Node.js esté instalado**:
   ```bash
   node --version
   # Debe ser >= 18.0.0
   ```

2. **Prueba el servidor manualmente**:
   ```bash
   cd D:\ruta\al\proyecto
   npm run start:stdio
   ```

3. **Verifica que el build esté actualizado**:
   ```bash
   npm run build
   ```

### Logs para debugging

Si necesitas ver los logs del servidor:

```bash
# Ejecutar manualmente y redirigir stderr a un archivo
node dist/cli.js --stdio 2> server.log

# En otra terminal, revisa los logs en tiempo real
tail -f server.log  # macOS/Linux
Get-Content server.log -Wait  # Windows PowerShell
```

---

## 📚 Ejemplos de Uso

### Búsqueda de lugares

```
Búscame restaurantes italianos cerca del Rockefeller Center en Nueva York
```

### Direcciones

```
¿Cómo llego en auto desde el Aeropuerto JFK a Times Square?
```

### Geocoding

```
¿Cuáles son las coordenadas exactas de la Casa Blanca?
```

### Reverse Geocoding

```
¿Qué lugar está en las coordenadas 40.7128° N, 74.0060° W?
```

### Detalles de lugar

```
Dame información completa sobre el Empire State Building, incluyendo horarios y calificación
```

---

## 🔄 Actualización

Para actualizar a la última versión:

```bash
# Si instalaste globalmente
cd D:\ruta\al\proyecto
git pull
npm run build
npm install -g .

# Si usas ruta directa, solo necesitas:
git pull
npm run build
```

Reinicia Claude Desktop después de actualizar.

---

## 📖 Recursos Adicionales

- [Documentación de MCP](https://modelcontextprotocol.io/)
- [Google Maps Platform](https://developers.google.com/maps)
- [Repositorio en GitHub](https://github.com/vicente-alvarado/mcp-google-map-stdio)

---

## 💡 Notas Importantes

- **Modo STDIO vs HTTP**: Este servidor soporta ambos modos. STDIO es para Claude Desktop, HTTP es para desarrollo/testing.
- **API Key**: Nunca compartas tu API key públicamente. Usa variables de entorno.
- **Costos**: Google Maps APIs pueden tener costos asociados. Revisa los precios en Google Cloud.
- **Rate Limits**: Ten en cuenta los límites de uso de las APIs de Google Maps.

---

## ✅ Checklist de Configuración

Antes de usar el servidor con Claude Desktop:

- [ ] Node.js >= 18.0.0 instalado
- [ ] Proyecto construido con `npm run build`
- [ ] API key de Google Maps obtenida
- [ ] APIs necesarias habilitadas en Google Cloud
- [ ] `claude_desktop_config.json` configurado correctamente
- [ ] Claude Desktop reiniciado
- [ ] Herramientas visibles en Claude Desktop
- [ ] Al menos una herramienta probada con éxito

¡Disfruta usando Google Maps con Claude Desktop! 🗺️✨
