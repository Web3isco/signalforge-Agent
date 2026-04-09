function decideFromSignal(signal, minimumConfidence) {
  if (!signal) {
    throw new Error("No signal received from the server.");
  }

  const shouldAct = signal.confidence >= minimumConfidence;

  return {
    pair: signal.pair,
    suggestedAction: signal.action,
    confidence: signal.confidence,
    minimumConfidence,
    shouldExecuteTrade: shouldAct,
    reason: shouldAct
      ? "Signal confidence meets threshold. Trade can proceed."
      : "Signal confidence below threshold. Trade will be skipped."
  };
}

module.exports = {
  decideFromSignal
};
