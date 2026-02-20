const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la fuente de datos
const DRIVE_JSON_URL = "TU_URL_DE_GOOGLE_DRIVE_AQUÍ"; 

let baseDeDatos = [];
let statusCarga = "Sincronizando con el repositorio de datos...";

// Función para obtener los datos
async function sincronizar() {
    try {
        const res = await axios.get(DRIVE_JSON_URL);
        // Ajuste según la estructura de tu JSON
        baseDeDatos = Array.isArray(res.data) ? res.data : (res.data.records || Object.values(res.data)[0]);
        statusCarga = `SISTEMA OPERATIVO: ${baseDeDatos.length} registros indexados.`;
        console.log("Base de datos actualizada.");
        return true;
    } catch (e) {
        statusCarga = "ERROR DE CONEXIÓN CON LA FUENTE DE DATOS.";
        return false;
    }
}

sincronizar();

// --- INTERFAZ FRONTEND (Estilo vzlapi) ---
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API de Consulta - Valencia</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #f9fafb; color: #111827; }
        .container-main { max-width: 900px; margin: 0 auto; padding: 2rem; }
        .status-dot { height: 10px; width: 10px; background-color: #10b981; border-radius: 50%; display: inline-block; margin-right: 8px; }
        .data-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; transition: shadow 0.2s; }
        .data-card:hover { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    </style>
</head>
<body>
    <div class="container-main">
        <header class="border-b border-gray-200 pb-6 mb-8">
            <h1 class="text-3xl font-extrabold tracking-tight text-gray-900">api.valencia-datos.com</h1>
            <p class="text-gray-500 mt-2">Plataforma de consulta y acceso a datos públicos del registro de Valencia.</p>
            <div class="mt-4 flex items-center text-sm font-medium text-gray-600">
                <span class="status-dot"></span> ${statusCarga}
            </div>
        </header>

        <section class="mb-12">
            <label class="block text-sm font-semibold text-gray-700 mb-2">BUSCAR REGISTRO</label>
            <div class="relative">
                <input type="text" id="q" placeholder="Introduce número de cédula o nombre completo..." 
                    class="w-full p-4 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    oninput="buscar()">
                <div id="loading" class="hidden absolute right-4 top-4 text-gray-400">Buscando...</div>
            </div>
            <p class="mt-2 text-xs text-gray-400 font-mono italic">Endpoint: GET /api/v1/consultar?cedula={valor}</p>
        </section>

        <div id="resultados" class="grid grid-cols-1 gap-4">
            </div>

        <footer class="mt-20 pt-8 border-t border-gray-200 text-center text-gray-400 text-xs">
            © 2026 Datos Abiertos Valencia - Inspirado en el proyecto vzlapi
        </footer>
    </div>

    <script>
        let timer;
        function buscar() {
            clearTimeout(timer);
            const query = document.getElementById('q').value.trim();
            const contenedor = document.getElementById('resultados');
            
            if(query.length < 3) {
                contenedor.innerHTML = '';
                return;
            }

            document.getElementById('loading').classList.remove('hidden');
            
            timer = setTimeout(async () => {
                try {
                    const r = await fetch('/api/buscar?q=' + encodeURIComponent(query));
                    const data = await r.json();
                    
                    document.getElementById('loading').classList.add('hidden');
                    contenedor.innerHTML = '';

                    if(data.length === 0) {
                        contenedor.innerHTML = '<div class="text-center p-10 bg-gray-50 rounded-lg text-gray-400">No se encontraron registros para esta consulta.</div>';
                        return;
                    }

                    data.forEach(item => {
                        let inner = '';
                        for(let k in item) {
                            inner += \`
                                <div>
                                    <dt class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">\${k}</dt>
                                    <dd class="text-gray-800 font-medium font-mono">\${item[k]}</dd>
                                </div>\`;
                        }
                        contenedor.innerHTML += \`
                            <div class="data-card p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                                \${inner}
                            </div>\`;
                    });
                } catch(e) { console.error(e); }
            }, 300);
        }
    </script>
</body>
</html>
    `);
});

// --- API ENDPOINT (JSON PURO) ---
app.get('/api/buscar', (req, res) => {
    const q = req.query.q ? req.query.q.trim().toUpperCase() : "";
    const resultados = baseDeDatos.filter(f => 
        Object.values(f).some(v => String(v).toUpperCase().includes(q))
    ).slice(0, 10);
    res.json(resultados);
});

// Ruta para refrescar datos desde el Drive
app.get('/refresh', async (req, res) => {
    await sincronizar();
    res.redirect('/');
});

app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
