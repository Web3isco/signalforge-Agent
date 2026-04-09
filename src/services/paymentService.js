const PAYMENT_DETAILS = {
  amount: "0.02",
  asset: process.env.STELLAR_PAYMENT_ASSET || "XLM",
  stellarTestnetAddress:
    process.env.STELLAR_DESTINATION_ADDRESS ||
    "GBRPYHIL2C7QK4PZ5SWL5M3Y2M6K7V7FQ2A2X4H4D3P5T6J7N8Q9R0ST"
};

function buildPaymentRequest() {
  return {
    ...PAYMENT_DETAILS,
    memo: "signal-access",
    network: "Stellar Testnet",
    assetIssuer: process.env.STELLAR_ASSET_ISSUER || null,
    instructions:
      "Send the exact amount on Stellar Testnet, then retry with x-payment-confirmed: true."
  };
}

function isPaymentConfirmed(request) {
  const headerValue = request.header("x-payment-confirmed");
  const queryValue = request.query.paid;

  return headerValue === "true" || queryValue === "true";
}

module.exports = {
  buildPaymentRequest,
  isPaymentConfirmed
};
