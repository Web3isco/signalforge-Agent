const express = require("express");
const { runDemoAgent } = require("../controllers/demoController");

const router = express.Router();

router.post("/run-agent", runDemoAgent);

module.exports = router;
