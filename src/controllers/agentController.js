const { createBudgetManager } = require("../agent/budgetManager");
const { createTradingEngine } = require("../agent/tradingEngine");
const { createAgentService } = require("../services/agentService");
const {
  SIGNAL_ENDPOINT,
  MAX_BUDGET_USD,
  MIN_CONFIDENCE
} = require("../config/agentConfig");
const { createLogger } = require("../utils/logger");

async function runAgent() {
  const budget = createBudgetManager(MAX_BUDGET_USD);
  const tradingEngine = createTradingEngine();
  const logger = createLogger("Agent");
  const agentService = createAgentService({
    endpoint: SIGNAL_ENDPOINT,
    budget,
    tradingEngine,
    minimumConfidence: MIN_CONFIDENCE,
    logger
  });

  logger.info("Starting autonomous trading agent");
  logger.info(`Signal endpoint: ${SIGNAL_ENDPOINT}`);
  logger.info(
    `Budget available for paid signals: $${budget.getRemainingBudget().toFixed(2)}`
  );

  const result = await agentService.run();

  logger.info("Final decision");
  logger.json(result.decision);
  logger.info("Trade execution result");
  logger.json(result.tradeSummary);
  logger.info("P&L after trade");
  logger.json(result.pnl);
  logger.info("Trade history");
  logger.json(result.tradeHistory);
  logger.info(
    `Budget status: $${budget.getSpent().toFixed(2)} spent, $${budget
      .getRemainingBudget()
      .toFixed(2)} remaining`
  );
}

module.exports = {
  runAgent
};
