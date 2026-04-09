async function fetchSignal(endpoint) {
  ensureFetch();
  const response = await fetch(endpoint);
  const data = await response.json();

  if (!response.ok && response.status !== 402) {
    throw new Error(data.message || `Signal request failed (${response.status})`);
  }

  return { status: response.status, ...data };
}

async function fetchSignalWithPayment(endpoint, paymentResult) {
  ensureFetch();
  const response = await fetch(endpoint, {
    headers: {
      "x-payment-confirmed": "true",
      "x-payment-transaction": paymentResult.transactionXdr
    }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Signal request failed (${response.status})`);
  }

  return { status: response.status, ...data };
}

function ensureFetch() {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is unavailable. Use Node.js 18+.");
  }
}

module.exports = { fetchSignal, fetchSignalWithPayment };
