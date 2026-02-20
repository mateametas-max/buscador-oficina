const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// Tu link de Dropbox verificado
const urlDatos = 'https://www.dropbox.com/scl/fi/g65tf8bw4832m7iak1l12/personas.json?rlkey=ofybclvoebt2hg3omg9bvo20q&st=jykugoaq&dl=1'; 

let baseDeDatos = [];
let statusCarga = "⏳ Descargando base de datos (63MB)...";

async function cargarDatos() {
    try {
        console.log("Conectando con Dropbox...");
        // Aumentamos el tiempo de espera (timeout) porque el archivo es pesado
        const res = await axios.get(urlDatos, { timeout: 60000 });
        
        if (res.data) {
            baseDeDatos = Array.isArray(res.data) ? res.data : [res.data];
            statusCarga = `✅ SISTEMA ONLINE: ${baseDeDatos.length} registros cargados.`;
            console.log("Base de datos cargada con éxito.");
        }
    } catch (e) {
        statusCarga = "❌ Error: El servidor no pudo procesar el archivo pesado.";
        console.error("Error detallado:", e.message);
    }
}
cargarDatos();

const css = `<style>
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: white; text-align: center; padding: 20px; }
    .container { max-width: 600px; margin: auto; }
    .card { background: #1e293b; border-left: 5px solid #38bdf8; margin: 15px 0; padding: 20px; text-align: left; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    input { padding: 15px; border-radius: 10px; border: 2px solid #334155; width: 100%; max-width: 400px; background: #0f172a; color: white; font-size: 16px; margin-bottom: 10px; box-sizing: border-box; }
    button { padding: 15px 30px; background: #38bdf8; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; color: #0f172a; font-size: 16px; transition: 0.3s; }
    button:hover { background: #0ea5e9; transform: translateY(-2px); }
    .data-row { border-bottom: 1px solid #334155; padding: 5px 0; display: flex; justify-content: space-between; font-size: 14px; }
    .data-label { color: #94a3b8; font-weight: bold; }
    a { color: #38bdf8; text-decoration: none; font-weight: bold; display: block; margin-top: 20px; }
</style>`;

app.get('/', (req, res) => {
    res.send(`${css}
        <div class="container">
            <h1>🔍 Buscador Maestro Valencia</h1>
            <p style="color:#38bdf8; font-weight: bold;">${statusCarga}</p>
            <form action="/buscar" method="get">
                <input type="text" name="q" placeholder="Cédula o Nombre Completo..." required>
                <br>
                <button type="submit">CONSULTAR REGISTRO</button>
            </form>
            <p style="font-size: 12px; color: #64748b; margin-top: 40px;">Búsqueda local optimizada para archivos grandes</p>
        </div>`);
});

app.get('/buscar', (req, res) => {
    const q = req.query.q.trim().toUpperCase();
    
    // Búsqueda profunda en todos los campos
    const resultados = baseDeDatos.filter(f => 
        Object.values(f).some(v => String(v).toUpperCase().includes(q))
    ).slice(0, 15);

    let html = `${css}<div class="container"><h2>Resultados para: ${q}</h2>`;
    
    if (resultados.length > 0) {
        resultados.forEach(r => {
            html += `<div class="card">`;
            for (let k in r) { 
                html += `<div class="data-row"><span class="data-label">${k}:</span> <span>${r[k]}</span></div>`; 
            }
            html += `</div>`;
        });
    } else {
        html += `<div class="card" style="border-color:#ef4444">
                    <h3>⚠️ Sin coincidencias</h3>
                    <p>No se encontró el registro en la base local de Valencia.</p>
                 </div>`;
    }
    
    html += `<a href="/">← Volver a buscar</a></div>`;
    res.send(html);
});

app.listen(PORT, () => console.log("Servidor encendido"));
