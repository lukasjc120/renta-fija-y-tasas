const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/tasas
router.get('/tasas', async (req, res) => {
    try {
        const = await db.query(`
            SELECT nombre, tna, fecha_actualizacion
            FROM bancos_tasas
            WHERE activo = 1
            ORDER BY tna DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dolar
router.get('/dolar', async (req, res) => {
    try {
        const = await db.query(`
            SELECT tipo, compra, venta, fecha_actualizacion
            FROM dolar
            WHERE id IN (SELECT MAX(id) FROM dolar GROUP BY tipo)
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/historial/:banco?periodo=1m
router.get('/historial/:banco', async (req, res) => {
    try {
        const { banco } = req.params;
        const { periodo = '1m' } = req.query;

        let intervalo = '30 DAY';
        if (periodo === '1d') intervalo = '1 DAY';
        if (periodo === '1w') intervalo = '7 DAY';
        if (periodo === '1m') intervalo = '30 DAY';
        if (periodo === '3m') intervalo = '90 DAY';
        if (periodo === '6m') intervalo = '180 DAY';
        if (periodo === '1y') intervalo = '365 DAY';

        const = await db.query(`
            SELECT h.tna, h.fecha
            FROM historial_tasas h
            JOIN bancos_tasas b ON h.banco_id = b.id
            WHERE b.nombre =? AND h.fecha >= DATE_SUB(CURDATE(), INTERVAL ${intervalo})
            ORDER BY h.fecha ASC
        `, [banco]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;