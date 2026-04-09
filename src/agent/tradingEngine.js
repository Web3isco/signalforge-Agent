const DEFAULT_MARKET_PRICE = 0.12;
const TRADE_QUANTITY_XLM = 25;

function createTradingEngine() {
  const tradeHistory = [];
  let positionXlm = 0;
  let cashPnlUsd = 0;
  let lastMarketPrice = DEFAULT_MARKET_PRICE;

  function executeTrade(decision) {
    if (!decision.shouldExecuteTrade) {
      return {
        executed: false,
        tradeHistory: getTradeHistory(),
        pnl: getProfitAndLoss(),
        reason: decision.reason
      };
    }

    const marketPrice = deriveMarketPrice(decision);
    lastMarketPrice = marketPrice;

    let trade;
    if (decision.suggestedAction === "BUY") {
      trade = executeBuy(decision, marketPrice);
    } else if (decision.suggestedAction === "SELL") {
      trade = executeSell(decision, marketPrice);
    } else {
      throw new Error(`Unsupported trade action: ${decision.suggestedAction}`);
    }

    tradeHistory.push(trade);

    return {
      executed: true,
      trade,
      tradeHistory: getTradeHistory(),
      pnl: getProfitAndLoss()
    };
  }

  function executeBuy(decision, marketPrice) {
    const quantity = TRADE_QUANTITY_XLM;
    const notional = quantity * marketPrice;

    positionXlm += quantity;
    cashPnlUsd -= notional;

    return buildTradeRecord(decision, marketPrice, quantity, notional);
  }

  function executeSell(decision, marketPrice) {
    const quantity = Math.min(positionXlm, TRADE_QUANTITY_XLM);

    if (quantity === 0) {
      return {
        ...buildTradeRecord(decision, marketPrice, 0, 0),
        skipped: true,
        skipReason: "No XLM inventory available to sell."
      };
    }

    const notional = quantity * marketPrice;

    positionXlm -= quantity;
    cashPnlUsd += notional;

    return buildTradeRecord(decision, marketPrice, quantity, notional);
  }

  function buildTradeRecord(decision, marketPrice, quantity, notional) {
    return {
      timestamp: new Date().toISOString(),
      pair: decision.pair,
      action: decision.suggestedAction,
      confidence: decision.confidence,
      quantityXlm: quantity,
      priceUsd: Number(marketPrice.toFixed(4)),
      notionalUsd: Number(notional.toFixed(4)),
      status: quantity > 0 ? "EXECUTED" : "SKIPPED"
    };
  }

  function deriveMarketPrice(decision) {
    const confidenceFactor = (decision.confidence - 0.5) * 0.02;
    const actionBias = decision.suggestedAction === "BUY" ? 0.003 : -0.002;

    return Number((DEFAULT_MARKET_PRICE + confidenceFactor + actionBias).toFixed(4));
  }

  function getProfitAndLoss() {
    const unrealizedValue = positionXlm * lastMarketPrice;
    const totalPnl = cashPnlUsd + unrealizedValue;

    return {
      realizedCashUsd: Number(cashPnlUsd.toFixed(4)),
      unrealizedValueUsd: Number(unrealizedValue.toFixed(4)),
      totalPnlUsd: Number(totalPnl.toFixed(4)),
      openPositionXlm: positionXlm,
      markPriceUsd: Number(lastMarketPrice.toFixed(4))
    };
  }

  function getTradeHistory() {
    return tradeHistory.map((trade) => ({ ...trade }));
  }

  return {
    executeTrade,
    getTradeHistory,
    getProfitAndLoss
  };
}

module.exports = {
  createTradingEngine
};
