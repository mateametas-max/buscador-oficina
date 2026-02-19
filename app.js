const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

const FILE_ID = '1XlS_f8zXlR1f6FhP5YqOq_X-R8n7Jz9D'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}`;

let baseDeDatos = [];

async function cargarDatos() {
    try {
        const res = await axios.get(urlDrive);
        baseDeDatos = Array.isArray(res.data) ? res.data : [];
        console.log(`✅ Base local lista: ${baseDeDatos.length} registros.`);
    } catch (e) {
        console.error("❌ Error al cargar Drive.");
    }
}
cargarDatos();

const headerHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador Maestro Valencia</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: white; }
        .container { background: #1e293b; padding: 25px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); width: 95%; max-width: 500px; text-align: center; border: 1px solid #334155; }
        h1 { color: #38bdf8; font-size: 22px; }
        input { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #334155; border-radius: 8px; background: #0f172a; color: white; font-size: 16px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .result-card { margin-top: 15px; padding: 15px; border-radius: 10px; text-align: left; background: #334155; border-left: 5px solid #38bdf8; font-size: 14px; }
        .data-row { margin: 4px 0; border-bottom: 1px solid #475569; padding-bottom: 3px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-bottom: 10px; text-transform: uppercase; }
        .local { background: #22c55e; color: white; }
        .externo { background: #eab308; color: #0f172a; }
        a { display: block; margin-top: 15px; color: #38bdf8; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
`;

app.get('/', (req, res) => {
    res.send(`${headerHTML}
        <h1>🔍 Buscador Maestro</h1>
        <p style="color: #94a3b8; font-size: 13px;">Ingresa nombre o cédula</p>
        <form action="/buscar" method="get">
            <input type="text" name="termino" placeholder="Ej: 12345678 o JUAN PEREZ" required>
            <button type="submit">BUSCAR</button>
        </form>
    </div></body></html>`);
});

app.get('/buscar', async (req, res) => {
    const termino = req.query.termino.trim().toUpperCase();
    const esNumero = /^\d+$/.test(termino);
    
    // 1. BÚSQUEDA EN BASE LOCAL (Por Cédula o por Nombre)
    let resultados = [];
    if (esNumero) {
        resultados = baseDeDatos.filter(p => 
            p.cedula == termino || p.CEDULA == termino || p.V == termino || p.v == termino
        );
    } else {
        // Busca en cualquier columna que contenga el texto (Nombre, Apellido, etc)
        resultados = baseDeDatos.filter(p => 
            Object.values(p).some(valor => String(valor).toUpperCase().includes(termino))
        ).slice(0, 10); // Limitamos a 10 resultados para no saturar
    }

    let htmlResultados = "";

    // Si hay resultados locales
    if (resultados.length > 0) {
        resultados.forEach(encontrado => {
            let filas = "";
            for (let clave in encontrado) {
                filas += `<div class="data-row"><strong>${clave}:</strong> ${encontrado[clave]}</div>`;
            }
            htmlResultados += `<div class="result-card"><span class="badge local">Base Local</span>${filas}</div>`;
        });
    } 
    
    // 2. SI ES NÚMERO Y NO ESTÁ LOCAL, CONSULTA EXTERNA
    else if (esNumero) {
        try {
            const apiRes = await axios.get(`https://api.cedula.com.ve/api/v1/cedula/${termino}`, { timeout: 3500 });
            if (apiRes.data && apiRes.data.nombre) {
                const d = apiRes.data;
                htmlResultados = `
                    <div class="result-card">
                        <span class="badge externo">Red Externa (IVSS)</span>
                        <div class="data-row"><strong>Nombre:</strong> ${d.nombre} ${d.apellido || ''}</div>
                        <div class="data-row"><strong>Cédula:</strong> ${termino}</div>
                    </div>`;
            }
        } catch (err) {}
    }

    // 3. RESPUESTA FINAL
    if (htmlResultados === "") {
        htmlResultados = `<div class="result-card" style="border-color: #ef4444;"><h3>⚠️ Sin coincidencias</h3><p>No encontramos nada para "${termino}"</p></div>`;
    }

    res.send(`${headerHTML}
        <h2>Resultados para: ${termino}</h2>
        ${htmlResultados}
        <a href="/">← Nueva búsqueda</a>
    </div></body></html>`);
});

app.listen(PORT, () => console.log(`🚀 Online en puerto ${PORT}`));
