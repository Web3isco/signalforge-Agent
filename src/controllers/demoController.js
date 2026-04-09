const { createBudgetManager } = require("../agent/budgetManager");
const { createTradingEngine } = require("../agent/tradingEngine");
const { createAgentService } = require("../services/agentService");
const { MIN_CONFIDENCE } = require("../config/agentConfig");
const { createLogger } = require("../utils/logger");

async function runDemoAgent(_request, response, next) {
  try {
    const budget = createBudgetManager(10);
    const tradingEngine = createTradingEngine();
    const logger = createLogger("Demo");
    const events = [];

    const agentService = createAgentService({
      endpoint: "http://localhost:3000/signal",
      budget,
      tradingEngine,
      minimumConfidence: MIN_CONFIDENCE,
      logger: createEventLogger(logger, events)
    });

    const result = await agentService.run();

    response.json({
      status: "ok",
      events,
      uiTimeline: buildUiTimeline(result, budget),
      budget: {
        spentUsd: budget.getSpent(),
        remainingUsd: budget.getRemainingBudget()
      },
      ...result
    });
  } catch (error) {
    next(error);
  }
}

function buildUiTimeline(result, budget) {
  const timeline = [];
  const paymentAmount = result.paymentSummary?.amount || "0.00";
  const paymentAsset = result.paymentSummary?.asset || "USDC";
  const transactionId = result.paymentSummary?.transactionId || "PENDING";
  const worthIt = result.decision.shouldExecuteTrade ? "YES" : "NO";
  const paymentMode = result.paymentSummary?.simulated ? "mock" : "real";

  timeline.push({
    kind: "decision",
    icon: "🧠",
    title: "Analyzing market...",
    detail: `Evaluating paid signal for ${result.decision.pair}.`
  });
  timeline.push({
    kind: "decision",
    icon: "💸",
    title: `Signal costs $${paymentAmount}`,
    detail: `Settlement asset: ${paymentAsset}`
  });
  timeline.push({
    kind: "decision",
    icon: "🤔",
    title: `Is it worth it? ${worthIt}`,
    detail: result.decision.reason
  });

  if (result.paymentSummary) {
    timeline.push({
      kind: "payment",
      icon: "⚡",
      title: "Paying via Stellar...",
      detail:
        paymentMode === "real"
          ? "Submitting a real payment on Stellar Testnet."
          : "Submitting a mock payment on Stellar Testnet."
    });
    timeline.push({
      kind: "payment",
      icon: "✅",
      title: `Payment successful (tx: ${transactionId})`,
      detail:
        paymentMode === "real"
          ? `Real testnet payment confirmed for ${result.decision.pair}.`
          : `Signal unlocked for ${result.decision.pair}.`
    });
  }

  timeline.push({
    kind: "signal",
    icon: "📡",
    title: "Signal received",
    detail: `${result.decision.suggestedAction} ${result.decision.pair} (confidence: ${result.decision.confidence.toFixed(
      2
    )})`
  });

  timeline.push({
    kind: "trade",
    icon: "📈",
    title: "Executing trade...",
    detail: result.decision.shouldExecuteTrade
      ? `Preparing ${result.decision.suggestedAction} execution.`
      : "Trade policy blocks execution."
  });

  timeline.push({
    kind: "trade",
    icon: result.tradeSummary.executed === false ? "⏸️" : "✅",
    title:
      result.tradeSummary.executed === false
        ? "Trade skipped"
        : `${
            result.tradeSummary.action === "BUY" ? "Bought" : "Sold"
          } XLM`,
    detail:
      result.tradeSummary.executed === false
        ? result.tradeSummary.reason
        : `${result.tradeSummary.quantityXlm} XLM at $${result.tradeSummary.priceUsd.toFixed(
            4
          )}`
  });

  timeline.push({
    kind: "pnl",
    icon: "💰",
    title: `P&L: ${formatSignedUsd(result.pnl.totalPnlUsd)}`,
    detail: `Spent: $${budget.getSpent().toFixed(2)} | Remaining: $${budget
      .getRemainingBudget()
      .toFixed(2)}`
  });

  return timeline;
}

function formatSignedUsd(value) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}$${Math.abs(value).toFixed(2)}`;
}

function createEventLogger(logger, events) {
  return {
    info(message) {
      events.push({
        level: "info",
        timestamp: new Date().toISOString(),
        message
      });
      logger.info(message);
    },
    json(value) {
      events.push({
        level: "json",
        timestamp: new Date().toISOString(),
        payload: value
      });
      logger.json(value);
    }
  };
}

module.exports = {
  runDemoAgent
};
