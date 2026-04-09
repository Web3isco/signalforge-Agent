const {
  buildPaymentRequest,
  isPaymentConfirmed
} = require("../services/paymentService");
const { getTradingSignal } = require("../services/signalService");

function getSignal(request, response) {
  const paymentRequest = buildPaymentRequest();

  // x402-style flow:
  // 1. A client requests the protected resource.
  // 2. The server replies with HTTP 402 and payment instructions.
  // 3. The client pays, then retries with proof of payment.
  // 4. The server validates the proof and returns the premium signal.
  if (!isPaymentConfirmed(request)) {
    return response.status(402).json({
      message: "Payment required before accessing this trading signal.",
      payment: paymentRequest
    });
  }

  return response.json({
    message: "Payment confirmed. Returning trading signal.",
    signal: getTradingSignal()
  });
}

module.exports = {
  getSignal
};
