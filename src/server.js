const path = require("path");
const express = require("express");
const { loadConfig } = require("./lib/config");
const { runAgent } = require("./agent/runAgent");
const { createLogger } = require("./lib/logger");
const { handleMppCharge } = require("./lib/mppServer");

const app = express();
app.use(express.json());

const config = loadConfig();
const logger = createLogger("Server");

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({
    message: "SignalForge server is running.",
    endpoints: {
      health: "/health",
      signal: "/signal",
      demo: "/demo/run-agent"
    },
    features: {
      mpp: config.enableMpp,
      sorobanGuardrail: config.enableSorobanGuardrail
    }
  });
});

app.get("/signal", async (req, res) => {
  const paymentConfirmed =
    req.header("x-payment-confirmed") === "true" || req.query.paid === "true";

  if (config.enableMpp) {
    try {
      const mppResult = await handleMppCharge(req, config);
      if (mppResult?.status === 402) {
        const challenge = mppResult.challenge;
        challenge.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        return res.status(402).send(await challenge.text());
      }

      const response = new Response(
        JSON.stringify({
          signal: {
            pair: "XLM/USDC",
            action: "BUY",
            confidence: config.previewConfidence
          }
        }),
        { headers: { "content-type": "application/json" } }
      );

      const receipt = mppResult?.withReceipt
        ? mppResult.withReceipt(response)
        : response;

      receipt.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      return res.status(receipt.status).send(await receipt.text());
    } catch (error) {
      logger.warn(`MPP charge failed, falling back to x402: ${error.message}`);
    }
  }

  if (!paymentConfirmed) {
    return res.status(402).json({
      message: "Payment required before accessing this trading signal.",
      payment: {
        amount: config.signalPriceUsd.toFixed(2),
        asset: "USDC",
        assetIssuer: config.usdcIssuer,
        stellarTestnetAddress: config.signalDestination,
        memo: "signal-access",
        network: "Stellar Testnet",
        previewConfidence: config.previewConfidence,
        pair: "XLM/USDC",
        instructions:
          "Send the exact amount on Stellar Testnet, then retry with x-payment-confirmed: true."
      }
    });
  }

  return res.json({
    signal: {
      pair: "XLM/USDC",
      action: "BUY",
      confidence: config.previewConfidence
    }
  });
});

app.post("/demo/run-agent", async (req, res) => {
  try {
    const logs = [];
    const demoLogger = createLogger("Agent", (entry) => logs.push(entry));

    const result = await runAgent({
      endpoint: config.signalEndpoint,
      logger: demoLogger
    });

    res.json({
      status: "ok",
      logs,
      result
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(config.port, () => {
  logger.info(`Signal server listening on http://localhost:${config.port}`);
});
const logger = createLogger("Server");
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
