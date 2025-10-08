# 🚀 Guía Completa: Integrar MCP Google Maps con Claude Desktop

## 📋 Resumen

El servidor `mcp-google-map` solo soporta **HTTP**, pero Claude Desktop requiere **stdio**. Esta guía te muestra cómo usar un **wrapper** para conectar ambos sin modificar el repositorio original.

---

## ✅ Solución: Wrapper stdio → HTTP

Creamos un archivo `mcp-stdio-wrapper.js` que:
1. Se comunica con Claude Desktop por **stdin/stdout** (stdio)
2. Inicia el servidor HTTP en segundo plano
3. Traduce mensajes entre stdio y HTTP
4. Mantiene las sesiones y el estado

```
Claude Desktop (stdio) ←→ Wrapper ←→ HTTP Server ←→ Google Maps API
```

---

## 🛠️ Instalación (Paso a Paso)

### Paso 1: Verificar que todo está compilado

```bash
cd D:\mcp-demo\mcp-google-map
npm install
npm run build
```

Debe crear el directorio `dist/` con el archivo `cli.js`

### Paso 2: Verificar que el wrapper existe

El archivo `mcp-stdio-wrapper.js` debe estar en la raíz del proyecto:

```bash
dir mcp-stdio-wrapper.js  # Windows
ls mcp-stdio-wrapper.js   # macOS/Linux
```

Si no existe, revisa que lo hayas creado correctamente.

### Paso 3: Probar el wrapper manualmente (Recomendado)

Antes de configurar Claude, prueba que el wrapper funciona:

```bash
node test-wrapper.js
```

Deberías ver:
```
🧪 Testing MCP stdio wrapper...
📋 STDERR: [Wrapper] Starting MCP stdio wrapper...
📋 STDERR: [HTTP Server] ✅ [MCP-Server] MCP Server started successfully!
📥 STDOUT: {"result":{"protocolVersion":"2024-11-05",...
```

Si ves esto, ¡el wrapper funciona! ✅

### Paso 4: Configurar Claude Desktop

#### 4.1 Ubicar el archivo de configuración

**Windows**:
```
C:\Users\TU_USUARIO\AppData\Roaming\Claude\claude_desktop_config.json
```

**Abrir rápidamente (PowerShell)**:
```powershell
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

**macOS**:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Abrir rápidamente (Terminal)**:
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

#### 4.2 Agregar la configuración

**IMPORTANTE**: Ajusta la ruta según tu instalación.

**Para Windows**:
```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node",
      "args": [
        "D:\\mcp-demo\\mcp-google-map\\mcp-stdio-wrapper.js"
      ],
      "env": {
        "GOOGLE_MAPS_API_KEY": "TU_API_KEY_AQUI",
        "MCP_SERVER_PORT": "3000"
      }
    }
  }
}
```

**Para macOS/Linux**:
```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node",
      "args": [
        "/Users/tu-usuario/mcp-demo/mcp-google-map/mcp-stdio-wrapper.js"
      ],
      "env": {
        "GOOGLE_MAPS_API_KEY": "TU_API_KEY_AQUI",
        "MCP_SERVER_PORT": "3000"
      }
    }
  }
}
```

**⚠️ Notas Importantes**:
- En **Windows**, usa **doble backslash** (`\\`)
- Reemplaza `D:\\mcp-demo\\mcp-google-map` con **TU ruta completa**
- Usa **TU API Key** de Google Maps
- Guarda el archivo como **UTF-8**

#### 4.3 Validar el JSON

Copia tu configuración y pégala en: https://jsonlint.com/

Asegúrate de que no tenga errores de sintaxis.

### Paso 5: Reiniciar Claude Desktop

**Muy Importante**: Debes cerrar Claude **completamente**.

#### En Windows:
1. Cierra todas las ventanas de Claude
2. En la **bandeja del sistema** (system tray), busca el ícono de Claude
3. **Click derecho** → **Quit** o **Salir**
4. Verifica que el proceso esté cerrado:
   ```powershell
   Get-Process -Name "Claude" -ErrorAction SilentlyContinue
   ```
   No debe mostrar nada.

#### En macOS:
1. Presiona **Cmd + Q** (no solo cerrar ventana)
2. O desde el menú: **Claude → Quit Claude**

### Paso 6: Abrir Claude Desktop

Abre Claude Desktop normalmente. Cargará la configuración automáticamente.

### Paso 7: Verificar que funciona

En Claude Desktop, escribe:

```
¿Qué herramientas tienes disponibles?
```

**Respuesta esperada de Claude**:
```
Tengo acceso a varias herramientas de Google Maps:
- search_nearby: Buscar lugares cercanos
- get_place_details: Obtener detalles de lugares
- maps_geocode: Convertir direcciones a coordenadas
- maps_reverse_geocode: Convertir coordenadas a direcciones
- maps_distance_matrix: Calcular distancias entre puntos
- maps_directions: Obtener direcciones de navegación
- maps_elevation: Obtener datos de elevación
```

Si ves esto, **¡FUNCIONA!** 🎉

---

## 🧪 Pruebas de Funcionamiento

### Prueba 1: Geocodificación

```
Usuario: ¿Cuáles son las coordenadas del Malecón 2000 en Guayaquil?

