const express = require('express');
const axios = require('axios');
const compression = require('compression'); // Para que cargue más rápido
const app = express();
const PORT = process.env.PORT || 10000;

app.use(compression()); // Optimiza el envío de datos al navegador

const FILE_ID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}&confirm=t`;

let baseDeDatos = [];
let statusCarga = "⏳ Iniciando conexión...";
let fechaCarga = "";

async function cargarDatos() {
    try {
        console.log("--- INICIANDO DESCARGA ---");
        const res = await axios({
            method: 'get',
            url: urlDrive,
            timeout: 150000, // 2.5 minutos
            responseType: 'json'
        });
        
        let rawData = res.data;

        if (Array.isArray(rawData)) {
            baseDeDatos = rawData;
        } else if (typeof rawData === 'object' && rawData !== null) {
            const key = Object.keys(rawData).find(k => Array.isArray(rawData[k]));
            baseDeDatos = key ? rawData[key] : [rawData];
        }

        statusCarga = `✅ SISTEMA LISTO`;
        fechaCarga = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });
        console.log(`✅ Éxito: ${baseDeDatos.length} registros cargados.`);

    } catch (error) {
        statusCarga = "❌ ERROR DE SINCRONIZACIÓN";
        console.error("Detalle:", error.message);
        if (error.code === 'ECONNABORTED') statusCarga += " (Tiempo agotado)";
    }
}

cargarDatos();

// Interfaz HTML más elaborada
const renderHTML = (contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador Valencia</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .header { background: #1e293b; width: 100%; padding: 20px 0; text-align: center; border-bottom: 3px solid #38bdf8; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .container { width: 90%; max-width: 600px; padding: 20px; }
        .status-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; background: #334155; color: #38bdf8; margin-top: 10px; border: 1px solid #38bdf8; }
        .search-card { background: #1e293b; padding: 30px; border-radius: 16px; margin-top: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        input { width: 100%; padding: 15px; border-radius: 8px; border: 2px solid #475569; background: #0f172a; color: white; font-size: 16px; box-sizing: border-box; outline: none; transition: 0.3s; }
        input:focus { border-color: #38bdf8; box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
        button { width: 100%; padding: 15px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 15px; cursor: pointer; transition: 0.2s; }
        button:hover { background: #0ea5e9; transform: translateY(-1px); }
        .result-card { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 15px; border-left: 6px solid #38bdf8; text-align: left; }
        .data-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 14px; }
        .label { color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 11px; }
        .back-link { display: inline-block; margin-top: 20px; color: #38bdf8; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Buscador General Valencia</h1>
        <div class="status-badge">${statusCarga} | ${baseDeDatos.length} registros</div>
    </div>
    <div class="container">${contenido}</div>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(renderHTML(`
        <div class="search-card">
            <form action="/buscar" method="get">
                <input type="text" name="q" placeholder="Introduce Cédula o Nombre..." required>
                <button type="submit">BUSCAR AHORA</button>
            </form>
            <p style="font-size: 11px; color: #64748b; margin-top: 15px;">Última sincronización: ${fechaCarga}</p>
        </div>
    `));
});

app.get('/buscar', (req, res) => {
    const query = req.query.q.trim().toUpperCase();
    if (!query) return res.redirect('/');

    const resultados = baseDeDatos.filter(fila => 
        Object.values(fila).some(valor => String(valor).toUpperCase().includes(query))
    ).slice(0, 10);

    let listado = `<h2>Resultados para: ${query}</h2>`;
    
    if (resultados.length > 0) {
        resultados.forEach(r => {
            listado += `<div class="result-card">`;
            for (let k in r) {
                listado += `<div class="data-item"><span class="label">${k}</span><span>${r[k]}</span></div>`;
            }
            listado += `</div>`;
        });
    } else {
        listado += `<div class="result-card" style="border-color: #ef4444;">No se encontraron registros que coincidan con la búsqueda.</div>`;
    }

    listado += `<a href="/" class="back-link">← Realizar otra búsqueda</a>`;
    res.send(renderHTML(listado));
});

app.listen(PORT, () => console.log("Servidor Online"));

