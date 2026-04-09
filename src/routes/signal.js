const express = require("express");
const { getSignal } = require("../controllers/signalController");

const router = express.Router();

router.get("/", getSignal);

module.exports = router;
