const startBtn = document.getElementById("startBtn");
const startBtnHero = document.getElementById("startBtnHero");
const stopBtn = document.getElementById("stopBtn");
const logStream = document.getElementById("logStream");
const logStreamClone = document.getElementById("logStreamClone");
const statusPill = document.getElementById("statusPill");
const decisionText = document.getElementById("decisionText");
const confidenceText = document.getElementById("confidenceText");
const worthText = document.getElementById("worthText");
const budgetText = document.getElementById("budgetText");
const paymentStatus = document.getElementById("paymentStatus");
const paymentTx = document.getElementById("paymentTx");
const copyHashBtn = document.getElementById("copyHashBtn");
const payerAddress = document.getElementById("payerAddress");
const receiverAddress = document.getElementById("receiverAddress");
const paymentLink = document.getElementById("paymentLink");
const tradeStatus = document.getElementById("tradeStatus");
const pnlText = document.getElementById("pnlText");
const tradeSize = document.getElementById("tradeSize");
const detailsSection = document.getElementById("detailsSection");

let running = false;
let activeController = null;

function setStatus(text, state = "idle") {
  statusPill.textContent = text;
  statusPill.className = `status-pill ${state}`;
}

function appendLog(entry) {
  const line = document.createElement("div");
  line.className = "log-line";
  line.textContent = `[${entry.time}] ${entry.message}`;
  logStream.appendChild(line);
  logStream.scrollTop = logStream.scrollHeight;

  if (logStreamClone) {
    const cloneLine = line.cloneNode(true);
    logStreamClone.appendChild(cloneLine);
    logStreamClone.scrollTop = logStreamClone.scrollHeight;
  }
}

function resetUI() {
  logStream.innerHTML = "";
  if (logStreamClone) logStreamClone.innerHTML = "";
  decisionText.textContent = "Waiting";
  confidenceText.textContent = "--";
  worthText.textContent = "--";
  budgetText.textContent = "$10.00";
  paymentStatus.textContent = "Awaiting payment";
  paymentTx.textContent = "Tx: --";
  copyHashBtn.disabled = true;
  copyHashBtn.textContent = "Copy tx hash";
  payerAddress.textContent = "--";
  receiverAddress.textContent = "--";
  paymentLink.textContent = "";
  paymentLink.removeAttribute("href");
  tradeStatus.textContent = "Awaiting signal";
  pnlText.textContent = "P&L: $0.00";
  tradeSize.textContent = "-- XLM";
  detailsSection.classList.add("hidden");
}

async function runDemo() {
  if (running) return;
  running = true;
  activeController = new AbortController();
  resetUI();
  setStatus("Running", "running");
  startBtn.disabled = true;
  startBtnHero.disabled = true;
  stopBtn.disabled = false;

  try {
    detailsSection.classList.remove("hidden");
    const backendBase = resolveBackendBase();
    const response = await fetch(`${backendBase}/demo/run-agent`, {
      method: "POST",
      signal: activeController.signal
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(payload.message || "Failed to run demo.");
    }

    payload.logs.forEach((entry) => appendLog(entry));

    const result = payload.result;
    if (result.signal) {
      decisionText.textContent = `${result.signal.action} ${result.signal.pair}`;
      confidenceText.textContent = `${(result.signal.confidence * 100).toFixed(
        0
      )}%`;
      worthText.textContent =
        result.signal.confidence >= 0.6 ? "YES" : "NO";
    }

    if (result.payment) {
      paymentStatus.textContent = result.payment.simulated
        ? "Payment simulated"
        : "Payment successful";
      paymentTx.textContent = `Tx: ${result.payment.transactionId || "--"}`;
      payerAddress.textContent = result.payment.sourcePublicKey || "--";
      receiverAddress.textContent = result.payment.destination || "--";
      copyHashBtn.disabled = !result.payment.transactionId;
      if (result.payment.explorerUrl) {
        paymentLink.textContent = "View on Stellar Testnet";
        paymentLink.href = result.payment.explorerUrl;
      }
    }

    if (result.trade && result.trade.executed) {
      tradeStatus.textContent = `${result.trade.action} XLM @ ${result.trade.price}`;
      pnlText.textContent = `P&L: $${Number(result.pnl).toFixed(2)}`;
      tradeSize.textContent = `${result.trade.quantityXlm} XLM`;
    } else {
      tradeStatus.textContent = "Trade skipped";
      tradeSize.textContent = "-- XLM";
    }

    setStatus("Complete", "complete");
  } catch (error) {
    if (error.name === "AbortError") {
      appendLog({ time: "--:--:--", message: "Agent run stopped." });
      setStatus("Stopped", "error");
    } else {
      appendLog({ time: "--:--:--", message: error.message });
      setStatus("Error", "error");
    }
  } finally {
    running = false;
    activeController = null;
    startBtn.disabled = false;
    startBtnHero.disabled = false;
    stopBtn.disabled = true;
  }
}

function resolveBackendBase() {
  if (window.SIGNALFORGE_BACKEND) {
    return window.SIGNALFORGE_BACKEND.replace(/\/$/, "");
  }

  if (window.location.origin.includes("localhost:3002")) {
    return window.location.origin;
  }

  return "http://localhost:3002";
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  throw new Error(
    text
      ? `Backend did not return JSON: ${text.slice(0, 120)}`
      : "Backend did not return JSON."
  );
}

startBtn.addEventListener("click", runDemo);
startBtnHero.addEventListener("click", runDemo);
copyHashBtn.addEventListener("click", async () => {
  if (copyHashBtn.disabled) return;
  const hash = paymentTx.textContent.replace("Tx: ", "");
  try {
    await navigator.clipboard.writeText(hash);
    copyHashBtn.textContent = "Copied!";
    setTimeout(() => {
      copyHashBtn.textContent = "Copy tx hash";
    }, 1500);
  } catch (error) {
    copyHashBtn.textContent = "Copy failed";
  }
});
stopBtn.addEventListener("click", () => {
  if (activeController) {
    activeController.abort();
  }
  setStatus("Stopping", "error");
});
