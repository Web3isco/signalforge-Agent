const StellarSdk = require("@stellar/stellar-sdk");

function getDayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}

async function checkSorobanGuardrail(config, amount, logger) {
  if (!config.enableSorobanGuardrail || !config.sorobanContractId) {
    return { allowed: true, reason: "Guardrail disabled" };
  }

  try {
    const server = new StellarSdk.rpc.Server(config.sorobanRpcUrl);
    const sourceKeypair = StellarSdk.Keypair.fromSecret(config.stellarSecret);
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    const dayKey = getDayKey();

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(
        StellarSdk.Operation.invokeContractFunction({
          contract: config.sorobanContractId,
          function: "check_spend",
          args: [
            StellarSdk.nativeToScVal(sourceKeypair.publicKey(), {
              type: "string"
            }),
            StellarSdk.nativeToScVal(dayKey, { type: "string" }),
            StellarSdk.nativeToScVal(amount, { type: "i128" })
          ]
        })
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(sourceKeypair);
    const result = await server.sendTransaction(prepared);

    if (result.status === "FAILED") {
      throw new Error(result.errorResult || "Soroban guardrail failed");
    }

    const finalized = await server.getTransaction(result.hash);
    if (finalized.status !== "SUCCESS") {
      throw new Error("Soroban guardrail not successful");
    }

    const returnValue = finalized.returnValue;
    const allowed = returnValue === true || returnValue === "true";
    return { allowed, reason: allowed ? "Approved" : "Denied by contract" };
  } catch (error) {
    logger?.warn(`Soroban guardrail check failed: ${error.message}`);
    return { allowed: true, reason: "Guardrail error - allowing" };
  }
}

module.exports = { checkSorobanGuardrail };
