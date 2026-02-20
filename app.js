const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// 1. CONFIGURACIÓN DATA VALENCIA (63MB)
const FILE_ID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}&confirm=t`;

let baseDeDatos = [];
let statusCarga = "⏳ Sincronizando Base de Datos Valencia...";

async function cargarDatos() {
    try {
        const res = await axios.get(urlDrive, { timeout: 250000 });
        baseDeDatos = Array.isArray(res.data) ? res.data : (Object.values(res.data).find(Array.isArray) || [res.data]);
        statusCarga = `✅ SISTEMA MAESTRO V3: ${baseDeDatos.length} registros activos.`;
    } catch (e) {
        statusCarga = "❌ Error Drive. Reintentando...";
        setTimeout(cargarDatos, 10000);
    }
}
cargarDatos();

// 2. LÓGICA DE BÚSQUEDA TRIPLE
app.get('/api/buscar', async (req, res) => {
    const q = (req.query.q || "").trim().toUpperCase();
    if (!q) return res.json([]);

    // NIVEL 1: Buscar en tus 63MB
    let resultados = baseDeDatos.filter(f => 
        Object.values(f).some(v => String(v).toUpperCase().includes(q))
    ).slice(0, 10);

    // NIVEL 2: Consultar la API de VZLA (Nuevo Hallazgo)
    const esCedula = /^\d+$/.test(q);
    if (esCedula) {
        try {
            // Intentamos obtener el acta/datos electorales
            const resVzla = await axios.get(`https://api.vzlapi.com/actas?cedula=${q}`, { timeout: 3500 });
            if (resVzla.data && resVzla.data.nombre) {
                resultados.unshift({
                    CEDULA: q,
                    NOMBRE: resVzla.data.nombre,
                    ESTADO: resVzla.data.estado || "N/A",
                    MUNICIPIO: resVzla.data.municipio || "N/A",
                    CENTRO: resVzla.data.centro || "Dato Electoral",
                    FUENTE: "VZLA API (ACTAS)"
                });
            }
        } catch (e) { console.log("VZLA API fuera de línea"); }
    }

    // NIVEL 3: Si no hay nada, activar botones de auxilio
    if (esCedula && resultados.length === 0) {
        resultados.push({ ES_AYUDA: true, CEDULA: q });
    }
    res.json(resultados);
});

// 3. INTERFAZ PROFESIONAL
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador Maestro V3</title>
    <style>
        body { font-family: 'Inter', sans-serif; background: #020617; color: #f8fafc; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .container { width: 100%; max-width: 550px; }
        .header { text-align: center; margin-bottom: 30px; }
        h1 { color: #38bdf8; font-size: 28px; margin: 0; letter-spacing: -1px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; background: #1e293b; color: #38bdf8; margin-top: 10px; border: 1px solid #334155; }
        .search-area { background: #0f172a; padding: 25px; border-radius: 20px; border: 1px solid #1e293b; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        input { width: 100%; padding: 15px; border-radius: 12px; border: 1px solid #334155; background: #020617; color: white; font-size: 18px; box-sizing: border-box; outline: none; transition: 0.3s; }
        input:focus { border-color: #38bdf8; ring: 2px #38bdf8; }
        button { width: 100%; padding: 15px; margin-top: 15px; background: #38bdf8; color: #020617; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 16px; transition: 0.2s; }
        button:active { transform: scale(0.98); }
        #res { margin-top: 25px; }
        .card { background: #1e293b; padding: 18px; margin-bottom: 15px; border-radius: 14px; border-left: 6px solid #38bdf8; position: relative; }
        .card .tag { position: absolute; top: 10px; right: 10px; font-size: 9px; background: #38bdf8; color: #020617; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .card b { color: #94a3b8; font-size: 10px; display: block; margin-top: 8px; }
        .card span { font-size: 15px; color: #f1f5f9; font-weight: 500; }
        .help-box { background: #1e1b4b; border: 2px dashed #4338ca; padding: 20px; border-radius: 16px; text-align: center; }
        .btn-ext { display: block; padding: 12px; margin: 10px 0; border-radius: 8px; text-decoration: none; font-weight: bold; color: white; transition: 0.2s; }
        .btn-ext:hover { opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🇻🇪 Maestro V3</h1>
            <div class="status-badge">${statusCarga}</div>
        </div>

        <div class="search-area">
            <input type="text" id="q" placeholder="Cédula o Nombre..." onkeyup="if(event.key==='Enter') buscar()">
            <button onclick="buscar()">INICIAR BÚSQUEDA</button>
        </div>

        <div id="res"></div>
    </div>

    <script>
        async function buscar() {
            const q = document.getElementById('q').value;
            const resDiv = document.getElementById('res');
            if(!q) return;

            resDiv.innerHTML = '<div style="text-align:center; color:#38bdf8;">Consultando fuentes nacionales...</div>';
            
            try {
                const response = await fetch('/api/buscar?q=' + encodeURIComponent(q));
                const datos = await response.json();
                resDiv.innerHTML = '';

                datos.forEach(r => {
                    if(r.ES_AYUDA) {
                        resDiv.innerHTML += \`
                            <div class="help-box">
                                <p style="margin-top:0; font-weight:bold;">⚠️ REGISTRO NO LOCALIZADO</p>
                                <small>No está en la data de Valencia. Intenta en:</small>
                                <a href="http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=\${r.CEDULA}" target="_blank" class="btn-ext" style="background:#dc2626;">SISTEMA CNE</a>
                                <a href="http://www.ivss.gov.ve/tiempo-real/cuenta-individual?cedula=\${r.CEDULA}" target="_blank" class="btn-ext" style="background:#2563eb;">SISTEMA IVSS</a>
                            </div>\`;
                    } else {
                        let h = '<div class="card">';
                        if(r.FUENTE) h += '<div class="tag">'+r.FUENTE+'</div>';
                        for(let k in r) {
                            if(k !== 'FUENTE') h += \`<div><b>\${k}</b><span>\${r[k]}</span></div>\`;
                        }
                        resDiv.innerHTML += h + '</div>';
                    }
                });
            } catch (err) {
                resDiv.innerHTML = '<p style="color:#ef4444; text-align:center;">Fallo de conexión.</p>';
            }
        }
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log("V3 Online"));
