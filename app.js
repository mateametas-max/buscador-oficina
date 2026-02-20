const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

// CONFIGURACIÓN DRIVE (Data pesada de 63MB)
const FILE_ID = '1Vx94bWfuI14uUXtFtckC1QFrn_WxVajj'; 
const urlDrive = `https://docs.google.com/uc?export=download&id=${FILE_ID}&confirm=t`;

let baseDeDatos = [];
let statusCarga = "⏳ Descargando base de datos...";

// Función para cargar los datos de Drive a la memoria del servidor
async function cargarDatos() {
    try {
        const res = await axios.get(urlDrive, { timeout: 150000 });
        let datos = res.data;
        // Extraer la lista de registros (si es Array o está dentro de un objeto)
        baseDeDatos = Array.isArray(datos) ? datos : (Object.values(datos).find(Array.isArray) || [datos]);
        statusCarga = `✅ SISTEMA LISTO: ${baseDeDatos.length} registros cargados.`;
    } catch (e) {
        statusCarga = "❌ Error al cargar datos de Drive.";
        console.error(e.message);
    }
}
cargarDatos();

// RUTA DE BÚSQUEDA (Solo consulta)
// BUSCADOR HÍBRIDO: Drive + API Externa
app.get('/api/buscar', async (req, res) => {
    const q = (req.query.q || "").trim().toUpperCase();
    if (!q) return res.json([]);

    // A. Buscar en tus 63MB descargados de Drive
    let resultados = baseDeDatos.filter(f => 
        Object.values(f).some(v => String(v).toUpperCase().includes(q))
    ).slice(0, 10);

    // B. Si es una cédula (solo números), consultar también afuera
    const esCedula = /^\d+$/.test(q); 
    
    if (esCedula) {
        try {
            // Intentamos obtener datos frescos de la API externa
            const resExt = await axios.get(`https://api.cedula.com.ve/v1/cedula/${q}`, { timeout: 3000 });
            
            if (resExt.data && resExt.data.data) {
                const d = resExt.data.data;
                // Agregamos el resultado externo al principio de la lista
                resultados.unshift({
                    CEDULA: d.cedula,
                    NOMBRE: `${d.primer_nombre} ${d.primer_apellido}`,
                    INFO: "DATO ACTUALIZADO (API EXTERNA)",
                    ESTADO: d.estado || "N/A"
                });
            }
        } catch (error) {
            console.log("No se pudo consultar el sitio externo, usando solo Drive.");
        }
    }

    res.json(resultados);
});
// INTERFAZ DE USUARIO (Misma pantalla)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador Valencia</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: white; text-align: center; padding: 20px; }
        .container { max-width: 600px; margin: auto; }
        .search-box { background: #1e293b; padding: 25px; border-radius: 15px; border: 1px solid #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        input { width: 75%; padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: white; font-size: 16px; outline: none; }
        input:focus { border-color: #38bdf8; }
        button { padding: 12px 20px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        button:hover { background: #0ea5e9; }
        #resultados { margin-top: 25px; text-align: left; }
        .card { background: #1e293b; padding: 15px; margin-bottom: 12px; border-radius: 10px; border-left: 5px solid #38bdf8; animation: slideIn 0.3s ease-out; }
        .label { color: #38bdf8; font-size: 11px; font-weight: bold; text-transform: uppercase; display: block; }
        .value { font-size: 15px; margin-bottom: 5px; display: block; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Buscador Maestro</h1>
        <p style="color: #94a3b8;">${statusCarga}</p>

        <div class="search-box">
            <input type="text" id="busqueda" placeholder="Cédula o Nombre..." onkeyup="if(event.key==='Enter') buscar()">
            <button onclick="buscar()">BUSCAR</button>
        </div>

        <div id="resultados"></div>
    </div>

    <script>
        async function buscar() {
            const query = document.getElementById('busqueda').value;
            const resDiv = document.getElementById('resultados');
            
            if (!query) return;
            resDiv.innerHTML = '<p style="text-align:center; color:#38bdf8;">Buscando en la base de datos...</p>';

            try {
                const response = await fetch('/api/buscar?q=' + encodeURIComponent(query));
                const datos = await response.json();
                
                resDiv.innerHTML = '';
                
                if (datos.length === 0) {
                    resDiv.innerHTML = '<p style="text-align:center;">No se hallaron coincidencias.</p>';
                    return;
                }

                datos.forEach(registro => {
                    let div = document.createElement('div');
                    div.className = 'card';
                    let contenido = '';
                    for (let llave in registro) {
                        contenido += '<div><span class="label">' + llave + '</span><span class="value">' + registro[llave] + '</span></div>';
                    }
                    div.innerHTML = contenido;
                    resDiv.innerHTML += div.outerHTML;
                });
            } catch (error) {
                resDiv.innerHTML = '<p style="color:red; text-align:center;">Error en la conexión.</p>';
            }
        }
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log("Servidor de búsqueda activo"));

