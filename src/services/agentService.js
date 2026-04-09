const {
  fetchSignal,
  fetchSignalWithPaymentProof,
  parsePaymentRequired
} = require("../agent/signalClient");
const { createPaymentProof } = require("../agent/stellarPayment");
const { decideFromSignal } = require("../agent/decisionEngine");

function createAgentService({
  endpoint,
  budget,
  tradingEngine,
  minimumConfidence,
  logger
}) {
  async function run() {
    const firstResponse = await fetchSignal(endpoint);
    const signalResult = await obtainSignal(firstResponse);
    const decision = decideFromSignal(signalResult.signal, minimumConfidence);
    const tradeResult = tradingEngine.executeTrade(decision);
    logger.info(
      tradeResult.executed
        ? `Trade executed: ${tradeResult.trade.action} ${tradeResult.trade.quantityXlm} XLM`
        : `Trade skipped: ${tradeResult.reason}`
    );

    return {
      decision,
      paymentSummary: signalResult.paymentSummary,
      tradeSummary: tradeResult.executed
        ? tradeResult.trade
        : { executed: false, reason: tradeResult.reason },
      pnl: tradeResult.pnl,
      tradeHistory: tradeResult.tradeHistory
    };
  }

  async function obtainSignal(initialResponse) {
    if (initialResponse.status !== 402) {
      return {
        signal: initialResponse.signal,
        paymentSummary: null
      };
    }

    const paymentRequest = parsePaymentRequired(initialResponse);
    const paymentAmount = Number(paymentRequest.amount);

    logger.info(
      `Agent decided to pay for premium signal: ${paymentRequest.amount} ${paymentRequest.asset}`
    );

    budget.assertCanSpend(paymentAmount);

    const paymentResult = await createPaymentProof(paymentRequest);
    budget.recordSpend(paymentAmount);

    logger.info(
      paymentResult.simulated
        ? "Payment simulated on Stellar Testnet"
        : "Payment submitted on Stellar Testnet"
    );
    logger.json({
      sourcePublicKey: paymentResult.sourcePublicKey,
      transactionId: paymentResult.transactionId,
      simulated: paymentResult.simulated,
      explorerUrl: paymentResult.explorerUrl
    });

    const paidResponse = await fetchSignalWithPaymentProof(endpoint, paymentResult);

    return {
      signal: paidResponse.signal,
      paymentSummary: {
        amount: paymentRequest.amount,
        asset: paymentRequest.asset,
        transactionId: paymentResult.transactionId,
        simulated: paymentResult.simulated,
        explorerUrl: paymentResult.explorerUrl,
        network: paymentResult.network
      }
    };
  }

  return {
    run
  };
}

module.exports = {
  createAgentService
};
