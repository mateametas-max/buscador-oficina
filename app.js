const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 10000;

// --- CONFIGURACIÓN DATA VALENCIA (63MB) ---
const FILE_ID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}&confirm=t`;

let baseDeDatos = [];
let statusCarga = "⏳ Iniciando Sistema V4...";
let psuvCookie = "";

// --- 1. FUNCIÓN LOGIN PSUV (CORREO + CLAVE) ---
async function loginPSUV() {
    try {
        console.log("Intentando conectar con servidor PSUV...");
        // Paso 1: Obtener cookies de sesión inicial
        const res1 = await axios.get('https://organizacion.psuv.org.ve/', { timeout: 15000 });
        let cookieInic = res1.headers['set-cookie'] ? res1.headers['set-cookie'].join('; ') : "";

        // Paso 2: Enviar credenciales (Correo y Clave)
        const params = new URLSearchParams();
        params.append('usuario', 'jfederico2007@gmail.com'); // <--- REEMPLAZA CON TU CORREO
        params.append('password', '12345678');      // <--- REEMPLAZA CON TU CLAVE
        params.append('accion', 'login');

        const resLogin = await axios.post('https://organizacion.psuv.org.ve/login/', params, {
            headers: {
                'Cookie': cookieInic,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://organizacion.psuv.org.ve/'
            },
            maxRedirects: 0,
            validateStatus: s => s >= 200 && s < 400
        });
        
        psuvCookie = resLogin.headers['set-cookie'] ? resLogin.headers['set-cookie'].join('; ') : cookieInic;
        console.log("✅ Sesión PSUV establecida correctamente.");
    } catch (e) {
        console.log("⚠️ Error en Login PSUV. Verificando disponibilidad...");
    }
}

// --- 2. CARGA DE BASE DE DATOS DRIVE ---
async function cargarDatos() {
    try {
        const res = await axios.get(urlDrive, { timeout: 250000 });
        baseDeDatos = Array.isArray(res.data) ? res.data : (Object.values(res.data).find(Array.isArray) || [res.data]);
        statusCarga = "✅ MAESTRO V4: ONLINE";
        console.log("Data local cargada.");
        login
