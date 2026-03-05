const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Ventas
router.get('/', salesController.getAll);
router.get('/:id', salesController.getOne);
router.post('/', salesController.create);
router.delete('/:id', salesController.delete);

// Filtros y reportes
router.get('/date/range', salesController.getByDate);
router.get('/summary/daily', salesController.getSummary);

module.exports = router;