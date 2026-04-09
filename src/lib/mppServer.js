let mppxInstance = null;

async function getMppx(config) {
  if (mppxInstance) return mppxInstance;
  let Mppx;
  let stellar;
  let USDC_SAC_TESTNET;
  try {
    [{ Mppx }, { stellar }, { USDC_SAC_TESTNET }] = await Promise.all([
      import("mppx/server"),
      import("@stellar/mpp/charge/server"),
      import("@stellar/mpp")
    ]);
  } catch (error) {
    throw new Error(
      "MPP server packages not installed. Set ENABLE_MPP=false or install mppx/@stellar/mpp."
    );
  }

  if (!config.mppSecretKey) {
    throw new Error("MPP_SECRET_KEY is required when ENABLE_MPP=true.");
  }

  mppxInstance = Mppx.create({
    secretKey: config.mppSecretKey,
    methods: [
      stellar.charge({
        recipient: config.signalDestination,
        currency: USDC_SAC_TESTNET,
        network: "stellar:testnet"
      })
    ]
  });

  return mppxInstance;
}

async function handleMppCharge(req, config) {
  if (!config.enableMpp) {
    return null;
  }

  const mppx = await getMppx(config);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
    } else {
      headers.set(key, value);
    }
  }

  const webReq = new Request(`http://localhost:${config.port}${req.url}`, {
    method: req.method,
    headers
  });

  const chargeResult = await mppx.charge({
    amount: config.signalPriceUsd.toFixed(2),
    description: "SignalForge premium signal"
  })(webReq);

  return chargeResult;
}

module.exports = { handleMppCharge };
