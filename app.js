const express = require('express');
const axios = require('axios'); // Asegúrate de tener axios instalado: npm install axios
const app = express();
const PORT = process.env.PORT || 3000;

let baseDeDatos = [];
let statusCarga = "⏳ Iniciando sistema...";
const DRIVE_URL = "TU_URL_DE_GOOGLE_DRIVE_AQUÍ"; // Reemplaza con tu enlace JSON/CSV

async function cargarDatos() {
    try {
        const res = await axios.get(DRIVE_URL);
        const datos = res.data;
        
        if (Array.isArray(datos)) {
            baseDeDatos = datos;
        } else if (typeof datos === 'object' && datos !== null) {
            const clave = Object.keys(datos).find(k => Array.isArray(datos[k]));
            baseDeDatos = clave ? datos[clave] : [datos];
        }

        statusCarga = `✅ ONLINE: ${baseDeDatos.length} registros cargados.`;
        console.log("Datos sincronizados.");
        return true;
    } catch (e) {
        statusCarga = "❌ ERROR: No se sincronizó con Drive.";
        console.error("Error de carga:", e.message);
        return false;
    }
}

// Cargar al inicio
cargarDatos();

// --- RUTAS DE LA API ---

// 1. Página Principal (Frontend Unificado)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador Valencia Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0f172a; color: #f8fafc; }
        .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(56, 189, 248, 0.2); }
        .card-result { transition: all 0.3s ease; border-left: 4px solid #38bdf8; }
        .card-result:hover { transform: translateX(5px); background: #1e293b; }
        .loader { width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #38bdf8; border-radius: 50%; animation: spin 1
