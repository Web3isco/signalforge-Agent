function getTradingSignal() {
  return {
    pair: "XLM/USDC",
    action: "BUY",
    confidence: 0.78
  };
}

module.exports = {
  getTradingSignal
};
