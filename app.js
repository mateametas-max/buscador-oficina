const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// Tu ID de Drive
const FILE_ID = '1XlS_f8zXlR1f6FhP5YqOq_X-R8n7Jz9D'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}`;

let baseDeDatos = [];

async function cargarDatos() {
    try {
        console.log("Intentando descargar base de datos...");
        const res = await axios.get(urlDrive);
        // Forzamos a que sea un Array, si viene como objeto lo metemos en uno
        baseDeDatos = Array.isArray(res.data) ? res.data : [res.data];
        console.log(`✅ Base local cargada con ${baseDeDatos.length} registros.`);
    } catch (e) {
        console.error("❌ ERROR CRÍTICO: No se pudo leer el archivo de Drive.");
    }
}
cargarDatos();

const css = `
<style>
    body { font-family: sans-serif; background: #0f172a; color: white; text-align: center; padding: 20px; }
    .card { background: #1e293b; border-left: 5px solid #38bdf8; margin: 10px auto; padding: 15px; max-width: 500px; text-align: left; border-radius: 8px; }
    input { padding: 12px; border-radius: 8px; border: none; width: 80%; max-width: 300px; margin-bottom: 10px; }
    button { padding: 12px 20px; background: #38bdf8; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
    pre { background: #0f172a; padding: 10px; font-size: 12px; overflow-x: auto; }
</style>`;

app.get('/', (req, res) => {
    res.send(`${css}
        <h1>🔍 Buscador Ultra-Flexible</h1>
        <p>Registros cargados: ${baseDeDatos.length}</p>
        <form action="/buscar" method="get">
            <input type="text" name="q" placeholder="Cédula o nombre..." required>
            <button type="submit">BUSCAR</button>
        </form>`);
});

app.get('/buscar', (req, res) => {
    const query = req.query.q.trim().toUpperCase();
    
    // BUSQUEDA TOTAL: No importa el nombre de la columna
    const resultados = baseDeDatos.filter(fila => {
        return Object.values(fila).some(valor => 
            String(valor).toUpperCase().includes(query)
        );
    }).slice(0, 10); // Mostramos los primeros 10

    let html = `${css}<h2>Resultados para: ${query}</h2>`;

    if (resultados.length > 0) {
        resultados.forEach(r => {
            html += `<div class="card">`;
            for (let llave in r) {
                html += `<div><strong>${llave}:</strong> ${r[llave]}</div>`;
            }
            html += `</div>`;
        });
    } else {
        html += `<div class="card" style="border-color:red">No se encontró nada en los ${baseDeDatos.length} registros locales.</div>`;
    }

    html += `<br><a href="/" style="color:#38bdf8">← Volver</a>`;
    res.send(html);
});

app.listen(PORT, () => console.log("Servidor listo"));
