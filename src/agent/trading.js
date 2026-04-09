function createTrader() {
  const history = [];
  let pnl = 0;

  function execute(signal) {
    const price = Number((0.12 + Math.random() * 0.08).toFixed(4));
    const quantityXlm = 25;
    const profit = Number((Math.random() * 0.5 - 0.1).toFixed(2));
    pnl = Number((pnl + profit).toFixed(2));

    const trade = {
      action: signal.action,
      pair: signal.pair,
      price,
      quantityXlm,
      profit,
      executed: true
    };

    history.push(trade);
    return trade;
  }

  return {
    execute,
    getPnl: () => pnl,
    getHistory: () => history.slice()
  };
}

module.exports = { createTrader };