Claude: [Usa maps_geocode automáticamente]
Las coordenadas del Malecón 2000 en Guayaquil son:
Latitud: -2.1894
Longitud: -79.8844
```

### Prueba 2: Búsqueda de lugares

```
Usuario: Busca restaurantes cerca del Parque Seminario en Guayaquil

Claude: [Usa search_nearby automáticamente]
He encontrado varios restaurantes cerca del Parque Seminario:

1. La Canoa ⭐ 4.7
   📍 200m del parque
   
2. Resaca ⭐ 4.5
   📍 350m del parque
...
```

### Prueba 3: Direcciones

```
Usuario: ¿Cómo llego del aeropuerto de Guayaquil al Hotel Hilton Colón?

Claude: [Usa maps_directions automáticamente]
Ruta desde Aeropuerto José Joaquín de Olmedo hasta Hotel Hilton Colón:

🚗 Distancia: 6.8 km
⏱️ Tiempo: 15 minutos aproximadamente
...
```

---

## 🔍 Troubleshooting (Solución de Problemas)

### Problema 1: Claude no ve las herramientas

**Síntomas**: Claude dice "No tengo herramientas disponibles"

**Diagnóstico**:
1. Verifica que Claude está completamente cerrado y reabierto
2. Revisa los logs:
   ```powershell
   # Windows
   Get-Content "$env:APPDATA\Claude\logs\mcp*.log" -Tail 50
   ```

**Soluciones**:
- ✅ Verifica que la ruta en el config es correcta
- ✅ Asegúrate de que el archivo wrapper existe
- ✅ Revisa que el JSON no tiene errores de sintaxis
- ✅ Reinicia Claude completamente (cerrar desde bandeja)

### Problema 2: Error "Cannot find module"

**Error en logs**:
```
Cannot find module 'D:\mcp-demo\mcp-google-map\mcp-stdio-wrapper.js'
```

**Solución**:
1. Verifica que el archivo existe:
   ```powershell
   Test-Path "D:\mcp-demo\mcp-google-map\mcp-stdio-wrapper.js"
   ```
   Debe devolver: `True`

2. Si no existe, verifica que lo creaste en la ubicación correcta

3. Ajusta la ruta en `claude_desktop_config.json` para que coincida

### Problema 3: Error "GOOGLE_MAPS_API_KEY not set"

**Solución**:
Verifica que tu `claude_desktop_config.json` tiene la API key:

```json
"env": {
  "GOOGLE_MAPS_API_KEY": "TU_API_KEY_AQUI"
}
```

### Problema 4: Puerto ya en uso (EADDRINUSE)

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solución**:
1. Cambia el puerto en la configuración:
   ```json
   "env": {
     "MCP_SERVER_PORT": "3001"
   }
   ```

2. O mata el proceso que usa el puerto:
   ```powershell
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Problema 5: API Error 403

**Error**: "This API project is not authorized to use this API"

**Solución**:
1. Ve a https://console.cloud.google.com/apis/library
2. Habilita estas APIs:
   - ✅ Geocoding API
   - ✅ Places API (New)
   - ✅ Directions API
   - ✅ Distance Matrix API
   - ✅ Elevation API
3. Espera 1-2 minutos para que se propaguen los cambios
4. Intenta nuevamente en Claude

### Ver Logs en Tiempo Real

**Windows (PowerShell)**:
```powershell
Get-Content "$env:APPDATA\Claude\logs\mcp-server-google-maps.log" -Wait -Tail 50
```

**macOS**:
```bash
tail -f ~/Library/Logs/Claude/mcp-server-google-maps.log
```

---

## 📊 Arquitectura del Wrapper

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claude Desktop                          │
│                  (Espera comunicación stdio)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ stdin/stdout (JSON-RPC)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    mcp-stdio-wrapper.js                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Recibe JSON-RPC por stdin                             │  │
│  │ 2. Inicia servidor HTTP en background                    │  │
│  │ 3. Traduce stdio → HTTP POST                             │  │
│  │ 4. Parsea SSE response → JSON                            │  │
│  │ 5. Envía JSON por stdout                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP POST (JSON-RPC + SSE)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   mcp-google-map (HTTP Server)                  │
│                      dist/cli.js (Original)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ - Procesa requests HTTP                                  │  │
│  │ - Valida parámetros con Zod                              │  │
│  │ - Ejecuta herramientas                                   │  │
│  │ - Responde con SSE format                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Google Maps API                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💡 Ventajas de este Método

✅ **No modifica el repo original** - Todo es externo
✅ **Compatible con Claude Desktop** - Usa stdio como se requiere
✅ **Fácil de actualizar** - Si actualizas el servidor, el wrapper sigue funcionando
✅ **Debugging simple** - Logs separados para wrapper y servidor
✅ **Reutilizable** - Puedes adaptarlo para otros servidores HTTP

