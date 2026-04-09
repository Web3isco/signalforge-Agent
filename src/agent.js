const { loadConfig } = require("./lib/config");
const { runAgent } = require("./agent/runAgent");
const { createLogger } = require("./lib/logger");

const config = loadConfig();
const logger = createLogger("Agent");

runAgent({ endpoint: config.signalEndpoint, logger })
  .then((result) => {
    logger.info("Agent run complete");
    logger.json(result);
  })
  .catch((error) => {
    logger.error(error.message);
    process.exitCode = 1;
  });
