const axios = require('axios');
const db = require('../db');

async function actualizarDolar() {
    try {
        const { data } = await axios.get('https://api.bluelytics.com.ar/v2/latest');
        const tipos = ['oficial', 'blue', 'mep'];

        for (const tipo of tipos) {
            if (data) {
                await db.query(
                    'INSERT INTO dolar (tipo, compra, venta) VALUES (?,?,?)',
                    [tipo, data.value_buy, data.value_sell]
                );
            }
        }
        console.log(`[${new Date().toLocaleString()}] Dólar actualizado`);
    } catch (err) {
        console.error('Error dólar:', err.message);
    }
}

async function actualizarTasas() {
    try {
        const { data } = await axios.get('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo');

        for (const banco of data) {
            await db.query(`
                INSERT INTO bancos_tasas (nombre, tna)
                VALUES (?,?)
                ON DUPLICATE KEY UPDATE tna =?, fecha_actualizacion = NOW()
            `, [banco.entidad, banco.tnaClientes, banco.tnaClientes]);

            const = await db.query('SELECT id FROM bancos_tasas WHERE nombre =?', [banco.entidad]);

            if (rows.length > 0) {
                await db.query(
                    'INSERT INTO historial_tasas (banco_id, tna, fecha) VALUES (?,?, CURDATE()) ON DUPLICATE KEY UPDATE tna =?',
                    [rows[0].id, banco.tnaClientes, banco.tnaClientes]
                );
            }
        }
        console.log(`[${new Date().toLocaleString()}] Tasas BCRA actualizadas: ${data.length} bancos`);
    } catch (err) {
        console.error('Error tasas:', err.message);
    }
}

module.exports = { actualizarDolar, actualizarTasas };