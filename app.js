const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

const FILE_ID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}&confirm=t`;

let baseDeDatos = [];
let statusCarga = "⏳ Conectando con Google Drive...";

async function cargarDatos() {
    try {
        const res = await axios.get(urlDrive, { timeout: 120000 });
        let datos = res.data;
        if (Array.isArray(datos)) {
            baseDeDatos = datos;
        } else if (typeof datos === 'object' && datos !== null) {
            const clave = Object.keys(datos).find(k => Array.isArray(datos[k]));
            baseDeDatos = clave ? datos[clave] : [datos];
        }
        statusCarga = `✅ SISTEMA ONLINE: ${baseDeDatos.length} registros.`;
    } catch (e) {
        statusCarga = "❌ ERROR: No se pudo sincronizar con Drive.";
    }
}
cargarDatos();

// RUTA PARA LA BÚSQUEDA (Devuelve solo JSON)
app.get('/api/buscar', (req, res) => {
    const q = (req.query.q || "").trim().toUpperCase();
    if (!q) return res.json([]);
    
    const resultados = baseDeDatos.filter(f => 
        Object.values(f).some(v => String(v).toUpperCase().includes(q))
    ).slice(0, 15);
    
    res.json(resultados);
});

// PÁGINA PRINCIPAL
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Buscador Valencia</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: sans-serif; background: #0f172a; color: white; text-align: center; padding: 20px; }
        .container { max-width: 600px; margin: auto; }
        .search-box { background: #1e293b; padding: 20px; border-radius: 15px; border: 1px solid #334155; margin-bottom: 20px; }
        input { padding: 12px; border-radius: 8px; border: none; width: 70%; font-size: 16px; }
        button { padding: 12px 20px; background: #38bdf8; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        #resultados { text-align: left; margin-top: 20px; }
        .card { background: #1e293b; padding: 15px; margin-bottom: 10px; border-radius: 10px; border-left: 5px solid #38bdf8; animation: fadeIn 0.3s ease; }
        .item { margin-bottom: 4px; font-size: 14px; }
        .label { color: #38bdf8; font-weight: bold; font-size: 11px; text-transform: uppercase; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .loading { color: #38bdf8; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Buscador Valencia</h1>
        <p id="status" style="font-size: 12px; color: #94a3b8;">${statusCarga}</p>
        
        <div class="search-box">
            <input type="text" id="busqueda" placeholder="Cédula o nombre..." onkeyup="if(event.key==='Enter') buscar()">
            <button onclick="buscar()">BUSCAR</button>
        </div>

        <div id="resultados"></div>
    </div>

    <script>
        async function buscar() {
            const q = document.getElementById('busqueda').value;
            const contenedor = document.getElementById('resultados');
            
            if(!q) return;
            
            contenedor.innerHTML = '<p class="loading">Buscando en la base de datos...</p>';
            
            try {
                const res = await fetch('/api/buscar?q=' + encodeURIComponent(q));
                const datos = await res.json();
                
                contenedor.innerHTML = ''; // Limpiar
                
                if(datos.length === 0) {
                    contenedor.innerHTML = '<p>No se encontraron resultados.</p>';
                    return;
                }
                
                datos.forEach(r => {
                    let html = '<div class="card">';
                    for(let k in r) {
                        html += '<div class="item"><span class="label">' + k + ':</span> ' + r[k] + '</div>';
                    }
                    html += '</div>';
                    contenedor.innerHTML += html;
                });
            } catch (e) {
                contenedor.innerHTML = '<p style="color:red">Error al buscar.</p>';
            }
        }
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log("Servidor listo en el puerto " + PORT));
