const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// ID de tu archivo en Drive
const FILE_ID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj'; 
// URL que fuerza la descarga de archivos grandes omitiendo el aviso de virus
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}&confirm=t`;

let baseDeDatos = [];
let statusCarga = "⏳ Conectando con Google Drive...";

async function cargarDatos() {
    try {
        console.log("Iniciando descarga de 63MB desde Drive...");
        const res = await axios.get(urlDrive, { 
            timeout: 120000, // 2 minutos de espera
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        let datos = res.data;

        // Detecta si es una lista directa o está dentro de un objeto
        if (Array.isArray(datos)) {
            baseDeDatos = datos;
        } else if (typeof datos === 'object' && datos !== null) {
            const clave = Object.keys(datos).find(k => Array.isArray(datos[k]));
            baseDeDatos = clave ? datos[clave] : [datos];
        }

        statusCarga = `✅ SISTEMA ONLINE: ${baseDeDatos.length} registros cargados.`;
    } catch (e) {
        statusCarga = "❌ ERROR: No se pudo leer el archivo de Drive. Revisa que sea PÚBLICO.";
        console.error("Error:", e.message);
    }
}

cargarDatos();

app.get('/', (req, res) => {
    res.send(`
        <body style="font-family:sans-serif; background:#0f172a; color:white; text-align:center; padding:50px;">
            <h1>🔍 Buscador de Datos (Drive)</h1>
            <p style="color:#38bdf8;">${statusCarga}</p>
            <form action="/buscar" method="get">
                <input name="q" placeholder="Cédula o nombre..." style="padding:10px; border-radius:5px; border:none; width:250px;">
                <button style="padding:10px; background:#38bdf8; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">BUSCAR</button>
            </form>
        </body>
    `);
});

app.get('/buscar', (req, res) => {
    const q = req.query.q.toUpperCase();
    const resultados = baseDeDatos.filter(f => 
        Object.values(f).some(v => String(v).toUpperCase().includes(q))
    ).slice(0, 15);

    let html = `<body style="font-family:sans-serif; background:#0f172a; color:white; padding:20px;">`;
    html += `<h2>Resultados para: ${q}</h2>`;

    if (resultados.length > 0) {
        resultados.forEach(r => {
            html += `<div style="background:#1e293b; padding:15px; margin-bottom:10px; border-radius:10px; border-left:4px solid #38bdf8;">`;
            for (let k in r) { html += `<div><strong>${k}:</strong> ${r[k]}</div>`; }
            html += `</div>`;
        });
    } else {
        html += `<p>No se encontraron resultados para "${q}".</p>`;
    }
    
    html += `<br><a href="/" style="color:#38bdf8;">← Volver</a></body>`;
    res.send(html);
});

app.listen(PORT, () => console.log("Servidor listo"));
