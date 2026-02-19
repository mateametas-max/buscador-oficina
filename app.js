const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// Tu ID de archivo que ya vinculamos anteriormente
const FILE_ID = '1XlS_f8zXlR1f6FhP5YqOq_X-R8n7Jz9D'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}`;

let baseDeDatos = [];

// 1. CARGA INICIAL DE DATOS LOCALES
async function cargarDatos() {
    try {
        console.log("Cargando base de datos local desde Drive...");
        const res = await axios.get(urlDrive);
        baseDeDatos = Array.isArray(res.data) ? res.data : [];
        console.log(`✅ Base local lista. Registros: ${baseDeDatos.length}`);
    } catch (e) {
        console.error("❌ Error al cargar Drive. Trabajando solo con consultas externas.");
    }
}
cargarDatos();

// 2. DISEÑO DE LA PÁGINA (HTML/CSS)
const headerHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador Pro Valencia</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: white; }
        .container { background: #1e293b; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); width: 90%; max-width: 400px; text-align: center; border: 1px solid #334155; }
        h1 { color: #38bdf8; font-size: 24px; margin-bottom: 20px; }
        input { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #334155; border-radius: 8px; box-sizing: border-box; font-size: 16px; background: #0f172a; color: white; }
        button { width: 100%; padding: 12px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        button:hover { background: #0ea5e9; transform: scale(1.02); }
        .result-card { margin-top: 20px; padding: 15px; border-radius: 10px; text-align: left; border-left: 5px solid; background: #334155; }
        .success { border-color: #22c55e; }
        .warning { border-color: #eab308; }
        .error { border-color: #ef4444; }
        a { display: block; margin-top: 15px; color: #38bdf8; text-decoration: none; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
`;

// 3. RUTA PRINCIPAL
app.get('/', (req, res) => {
    res.send(`${headerHTML}
        <h1>🔍 Buscador Pro</h1>
        <p style="color: #
