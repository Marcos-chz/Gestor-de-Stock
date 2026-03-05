const express = require("express");
const router = express.Router();
const seasonsController = require("../controllers/seasonsController");

// CRUD Seasons
router.get("/", seasonsController.getAll);      
router.post("/", seasonsController.create);     
router.put("/:id", seasonsController.update);   
router.delete("/:id", seasonsController.delete); 

module.exports = router;
