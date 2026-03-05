const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock_movementsController');

router.get("/recent", stockController.getRecent)

module.exports = router