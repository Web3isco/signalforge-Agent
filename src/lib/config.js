const DEFAULT_SIGNAL_ENDPOINT = "http://localhost:3000/signal";
const DEFAULT_USDC_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

function loadConfig() {
  return {
    port: Number(process.env.PORT || 3000),
    signalEndpoint: process.env.SIGNAL_ENDPOINT || DEFAULT_SIGNAL_ENDPOINT,
    signalPriceUsd: Number(process.env.SIGNAL_PRICE_USDC || 0.02),
    maxBudget: Number(process.env.MAX_BUDGET_USD || 10),
    minConfidence: Number(process.env.MIN_CONFIDENCE || 0.6),
    previewConfidence: Number(process.env.PREVIEW_CONFIDENCE || 0.78),
    stellarHorizonUrl:
      process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org",
    stellarNetwork: "Stellar Testnet",
    stellarExplorerBase:
      process.env.STELLAR_EXPLORER_TX_BASE_URL ||
      "https://stellar.expert/explorer/testnet/tx/",
    usdcIssuer: process.env.STELLAR_ASSET_ISSUER || DEFAULT_USDC_ISSUER,
    signalDestination:
      process.env.STELLAR_DESTINATION_ADDRESS || "MISSING_DESTINATION",
    stellarSecret: process.env.STELLAR_SECRET || "",
    stellarPublic: process.env.STELLAR_PUBLIC || "",
    enableRealPayments: process.env.STELLAR_REAL_PAYMENTS === "true",
    enableMpp: process.env.ENABLE_MPP === "true",
    mppSecretKey: process.env.MPP_SECRET_KEY || "",
    sorobanRpcUrl:
      process.env.SOROBAN_RPC_URL ||
      "https://soroban-testnet.stellar.org",
    sorobanContractId: process.env.SOROBAN_CONTRACT_ID || "",
    enableSorobanGuardrail: process.env.ENABLE_SOROBAN_GUARDRAIL === "true"
  };
}

module.exports = { loadConfig };