---

## 📝 Archivos del Proyecto

```
mcp-google-map/
├── src/                           # Código fuente original
│   ├── cli.ts
│   ├── core/
│   └── tools/
├── dist/                          # Compilado
│   └── cli.js                    # Servidor HTTP (original)
├── mcp-stdio-wrapper.js          # ⭐ Wrapper stdio (NUEVO)
├── test-wrapper.js                # Prueba del wrapper
├── test.js                        # Cliente HTTP de prueba
├── DOCUMENTACION_MCP.md           # Protocolo MCP
├── CONFIGURACION_CLAUDE.md        # Esta guía
└── package.json
```

---

## 🎯 Ejemplos de Uso Real

### Ejemplo 1: Planificación Turística

```
Usuario: Voy a visitar Guayaquil mañana. Ayúdame a planear el día.
Quiero conocer el centro histórico y probar comida local.

Claude:
¡Perfecto! Te armaré un itinerario por el centro histórico:

🌅 MAÑANA (9:00 AM)
📍 Parque Seminario (Parque de las Iguanas)
   Coordenadas: -2.1947, -79.8812
   
   ↓ 🚶 5 min (400m)
   
📍 Malecón 2000
   Caminata panorámica

🍽️ ALMUERZO (12:30 PM)
La Canoa - Restaurante de Mariscos
⭐ 4.7 | 📍 800m del Malecón
Especialidad: Encebollado

🏛️ TARDE (3:00 PM)
📍 Barrio Las Peñas
   Sube los 444 escalones
   Vista panorámica de la ciudad

📊 Resumen:
- Distancia total: ~3.5 km
- Tiempo: 6-7 horas
- Costo estimado: $30-40 USD
```

### Ejemplo 2: Búsqueda de Ubicación para Negocio

```
Usuario: Necesito encontrar una ubicación para abrir un café en Guayaquil.
Analiza las zonas de Urdesa, Kennedy y Samborondón. 
Cuéntame cuántos cafés competidores hay en cada zona.

Claude:
Análisis de ubicaciones para café en Guayaquil:

🔵 URDESA
Cafés encontrados: 12 en radio de 1km
Competencia: Alta
Tipos: Cafés boutique, cadenas internacionales

🟢 KENNEDY
Cafés encontrados: 8 en radio de 1km
Competencia: Media
Tipos: Mix de independientes y cadenas

🟡 SAMBORONDÓN
Cafés encontrados: 5 en radio de 1km
Competencia: Baja
Tipos: Principalmente en malls

Recomendación: Samborondón tiene menos saturación...
```

---

## 🔐 Mejores Prácticas

### 1. Seguridad de API Keys

❌ **NO**:
- Subir `claude_desktop_config.json` a GitHub
- Compartir tu API key públicamente

✅ **SÍ**:
- Mantén el archivo de config local
- Usa diferentes API keys para desarrollo y producción
- Configura restricciones en Google Cloud Console

### 2. Monitoreo de Uso

Revisa tu uso de Google Maps API regularmente:
1. https://console.cloud.google.com/apis/dashboard
2. Configura alertas al 50%, 80% y 100% del presupuesto

### 3. Respaldo de Configuración

```powershell
# Windows - Crear backup
Copy-Item "$env:APPDATA\Claude\claude_desktop_config.json" "$env:APPDATA\Claude\claude_desktop_config.backup.json"

# macOS
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.backup.json
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar múltiples servidores MCP?

Sí, agrega más servidores en la configuración:

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node",
      "args": ["D:\\mcp-demo\\mcp-google-map\\mcp-stdio-wrapper.js"],
      "env": { "GOOGLE_MAPS_API_KEY": "KEY1" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Documents"]
    }
  }
}
```

### ¿Necesito mantener el wrapper corriendo?

No. Claude Desktop inicia y detiene el wrapper automáticamente cuando:
- Abres Claude Desktop (inicia)
- Cierras Claude Desktop (detiene)

### ¿Funciona sin internet?

No. Necesitas internet para:
- Claude Desktop (conexión a Anthropic)
- Google Maps API

### ¿Cuánto cuesta?

- **MCP**: Gratis (open source)
- **Claude Desktop**: Según tu plan de Anthropic
- **Google Maps API**: $200 USD gratis/mes, luego pago por uso

---

## 🎉 ¡Listo!

Ahora tienes Claude Desktop integrado con Google Maps vía MCP.

**Prueba preguntando a Claude**:
- "Busca hoteles cerca del Malecón 2000"
- "¿Cómo llego del aeropuerto al centro?"
- "¿Cuáles son las coordenadas del Parque Histórico?"
- "Planéame un día turístico en Guayaquil"

---

*Documentación creada con ❤️ para la comunidad MCP*

*Última actualización: Octubre 2024*
