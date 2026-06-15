const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const { actualizarDolar, actualizarTasas } = require('./jobs/updateData');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);
app.use(express.static('../frontend'));

// Fuerza el puerto 3001
const PORT = 3001;

console.log('Puerto configurado:', PORT);

app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);

    try {
        await actualizarDolar();
        await actualizarTasas();
    } catch (err) {
        console.error('Error en actualización inicial:', err);
    }

    // Ejecutar cada hora
    cron.schedule('0 * * * *', async () => {
        console.log('Ejecutando actualización automática...');

        try {
            await actualizarDolar();
            await actualizarTasas();
        } catch (err) {
            console.error('Error en cron:', err);
        }
    });
});