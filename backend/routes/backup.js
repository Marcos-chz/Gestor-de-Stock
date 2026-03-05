const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

// Verificar que el controller existe
console.log('📦 backupController:', backupController);

// Rutas de backup
router.get('/', backupController.listar);
router.post('/', backupController.crear);
router.post('/restaurar/:nombre', backupController.restaurar);
router.delete('/:nombre', backupController.eliminar);

module.exports = router;