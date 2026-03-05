const express = require('express');
const router = express.Router();
const paymentRulesController = require('../controllers/payment_rulesController');

// Rutas principales
router.get('/', paymentRulesController.getAll);
router.post('/bulk', paymentRulesController.updateBulk);
router.post('/reset', paymentRulesController.reset);
router.post('/apply', paymentRulesController.apply);

// Rutas por método
router.get('/:metodo', paymentRulesController.getByMetodo);
router.put('/:metodo', paymentRulesController.update);

module.exports = router;