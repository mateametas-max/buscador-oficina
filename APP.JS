const express = require('express');
const fs = require('fs-extra');
const app = express();

let datos = []; 

async function cargarBaseDeDatos() {
    try {
        const contenido = await fs.readJson('./personas.json');
        datos = contenido.valencia || (Array.isArray(contenido) ? contenido : Object.values(contenido)[0]);
        console.log("¡Sistema Profesional Listo! Registros:", datos.length);
    } catch (err) {
        console.error("Error al cargar datos.");
    }
}

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sistema de Consultas - Valencia</title>
            <style>
                :root { --primary: #0062ff; --bg: #f8f9fa; --text: #333; }
                body { font-family: 'Segoe UI', Tahoma, sans-serif; background-color: var(--bg); margin: 0; padding: 20px; color: var(--text); }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
                
                h2 { margin-top: 0; color: #1a1a1a; display: flex; align-items: center; gap: 10px; }
                .search-area { display: flex; gap: 10px; margin-bottom: 20px; }
                
                input { flex: 1; padding: 12px 15px; border: 2px solid #eee; border-radius: 8px; font-size: 16px; outline: none; transition: 0.3s; }
                input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,98,255,0.1); }
                
                .btn { padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s; }
                .btn-search { background: var(--primary); color: white; }
                .btn-clear { background: #e4e6eb; color: #4b4b4b; }
                .btn:hover { opacity: 0.9; transform: translateY(-1px); }

                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background: #f8f9fa; text-align: left; padding: 12px; border-bottom: 2px solid #eee; color: #666; font-size: 13px; text-transform: uppercase; }
                td { padding: 12px; border-bottom: 1px solid #eee; font-size: 15px; }
                tr:hover { background-color: #f0f7ff; }
                
                .badge-cedula { background: #e7f3ff; color: var(--primary); padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; }
                #contador { margin-bottom: 15px; font-size: 14px; color: #888; }
                .btn-more { width: 100%; margin-top: 20px; background: #f0f2f5; color: var(--primary); display: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>📊 Panel de Consulta Valencia</h2>
                <div class="search-area">
                    <input type="text" id="bus" placeholder="Buscar por nombre o cédula..." onkeyup="if(event.key==='Enter') iniciarBusqueda()">
                    <button class="btn btn-search" onclick="iniciarBusqueda()">Consultar</button>
                    <button class="btn btn-clear" onclick="limpiar()">Limpiar</button>
                </div>
                
                <div id="contador"></div>
                
                <table id="tablaResultados" style="display:none;">
                    <thead>
                        <tr>
                            <th width="30%">Cédula</th>
                            <th>Nombre Completo</th>
                        </tr>
                    </thead>
                    <tbody id="cuerpoTabla"></tbody>
                </table>
                
                <button id="btnMas" class="btn btn-more" onclick="cargarDatos()">Mostrar más resultados</button>
            </div>

            <script>
                let query = "";
                let offset = 0;

                function limpiar() {
                    document.getElementById('bus').value = "";
                    document.getElementById('cuerpoTabla').innerHTML = "";
                    document.getElementById('tablaResultados').style.display = "none";
                    document.getElementById('contador').innerText = "";
                    document.getElementById('btnMas').style.display = "none";
                }

                async function iniciarBusqueda() {
                    query = document.getElementById('bus').value.trim();
                    offset = 0;
                    document.getElementById('cuerpoTabla').innerHTML = "";
                    if(query) await cargarDatos();
                }

                async function cargarDatos() {
                    const btn = document.getElementById('btnMas');
                    try {
                        const r = await fetch(\`/api/buscar?q=\${encodeURIComponent(query)}&inicio=\${offset}\`);
                        const d = await r.json();

                        if(d.total > 0) {
                            document.getElementById('tablaResultados').style.display = "table";
                            const html = d.resultados.map(p => \`
                                <tr>
                                    <td><span class="badge-cedula">\${p.CEDULA}</span></td>
                                    <td>\${p.NOMBRE}</td>
                                </tr>
                            \`).join('');
                            
                            document.getElementById('cuerpoTabla').innerHTML += html;
                            offset += d.resultados.length;
                            document.getElementById('contador').innerText = \`Resultados: \${offset} de \${d.total} registros encontrados\`;
                            btn.style.display = (offset < d.total) ? "block" : "none";
                        } else {
                            document.getElementById('contador').innerText = "No se encontraron registros.";
                            document.getElementById('tablaResultados').style.display = "none";
                        }
                    } catch (e) { console.error(e); }
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/api/buscar', (req, res) => {
    const q = req.query.q.toUpperCase();
    const inicio = parseInt(req.query.inicio) || 0;
    const filtrados = datos.filter(p => String(p.CEDULA).includes(q) || String(p.NOMBRE).includes(q));
    res.json({ total: filtrados.length, resultados: filtrados.slice(inicio, inicio + 50) });
});

app.listen(3000, () => {
    cargarBaseDeDatos();
    console.log("Sistema Pro activo en http://localhost:3000");
});