const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// 1. CONFIGURACIÓN DE DRIVE (Tus 63MB)
const FILE_ID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}&confirm=t`;

let baseDeDatos = [];
let statusCarga = "⏳ Descargando base de datos de Valencia...";

// Función para cargar los datos en memoria
async function cargarDatos() {
    try {
        const res = await axios.get(urlDrive, { timeout: 200000 });
        let datos = res.data;
        baseDeDatos = Array.isArray(datos) ? datos : (Object.values(datos).find(Array.isArray) || [datos]);
        statusCarga = `✅ SISTEMA ONLINE: ${baseDeDatos.length} registros cargados.`;
        console.log("Datos cargados correctamente.");
    } catch (e) {
        statusCarga = "❌ Error al conectar con Drive. Reintentando...";
        setTimeout(cargarDatos, 10000);
    }
}
cargarDatos();

// 2. RUTA DE BÚSQUEDA
app.get('/api/buscar', (req, res) => {
    const q = (req.query.q || "").trim().toUpperCase();
    if (!q) return res.json([]);

    // Búsqueda en los 63MB locales
    let resultados = baseDeDatos.filter(f => 
        Object.values(f).some(v => String(v).toUpperCase().includes(q))
    ).slice(0, 15);

    // Si es cédula y no hay resultados, preparamos links externos
    const esCedula = /^\d+$/.test(q);
    if (esCedula && resultados.length === 0) {
        resultados.push({
            ES_AYUDA: true,
            CEDULA: q,
            MENSAJE: "No encontrado en Valencia. Consultar sistema nacional:"
        });
    }
    res.json(resultados);
});

// 3. INTERFAZ VISUAL (HTML + CSS + JS)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador Maestro Valencia</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: white; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .container { width: 100%; max-width: 500px; }
        h1 { color: #38bdf8; margin-bottom: 10px; font-size: 24px; }
        .status { font-size: 12px; color: #94a3b8; margin-bottom: 20px; }
        .search-box { background: #1e293b; padding: 20px; border-radius: 15px; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: white; font-size: 16px; box-sizing: border-box; outline: none; transition: 0.3s; }
        input:focus { border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }
        button { width: 100%; padding: 12px; margin-top: 10px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px; }
        button:hover { background: #0ea5e9; }
        #res { margin-top: 20px; width: 100%; }
        .card { background: #1e293b; padding: 15px; margin-bottom: 10px; border-radius: 10px; border-left: 4px solid #38bdf8; animation: fadeIn 0.3s ease; }
        .card b { color: #38bdf8; font-size: 12px; text-transform: uppercase; }
        .card div { margin-bottom: 5px; }
        .ayuda-box { background: #1e293b; border: 2px dashed #f59e0b; padding: 15px; border-radius: 10px; text-align: center; }
        .btn-ext { display: block; padding: 10px; margin: 8px 0; border-radius: 6px; text-decoration: none; font-weight: bold; color: white; font-size: 14px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Buscador Maestro</h1>
        <div class="status">${statusCarga}</div>

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

                if(datos.length === 0) {
                    resDiv.innerHTML = '<p style="text-align:center;">No se encontró información.</p>';
                    return;
                }

                datos.forEach(r => {
                    if(r.ES_AYUDA) {
