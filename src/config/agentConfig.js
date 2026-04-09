const SIGNAL_ENDPOINT =
  process.env.SIGNAL_ENDPOINT || "http://localhost:3000/signal";
const MAX_BUDGET_USD = 10;
const MIN_CONFIDENCE = 0.6;

module.exports = {
  SIGNAL_ENDPOINT,
  MAX_BUDGET_USD,
  MIN_CONFIDENCE
};
