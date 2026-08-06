const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware para procesar JSON y servir la carpeta public (el front)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Endpoint GET: Lee y devuelve los registros de data.json
app.get('/api/indicators', (req, res) => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return res.json([]);
        }
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(fileData));
    } catch (error) {
        console.error('Error al leer data.json:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 2. Endpoint POST: Recibe datos del front y los guarda en data.json
app.post('/api/indicators', (req, res) => {
    try {
        let dataset = [];
        if (fs.existsSync(DATA_FILE)) {
            dataset = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }

        const newItem = {
            date: req.body.date,
            inflacion: parseFloat(req.body.inflacion) || 0,
            pbi: parseFloat(req.body.pbi) || 0,
            tipoCambioOficial: parseFloat(req.body.tipoCambioOficial) || 1000
        };

        // Evitar duplicados por fecha y agregar el nuevo
        dataset = dataset.filter(d => d.date !== newItem.date);
        dataset.push(newItem);

        fs.writeFileSync(DATA_FILE, JSON.stringify(dataset, null, 2), 'utf8');
        res.json({ success: true, data: newItem });
    } catch (error) {
        console.error('Error al guardar en data.json:', error);
        res.status(500).json({ error: 'No se pudo guardar el registro' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor unificado corriendo en http://localhost:${PORT}`);
});