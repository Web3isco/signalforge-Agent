const { loadConfig } = require("../lib/config");
const { fetchSignal, fetchSignalWithPayment } = require("./signalClient");
const { createPaymentProof } = require("../lib/stellarPayment");
const { createTrader } = require("./trading");
const { initMppClient } = require("../lib/mppClient");
const { checkSorobanGuardrail } = require("../lib/sorobanGuardrail");

async function runAgent({ endpoint, logger }) {
  const config = loadConfig();
  const trader = createTrader();
  const logs = logger;

  await initMppClient(config, logs);

  logs.info("Starting autonomous trading agent");
  logs.info(`Signal endpoint: ${endpoint}`);
  logs.info(`Budget available for paid signals: $${config.maxBudget.toFixed(2)}`);

  const first = await fetchSignal(endpoint);

  if (first.status !== 402) {
    logs.info("Signal received without payment");
    return handleSignal(first.signal, config, trader, logs);
  }

  logs.info("🧠 Analyzing market...");
  logs.info(`💸 Signal costs $${first.payment.amount}`);
  logs.info(
    `🤔 Is it worth it? ${
      first.payment.previewConfidence >= config.minConfidence ? "YES" : "NO"
    }`
  );

  if (first.payment.previewConfidence < config.minConfidence) {
    throw new Error("Signal confidence below threshold. Not buying signal.");
  }

  if (config.maxBudget < Number(first.payment.amount)) {
    throw new Error("Budget too low to pay for signal.");
  }

  const guardrail = await checkSorobanGuardrail(
    config,
    Number(first.payment.amount),
    logs
  );
  if (!guardrail.allowed) {
    throw new Error(`Soroban guardrail denied spend: ${guardrail.reason}`);
  }

  logs.info("⚡ Paying via Stellar...");
  const paymentResult = await createPaymentProof(first.payment, logs);

  const paymentSummary = {
    simulated: paymentResult.simulated,
    transactionId: paymentResult.transactionId,
    explorerUrl: paymentResult.explorerUrl,
    sourcePublicKey: paymentResult.sourcePublicKey,
    destination: paymentResult.destination,
    amount: first.payment.amount,
    asset: first.payment.asset
  };

  logs.info("✅ Payment successful");
  logs.json(paymentSummary);

  const paid = await fetchSignalWithPayment(endpoint, paymentResult);
  return handleSignal(paid.signal, config, trader, logs, paymentSummary);
}

function handleSignal(signal, config, trader, logs, paymentResult) {
  logs.info(`📡 Signal received: ${signal.action} ${signal.pair}`);
  logs.info(`Confidence: ${(signal.confidence * 100).toFixed(0)}%`);

  if (signal.confidence < config.minConfidence) {
    logs.warn("Signal confidence below threshold. Skipping trade.");
    return {
      signal,
      payment: paymentResult || null,
      trade: null,
      pnl: trader.getPnl(),
      history: trader.getHistory()
    };
  }

  logs.info("📈 Executing trade...");
  const trade = trader.execute(signal);
  logs.info(
    trade.executed
      ? `✅ ${trade.action} XLM @ ${trade.price}`
      : "Trade skipped"
  );
  logs.info(`💰 P&L: ${trader.getPnl().toFixed(2)}`);

  return {
    signal,
    payment: paymentResult || null,
    trade,
    pnl: trader.getPnl(),
    history: trader.getHistory()
  };
}

module.exports = { runAgent };
