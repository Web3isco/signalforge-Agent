const StellarSdk = require("@stellar/stellar-sdk");
const crypto = require("crypto");
const {
  STELLAR_TESTNET_EXPLORER_TX_BASE_URL,
  STELLAR_TESTNET_HORIZON_URL,
  STELLAR_NETWORK,
  shouldUseRealPayments
} = require("../config/stellarConfig");

const STELLAR_TESTNET_PASSPHRASE = StellarSdk.Networks.TESTNET;
const horizonServer = new StellarSdk.Horizon.Server(STELLAR_TESTNET_HORIZON_URL);

async function createPaymentProof(paymentRequest) {
  if (shouldUseRealPayments()) {
    return submitStellarPayment(paymentRequest);
  }

  return simulateStellarPayment(paymentRequest);
}

async function simulateStellarPayment(paymentRequest) {
  validatePaymentRequest(paymentRequest);

  const sourceKeypair = process.env.STELLAR_SECRET
    ? StellarSdk.Keypair.fromSecret(process.env.STELLAR_SECRET)
    : StellarSdk.Keypair.random();
  const sourcePublicKey = sourceKeypair.publicKey();
  const account = new StellarSdk.Account(sourcePublicKey, "1");

  // We build and sign a Testnet payment transaction to simulate the paid
  // x402 flow. For the hackathon, we do not submit it to Horizon; the signed
  // XDR acts as mock proof that a payment step happened.
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: paymentRequest.stellarTestnetAddress,
        asset: buildAsset(paymentRequest),
        amount: Number(paymentRequest.amount).toFixed(2)
      })
    )
    .addMemo(StellarSdk.Memo.text(paymentRequest.memo || "signal-access"))
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);

  const transactionXdr = transaction.toXDR();
  const transactionId = crypto
    .createHash("sha256")
    .update(transactionXdr)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();

  return {
    sourcePublicKey,
    transactionXdr,
    transactionId,
    simulated: true,
    network: STELLAR_NETWORK,
    explorerUrl: null
  };
}

async function submitStellarPayment(paymentRequest) {
  validatePaymentRequest(paymentRequest);

  if (!process.env.STELLAR_SECRET) {
    throw new Error(
      "STELLAR_SECRET is required when STELLAR_REAL_PAYMENTS=true."
    );
  }

  const sourceKeypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SECRET);
  const sourcePublicKey = sourceKeypair.publicKey();
  const sourceAccount = await horizonServer.loadAccount(sourcePublicKey);
  const baseFee = await horizonServer.fetchBaseFee();

  const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: String(baseFee || StellarSdk.BASE_FEE),
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: paymentRequest.stellarTestnetAddress,
        asset: buildAsset(paymentRequest),
        amount: Number(paymentRequest.amount).toFixed(2)
      })
    )
    .addMemo(StellarSdk.Memo.text(paymentRequest.memo || "signal-access"))
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);

  let submitResult;
  try {
    submitResult = await horizonServer.submitTransaction(transaction);
  } catch (error) {
    const horizonData = error?.response?.data;
    const resultCodes = horizonData?.extras?.result_codes;
    const opCodes = horizonData?.extras?.result_codes?.operations;
    const txCode = resultCodes?.transaction;
    const opCode = Array.isArray(opCodes) ? opCodes[0] : undefined;
    const message = horizonData?.title || error.message || "Horizon error";

    throw new Error(
      `Stellar payment failed: ${message}` +
        (txCode ? ` | tx=${txCode}` : "") +
        (opCode ? ` | op=${opCode}` : "")
    );
  }

  return {
    sourcePublicKey,
    transactionXdr: transaction.toXDR(),
    transactionId: submitResult.hash,
    simulated: false,
    network: STELLAR_NETWORK,
    explorerUrl: `${STELLAR_TESTNET_EXPLORER_TX_BASE_URL}${submitResult.hash}`
  };
}

function buildAsset(paymentRequest) {
  const assetCode = paymentRequest.asset;
  if (assetCode === "XLM") {
    return StellarSdk.Asset.native();
  }

  if (paymentRequest.assetIssuer) {
    return new StellarSdk.Asset(assetCode, paymentRequest.assetIssuer);
  }

  throw new Error(`Unsupported asset for mock payment flow: ${assetCode}`);
}

function validatePaymentRequest(paymentRequest) {
  if (!paymentRequest.amount || !paymentRequest.asset) {
    throw new Error("Payment request is missing amount or asset details.");
  }

  if (!paymentRequest.stellarTestnetAddress) {
    throw new Error("Payment request is missing the Stellar testnet address.");
  }
}

module.exports = {
  createPaymentProof,
  simulateStellarPayment,
  submitStellarPayment
};
