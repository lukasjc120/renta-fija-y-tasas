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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    actualizarDolar();
    actualizarTasas();
    cron.schedule('0 * * * *', () => {
        console.log('Ejecutando actualización automática...');
        actualizarDolar();
        actualizarTasas();
    });
});