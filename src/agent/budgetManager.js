function createBudgetManager(maxBudget) {
  let spent = 0;

  function assertCanSpend(amount) {
    if (Number.isNaN(amount) || amount <= 0) {
      throw new Error("Payment amount must be a valid positive number.");
    }

    if (spent + amount > maxBudget) {
      throw new Error(
        `Budget exceeded. Attempted to spend $${amount.toFixed(
          2
        )} with only $${(maxBudget - spent).toFixed(2)} remaining.`
      );
    }
  }

  function recordSpend(amount) {
    assertCanSpend(amount);
    spent += amount;
  }

  function getSpent() {
    return spent;
  }

  function getRemainingBudget() {
    return maxBudget - spent;
  }

  return {
    assertCanSpend,
    recordSpend,
    getSpent,
    getRemainingBudget
  };
}

module.exports = {
  createBudgetManager
};
