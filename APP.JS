const express = require('express');
const axios = require('axios');
const app = express();

let datos = [];

// Función para cargar los 63MB desde Google Drive
async function cargarBaseDeDatos() {
    const driveID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj';
    const url = `https://docs.google.com/uc?export=download&id=${driveID}`;

    try {
        console.log("Conectando con Google Drive...");
        const respuesta = await axios.get(url);
        // Ajuste según la estructura de tu JSON
        datos = respuesta.data.valencia || (Array.isArray(respuesta.data) ? respuesta.data : Object.values(respuesta.data)[0]);
        console.log("¡Base de datos cargada con éxito! Registros:", datos.length);
    } catch (err) {
        console.error("Error al descargar de Drive. Asegúrate de que el archivo sea 'Público'.");
    }
}

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Buscador Profesional Valencia</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                :root { --primary: #0062ff; --bg: #f8f9fa; }
                body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; padding: 15px; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
                .search-area { display: flex; gap: 10px; margin: 20px 0; }
                input { flex: 1; padding: 12px; border: 2px solid #eee; border-radius: 8px; font-size: 16px; outline: none; }
                input:focus { border-color: var(--primary); }
                .btn { padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
                .btn-search { background: var(--primary); color: white; }
                .btn-clear { background: #eee; color: #444; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; color: #666; font-size: 13px; }
                td { padding: 12px; border-bottom: 1px solid #eee; font-size: 15px; }
                tr:hover { background: #f0f7ff; }
                .badge { background: #e7f3ff; color: var(--primary); padding: 4px 8px; border-radius: 4px; font-family: monospace; }
                #contador { color: #888; font-size: 14px; margin-top: 10px; }
                .btn-more { width: 100%; margin-top: 15px; background: #f0f2f5; color: var(--primary); display: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>📊 Buscador de Datos Valencia</h2>
                <div class="search-area">
                    <input type="text" id="bus" placeholder="Cédula o nombre..." onkeyup="if(event.key==='Enter') buscar()">
                    <button class="btn btn-search" onclick="buscar()">Buscar</button>
                    <button class="btn btn-clear" onclick="limpiar()">Limpiar</button>
                </div>
                <div id="contador"></div>
                <table id="tabla" style="display:none">
                    <thead><tr><th>Cédula</th><th>Nombre</th></tr></thead>
                    <tbody id="cuerpo"></tbody>
                </table>
                <button id="btnMas" class="btn btn-more" onclick="mostrarMas()">Cargar más resultados</button>
            </div>
            <script>
                let resultados = [];
                let visibleCount = 0;

                function limpiar() {
                    document.getElementById('bus').value = "";
                    document.getElementById('cuerpo').innerHTML = "";
                    document.getElementById('tabla').style.display = "none";
                    document.getElementById('contador').innerText = "";
                    document.getElementById('btnMas').style.display = "none";
                }

                async function buscar() {
                    const q = document.getElementById('bus').value.toUpperCase();
                    if(!q) return;
                    document.getElementById('contador').innerText = "Buscando...";
                    
                    const res = await fetch(\`/api/buscar?q=\${q}\`);
                    resultados = await res.json();
                    visibleCount = 0;
                    document.getElementById('cuerpo').innerHTML = "";
                    mostrarMas();
                }

                function mostrarMas() {
                    const chunk = resultados.slice(visibleCount, visibleCount + 50);
                    const html = chunk.map(p => \`<tr><td><span class="badge">\${p.CEDULA}</span></td><td>\${p.NOMBRE}</td></tr>\`).join('');
                    document.getElementById('cuerpo').innerHTML += html;
                    visibleCount += chunk.length;
                    
                    document.getElementById('tabla').style.display = "table";
                    document.getElementById('contador').innerText = \`Mostrando \${visibleCount} de \${resultados.length} encontrados\`;
                    document.getElementById('btnMas').style.display = visibleCount < resultados.length ? "block" : "none";
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/api/buscar', (req, res) => {
    const q = (req.query.q || "").toUpperCase();
    const filtrados = datos.filter(p => String(p.CEDULA).includes(q) || String(p.NOMBRE).includes(q));
    res.json(filtrados);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    cargarBaseDeDatos();
    console.log("Servidor en la nube activo");
});
