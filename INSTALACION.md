# 📦 Guía de Instalación y Uso - MCP Google Maps stdio

## 🚀 Instalación Global (Recomendada)

### Paso 1: Instalar el paquete
```bash
npm install -g @vicente-alvarado/mcp-google-map-stdio
```

### Paso 2: Verificar instalación
```bash
mcp-google-maps-stdio --version
# Debería mostrar: 1.0.0
```

### Paso 3: Configurar API Key
```bash
# Windows (PowerShell)
$env:GOOGLE_MAPS_API_KEY="tu_api_key_aqui"

# Windows (CMD)
set GOOGLE_MAPS_API_KEY=tu_api_key_aqui

# macOS/Linux
export GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

## 🏠 Instalación Local

### Paso 1: Instalar en proyecto
```bash
npm install @vicente-alvarado/mcp-google-map-stdio
```

### Paso 2: Usar con npx
```bash
npx @vicente-alvarado/mcp-google-map-stdio
```

## ⚙️ Configuración para Claude Desktop

### Ubicación del archivo de configuración:

**Windows:**
```
C:\Users\TU_USUARIO\AppData\Roaming\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Configuración para instalación global:
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

### Configuración para instalación local:
```json
{
  "mcpServers": {
    "google-maps": {
      "command": "npx",
      "args": ["@vicente-alvarado/mcp-google-map-stdio"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

## 🧪 Pruebas

### Probar instalación global:
```bash
# Verificar que el comando existe
which mcp-google-maps-stdio  # macOS/Linux
where mcp-google-maps-stdio  # Windows

# Probar ejecución
mcp-google-maps-stdio
```

### Probar instalación local:
```bash
# Desde el directorio del proyecto
npx @vicente-alvarado/mcp-google-map-stdio
```

## 🔄 Actualización

### Actualizar instalación global:
```bash
npm update -g @vicente-alvarado/mcp-google-map-stdio
```

### Actualizar instalación local:
```bash
npm update @vicente-alvarado/mcp-google-map-stdio
```

## 🗑️ Desinstalación

### Desinstalar globalmente:
```bash
npm uninstall -g @vicente-alvarado/mcp-google-map-stdio
```

### Desinstalar localmente:
```bash
npm uninstall @vicente-alvarado/mcp-google-map-stdio
```

## 🐛 Solución de Problemas

### Error: "Command not found"
```bash
# Verificar instalación global
npm list -g @vicente-alvarado/mcp-google-map-stdio

# Reinstalar si es necesario
npm install -g @vicente-alvarado/mcp-google-map-stdio
```

### Error: "Permission denied" (macOS/Linux)
```bash
# Usar sudo para instalación global
sudo npm install -g @vicente-alvarado/mcp-google-map-stdio
```

### Error: "API Key not set"
```bash
# Verificar variable de entorno
echo $GOOGLE_MAPS_API_KEY  # macOS/Linux
echo %GOOGLE_MAPS_API_KEY% # Windows
```

## 📋 Checklist de Instalación

- [ ] Node.js >= 18.0.0 instalado
- [ ] Google Maps API Key obtenida
- [ ] Paquete instalado (global o local)
- [ ] Variable GOOGLE_MAPS_API_KEY configurada
- [ ] Claude Desktop configurado
- [ ] Claude Desktop reiniciado
- [ ] Prueba de funcionamiento realizada

## 🎯 Comandos Útiles

```bash
# Ver información del paquete
npm info @vicente-alvarado/mcp-google-map-stdio

# Ver archivos instalados
npm list -g @vicente-alvarado/mcp-google-map-stdio

# Verificar configuración de Claude
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json  # macOS
type %APPDATA%\Claude\claude_desktop_config.json  # Windows
```
