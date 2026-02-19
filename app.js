const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// URL de tu JSON en Google Drive (Direct Download)
const urlDrive = 'https://docs.google.com/uc?export=download&id=TU_ID_DE_ARCHIVO';

let baseDeDatos = [];

// Función para cargar los datos locales
async function cargarDatos() {
    try {
        const res = await axios.get(urlDrive);
        baseDeDatos = res.data;
        console.log(`¡Base de datos local cargada! Registros: ${baseDeDatos.length}`);
    } catch (e) {
        console.error("Error cargando Drive, usando base vacía.");
    }
}

cargarDatos();

// Función para consultar al CNE (Simulación de Scrapping)
async function consultarCNE(cedula) {
    try {
        // Usamos un servicio de consulta pública o el endpoint del CNE
        const urlCNE = `http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=${cedula}`;
        // Nota: Muchos servidores bloquean a Render, si esto falla, avisame para usar un "Proxy"
        return { info: "Consulta CNE activada", link: urlCNE };
    } catch (error) {
        return null;
    }
}

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Buscador Pro Valencia</title>
                <style>
                    body { font-family: sans-serif; text-align: center; padding: 50px; background: #f0f2f5; }
                    input { padding: 10px; width: 250px; border-radius: 5px; border: 1px solid #ddd; }
                    button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
                    .card { background: white; padding: 20px; margin: 20px auto; width: 300px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .cne-link { color: #d9534f; font-weight: bold; text-decoration: none; }
                </style>
            </head>
            <body>
                <h1>🔍 Buscador Inteligente</h1>
                <form action="/buscar" method="get">
                    <input type="text" name="cedula" placeholder="Ingresa Cédula..." required>
                    <button type="submit">Buscar</button>
                </form>
            </body>
        </html>
    `);
});

app.get('/buscar', async (req, res) => {
    const cedula = req.query.cedula;
    const resultado = baseDeDatos.find(p => p.cedula == cedula || p.V == cedula);

    if (resultado) {
        res.send(`
            <div style="text-align:center; padding:50px; font-family:sans-serif;">
                <div class="card" style="display:inline-block; background:white; padding:30px; border-radius:15px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                    <h2 style="color:#28a745;">✅ Encontrado en Base Local</h2>
                    <p><strong>Nombre:</strong> ${resultado.nombre || resultado.N}</p>
                    <p><strong>Cédula:</strong> ${cedula}</p>
                    <a href="/">Volver</a>
                </div>
            </div>
        `);
    } else {
        // Si no está local, damos el link directo al CNE
        res.send(`
            <div style="text-align:center; padding:50px; font-family:sans-serif;">
                <div class="card" style="display:inline-block; background:white; padding:30px; border-radius:15px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                    <h2 style="color:#d9534f;">⚠️ No está en la Base Local</h2>
                    <p>La cédula ${cedula} no está en nuestro archivo de 60k.</p>
                    <p>Puedes verificarla directamente aquí:</p>
                    <a class="cne-link" href="http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=${cedula}" target="_blank">
                        🔗 CONSULTAR EN PÁGINA DEL CNE
                    </a>
                    <br><br>
                    <a href="/">Intentar otra</a>
                </div>
            </div>
        `);
    }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
