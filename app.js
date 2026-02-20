const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// Tu link de Dropbox verificado
const urlDatos = 'https://www.dropbox.com/scl/fi/g65tf8bw4832m7iak1l12/personas.json?rlkey=ofybclvoebt2hg3omg9bvo20q&st=jykugoaq&dl=1'; 

let baseDeDatos = [];
let statusCarga = "⏳ Descargando base de datos pesada...";

async function cargarDatos() {
    try {
        console.log("Iniciando descarga desde Dropbox...");
        const res = await axios.get(urlDatos, { 
            timeout: 90000, // 90 segundos para archivos grandes
            maxContentLength: Infinity,
            maxBodyLength: Infinity 
        });
        
        let contenido = res.data;

        // --- DETECCIÓN INTELIGENTE DE ESTRUCTURA ---
        if (Array.isArray(contenido)) {
            // Caso 1: El JSON es una lista directa [{}, {}]
            baseDeDatos = contenido;
        } else if (typeof contenido === 'object' && contenido !== null) {
            // Caso 2: Los datos están dentro de una propiedad (ej: {"data": [...]})
            const claveLista = Object.keys(contenido).find(key => Array.isArray(contenido[key]));
            if (claveLista) {
                baseDeDatos = contenido[claveLista];
                console.log(`Lista encontrada en la propiedad: ${claveLista}`);
            } else {
                // Caso 3: Es un solo objeto
                baseDeDatos = [contenido];
            }
        }

        statusCarga =
