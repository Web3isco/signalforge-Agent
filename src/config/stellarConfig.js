const STELLAR_TESTNET_HORIZON_URL =
  process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const STELLAR_TESTNET_EXPLORER_TX_BASE_URL =
  process.env.STELLAR_EXPLORER_TX_BASE_URL ||
  "https://stellar.expert/explorer/testnet/tx/";
const STELLAR_NETWORK = "Stellar Testnet";

function shouldUseRealPayments() {
  return process.env.STELLAR_REAL_PAYMENTS === "true";
}

module.exports = {
  STELLAR_TESTNET_HORIZON_URL,
  STELLAR_TESTNET_EXPLORER_TX_BASE_URL,
  STELLAR_NETWORK,
  shouldUseRealPayments
};
