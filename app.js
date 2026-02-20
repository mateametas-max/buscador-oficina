const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 10000;

// --- CONFIGURACIÓN DATA ---
const FILE_ID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}&confirm=t`;

let baseDeDatos = [];
let statusCarga = "⏳ Iniciando Sistema V4...";
let psuvCookie = "";

// --- 1. LOGIN PSUV ---
async function loginPSUV() {
    try {
        console.log("Iniciando intento de login...");
        const res1 = await axios.get('https://organizacion.psuv.org.ve/login/', { 
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' }
        });
        
        let cookieInic = res1.headers['set-cookie'] ? res1.headers['set-cookie'].join('; ') : "";

        // Usamos URLSearchParams para simular un formulario real de navegador
        const params = new URLSearchParams();
        params.append('usuario', 'jfederico2007@gmail.com'); 
        params.append('password', '12345678');
        params.append('entrar', '1'); // Algunos sistemas piden este campo extra

        const resLogin = await axios.post('https://organizacion.psuv.org.ve/login/', params, {
            headers: {
                'Cookie': cookieInic,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://organizacion.psuv.org.ve',
                'Referer': 'https://organizacion.psuv.org.ve/login/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
            },
            maxRedirects: 0,
            validateStatus: s => s >= 200 && s < 405
        });
        
        if (resLogin.headers['set-cookie']) {
            psuvCookie = resLogin.headers['set-cookie'].join('; ');
            console.log("✅ SESIÓN PSUV ACTIVADA");
        } else {
            console.log("⚠️ El servidor no devolvió galleta de sesión. Revisa credenciales.");
        }
    } catch (e) {
        console.log("❌ Error de conexión: " + e.message);
    }
}

// --- 2. CARGA DE BASE DE DATOS ---
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

// --- 3. RUTA DE BÚSQUEDA ---
app.get('/api/buscar', async (req, res) => {
    const q = (req.query.q || "").trim().toUpperCase();
    if (!q) return res.json([]);

    let resultados = baseDeDatos.filter(f => 
        Object.values(f).some(v => String(v).toUpperCase().includes(q))
    ).slice(0, 10);

    const esCedula = /^\d+$/.test(q);
    if (esCedula && psuvCookie) {
        try {
            const consulta = await axios.get(`https://organizacion.psuv.org.ve/militancia/buscar/?cedula=${q}`, {
                headers: { 'Cookie': psuvCookie },
                timeout: 6000
            });
            const $ = cheerio.load(consulta.data);
            const nombre = $('h2').first().text().trim() || $('h3').first().text().trim();
            
            if (nombre && nombre.length > 3) {
                resultados.unshift({ CEDULA: q, NOMBRE: nombre, FUENTE: "PSUV EN VIVO" });
            }
        } catch (e) { console.log("Falla consulta externa"); }
    }

    if (esCedula && resultados.length === 0) {
        resultados.push({ ES_AYUDA: true, CEDULA: q });
    }
    res.json(resultados);
});

// --- 4. INTERFAZ ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Buscador Maestro</title>
        <style>
            body { font-family: sans-serif; background: #020617; color: white; padding: 20px; display: flex; flex-direction: column; align-items: center; }
            .container { width: 100%; max-width: 500px; }
            input { width: 100%; padding: 15px; border-radius: 10px; border: 1px solid #334155; background: #0f172a; color: white; margin-bottom: 10px; box-sizing: border-box; }
            button { width: 100%; padding: 15px; background: #38bdf8; color: #020617; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; }
            .card { background: #1e293b; padding: 15px; margin-top: 15px; border-radius: 10px; border-left: 5px solid #38bdf8; }
            .status { font-size: 12px; color: #38bdf8; margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🇻🇪 Maestro V4</h1>
            <div class="status">${statusCarga}</div>
            <input type="text" id="q" placeholder="Cédula o Nombre...">
            <button onclick="buscar()">BUSCAR</button>
            <div id="res"></div>
        </div>
        <script>
            async function buscar() {
                const q = document.getElementById('q').value;
                const resDiv = document.getElementById('res');
                resDiv.innerHTML = 'Buscando...';
                const r = await fetch('/api/buscar?q=' + q);
                const d = await r.json();
                resDiv.innerHTML = '';
                d.forEach(i => {
                    let h = '<div class="card">';
                    for(let k in i) h += '<div><b>'+k+':</b> '+i[k]+'</div>';
                    resDiv.innerHTML += h + '</div>';
                });
            }
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => console.log("V4 Online"));



