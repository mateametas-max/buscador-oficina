const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 10000;

// --- CONFIGURACIÓN DATA VALENCIA (DRIVE) ---
const FILE_ID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}&confirm=t`;

let baseDeDatos = [];
let statusCarga = "⏳ Iniciando...";
let psuvCookie = "";

// --- 1. FUNCIÓN LOGIN PSUV (BLINDADA) ---
async function loginPSUV() {
    try {
        console.log("Intentando bypass PSUV...");
        const res1 = await axios.get('https://organizacion.psuv.org.ve/', { 
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' }
        });
        let cookieInic = res1.headers['set-cookie'] ? res1.headers['set-cookie'].join('; ') : "";

        const params = new URLSearchParams();
        params.append('usuario', 'TU_CORREO_O_CEDULA_AQUI'); // <--- CAMBIAR
        params.append('password', 'TU_CLAVE_AQUI');           // <--- CAMBIAR
        params.append('accion', 'login');

        const resLogin = await axios.post('https://organizacion.psuv.org.ve/login/', params, {
            headers: {
                'Cookie': cookieInic,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://organizacion.psuv.org.ve/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
            },
            maxRedirects: 0,
            validateStatus: s => s >= 200 && s < 400
        });
        
        psuvCookie = resLogin.headers['set-cookie'] ? resLogin.headers['set-cookie'].join('; ') : cookieInic;
        console.log("✅ Sesión PSUV establecida.");
    } catch (e) {
        console.log("⚠️ Login PSUV no disponible (Posible bloqueo de IP)");
    }
}

// --- 2. CARGA DE DRIVE ---
async function cargarDatos() {
    try {
        const res = await axios.get(urlDrive, { timeout: 250000 });
        baseDeDatos = Array.isArray(res.data) ? res.data : (Object.values(res.data).find(Array.isArray) || [res.data]);
        statusCarga = "✅ SISTEMA ONLINE";
        loginPSUV();
    } catch (e) {
        statusCarga = "❌ Error Drive";
        setTimeout(cargarDatos, 10000);
    }
}
cargarDatos();

// --- 3. API DE BÚSQUEDA ---
app.get('/api/buscar', async (req, res) => {
    const q = (req.query.q || "").trim().toUpperCase();
    if (!q) return res.json([]);

    // Filtro en Valencia (Local)
    let resultados = baseDeDatos.filter(f => 
        Object.values(f).some(v => String(v).toUpperCase().includes(q))
    ).slice(0, 10);

    // Consulta en vivo PSUV
    const esCedula = /^\d+$/.test(q);
    if (esCedula && psuvCookie) {
        try {
            const consulta = await axios.get(`https://organizacion.psuv.org.ve/militancia/buscar/?cedula=${q}`, {
                headers: { 'Cookie': psuvCookie, 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000
            });
            const $ = cheerio.load(consulta.data);
            const nombre = $('h2').first().text().trim() || $('h3').first().text().trim();
            if (nombre && nombre.length > 3) {
                resultados.unshift({ CEDULA: q, NOMBRE: nombre, FUENTE: "SISTEMA EN VIVO" });
            }
        } catch (e) { /* Fallo silencioso */ }
    }

    if (esCedula && resultados.length === 0) {
        resultados.push({ ES_AYUDA: true, CEDULA: q });
    }
    res.json(resultados);
});

// --- 4. INTERFAZ (FRONTEND) ---
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador Maestro V5</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #020617; color: #f1f5f9; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .container { width: 100%; max-width: 500px; }
        .status-pill { font-size: 10px; background: #1e293b; color: #38bdf8; padding: 5px 12px; border-radius: 20px; border: 1px solid #334155; margin-bottom: 20px; display: inline-block; }
        .search-box { background: #0f172a; padding: 20px; border-radius: 15px; border: 1px solid #1e293b; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); }
        input { width: 100%; padding: 15px; border-radius: 10px; border: 1px solid #334155; background: #020617; color: white; font-size: 16px; box-sizing: border-box; outline: none; }
        button { width: 100%; padding: 15px; background: #38bdf8; color: #020617; border: none; border-radius: 10px; font-weight: bold; margin-top: 10px; cursor: pointer; transition: 0.2s; }
        .card { background: #1e293b; padding: 15px; margin-top: 15px; border-radius: 12px; border-left: 5px solid #38bdf8; position: relative; }
        .card b { color: #94a3b8; font-size: 10px; text-transform: uppercase; display: block; }
        .card span { display: block; margin-bottom: 8px; font-size: 15px; }
        .btn-ext { display: block; padding: 12px; margin-top: 8px; border-radius: 8px; text-decoration: none; font-weight: bold; color: white; font-size: 13px; text-align: center; }
        .tag { position: absolute; top: 10px; right: 10px; font-size: 9px; background: #38bdf8; color: black; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="color:#38bdf8; margin-bottom:5px;">🇻🇪 Maestro V5</h1>
        <div class="status-pill">${statusCarga}</div>
        <div class="search-box">
            <input type="text" id="q" placeholder="Cédula o Nombre..." onkeyup="if(event.key==='Enter') buscar()">
            <button onclick="buscar()">CONSULTAR</button>
        </div>
        <div id="res"></div>
    </div>
    <script>
        async function buscar() {
            const q = document.getElementById('q').value;
            const resDiv = document.getElementById('res');
            if(!q) return;
            resDiv.innerHTML = '<p style="text-align:center; color:#38bdf8;">Buscando...</p>';
            try {
                const response = await fetch('/api/buscar?q=' + encodeURIComponent(q));
                const datos = await response.json();
                resDiv.innerHTML = '';
                datos.forEach(r => {
                    if(r.ES_AYUDA) {
                        resDiv.innerHTML += \`
                            <div class="card" style="border-left-color:#ef4444;">
                                <b style="color:#ef4444">SIN RESULTADOS LOCALES</b>
                                <p style="font-size:12px">La cédula \${r.CEDULA} no se encontró. Intenta externamente:</p>
                                <a href="http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=\${r.CEDULA}" target="_blank" class="btn-ext" style="background:#dc2626;">CONSULTAR CNE</a>
                                <a href="http://www.ivss.gov.ve/tiempo-real/cuenta-individual?cedula=\${r.CEDULA}" target="_blank" class="btn-ext" style="background:#2563eb;">CONSULTAR IVSS</a>
                            </div>\`;
                    } else {
                        let h = '<div class="card">';
                        if(r.FUENTE) h += '<div class="tag">'+r.FUENTE+'</div>';
                        for(let k in r) {
                            if(k !== 'FUENTE') h += '<b>'+k+'</b><span>'+r[k]+'</span>';
                        }
                        resDiv.innerHTML += h + '</div>';
                    }
                });
            } catch (err) { resDiv.innerHTML = 'Error de conexión.'; }
        }
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log("Servidor V5 OK"));
