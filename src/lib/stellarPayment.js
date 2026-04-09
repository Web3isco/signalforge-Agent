const StellarSdk = require("@stellar/stellar-sdk");
const crypto = require("crypto");
const { loadConfig } = require("./config");

async function createPaymentProof(paymentRequest, logger) {
  const config = loadConfig();
  if (!paymentRequest.stellarTestnetAddress) {
    throw new Error("Payment destination is missing.");
  }

  if (config.enableRealPayments) {
    return submitRealPayment(paymentRequest, logger);
  }

  return simulatePayment(paymentRequest);
}

function buildAsset(paymentRequest, config) {
  if (paymentRequest.asset === "XLM") {
    return StellarSdk.Asset.native();
  }
  return new StellarSdk.Asset(paymentRequest.asset, paymentRequest.assetIssuer);
}

function simulatePayment(paymentRequest) {
  const keypair = StellarSdk.Keypair.random();
  const account = new StellarSdk.Account(keypair.publicKey(), "1");

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: paymentRequest.stellarTestnetAddress,
        asset: buildAsset(paymentRequest),
        amount: Number(paymentRequest.amount).toFixed(2)
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(keypair);

  const hash = crypto
    .createHash("sha256")
    .update(transaction.toXDR())
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();

  return {
    simulated: true,
    sourcePublicKey: keypair.publicKey(),
    destination: paymentRequest.stellarTestnetAddress,
    transactionId: hash,
    transactionXdr: transaction.toXDR(),
    explorerUrl: null
  };
}

async function submitRealPayment(paymentRequest, logger) {
  const config = loadConfig();

  if (!config.stellarSecret) {
    throw new Error("STELLAR_SECRET is required for real payments.");
  }

  const server = new StellarSdk.Horizon.Server(config.stellarHorizonUrl);
  const sourceKeypair = StellarSdk.Keypair.fromSecret(config.stellarSecret);
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
  const baseFee = await server.fetchBaseFee();

  const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: String(baseFee),
    networkPassphrase: StellarSdk.Networks.TESTNET
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: paymentRequest.stellarTestnetAddress,
        asset: buildAsset(paymentRequest, config),
        amount: Number(paymentRequest.amount).toFixed(7)
      })
    )
    .addMemo(StellarSdk.Memo.text(paymentRequest.memo || "signal-access"))
    .setTimeout(60)
    .build();

  transaction.sign(sourceKeypair);

  try {
    const result = await server.submitTransaction(transaction);
    return {
      simulated: false,
      sourcePublicKey: sourceKeypair.publicKey(),
      destination: paymentRequest.stellarTestnetAddress,
      transactionId: result.hash,
      transactionXdr: transaction.toXDR(),
      explorerUrl: `${config.stellarExplorerBase}${result.hash}`
    };
  } catch (error) {
    const horizon = error?.response?.data;
    const codes = horizon?.extras?.result_codes;
    const op = Array.isArray(codes?.operations) ? codes.operations[0] : undefined;
    const message = horizon?.title || error.message || "Horizon error";
    const details = [];
    if (codes?.transaction) details.push(`tx=${codes.transaction}`);
    if (op) details.push(`op=${op}`);

    logger?.error(`Stellar payment failed: ${message}`);
    if (details.length) {
      logger?.error(`Result codes: ${details.join(", ")}`);
    }
    throw new Error(`Stellar payment failed: ${message}`);
  }
}

module.exports = { createPaymentProof };
