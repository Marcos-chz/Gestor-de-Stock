const express = require('express');
const router = express.Router();
const saleItemsController = require('../controllers/sale_itemsController');

// Todos los items
router.get('/', saleItemsController.getAll);
router.get('/summary', saleItemsController.getSummary);
router.get('/:id', saleItemsController.getOne);

// Items por venta
router.get('/sale/:saleId', saleItemsController.getBySaleId);
router.delete('/sale/:saleId', saleItemsController.deleteBySaleId);

// CRUD individual
router.post('/', saleItemsController.create);
router.put('/:id', saleItemsController.update);
router.delete('/:id', saleItemsController.delete);

module.exports = router;