let mppReady = false;

async function initMppClient(config, logger) {
  if (!config.enableMpp || mppReady) return;

  if (!config.stellarSecret) {
    throw new Error("STELLAR_SECRET is required for MPP client payments.");
  }

  let Mppx;
  let stellar;
  try {
    [{ Mppx }, { stellar }] = await Promise.all([
      import("mppx/client"),
      import("@stellar/mpp/charge/client")
    ]);
  } catch (error) {
    logger?.warn(
      "MPP client packages not installed. Set ENABLE_MPP=false or install mppx/@stellar/mpp."
    );
    return;
  }

  const keypair = require("@stellar/stellar-sdk").Keypair.fromSecret(
    config.stellarSecret
  );

  Mppx.create({
    methods: [
      stellar.charge({
        keypair,
        network: "stellar:testnet",
        mode: "pull",
        onProgress: (event) => {
          logger?.info(
            `MPP Charge ${event.state}: ${event.amount} ${event.asset?.code || ""}`.trim()
          );
        }
      })
    ]
  });

  mppReady = true;
  logger?.info("MPP client initialized");
}

module.exports = { initMppClient };
