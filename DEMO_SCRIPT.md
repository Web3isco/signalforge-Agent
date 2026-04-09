# Demo Script

## 2-Minute Hackathon Demo

Hello everyone, this is SignalForge.

SignalForge is an autonomous trading agent that can pay for premium market intelligence over Stellar, unlock the signal, and decide whether to trade based on policy rules.

Here is the flow.

First, our backend exposes a protected `/signal` endpoint. Instead of returning the signal immediately, it returns `402 Payment Required`. That means the signal is treated like a premium digital product.

Second, the agent reads the payment instructions and simulates a Stellar Testnet payment. This is where Stellar fits naturally into the system: fast, programmable payments inside an autonomous workflow.

Third, after payment, the agent retries the request, receives the signal, and checks two controls before acting:

- it has a maximum signal budget of `$10`
- it does not execute trades if confidence is below `0.6`

Now we move to the dashboard.

When I click `Run Live Demo`, the UI triggers the backend agent flow. You can see the event feed showing when the agent decides to pay, when payment is simulated, and when the trade executes.

You can also see the confidence gauge, the final decision, the trade ledger, and the running P&L after execution.

For the hackathon, trade execution is mocked so the demo stays safe and easy to understand. But the architecture is ready for the next step, which is real Stellar Testnet transaction submission and path payment-based execution.

In one sentence: SignalForge shows how autonomous agents can use Stellar to buy premium intelligence and act on it programmatically.

Thank you.

## Fast Live Demo Checklist

1. Start the server with `npm start`.
2. Open `http://localhost:3000`.
3. Explain that `/signal` is a paid endpoint returning `402`.
4. Click `Run Live Demo`.
5. Point at the event feed when payment happens.
6. Point at the confidence gauge and decision panel.
7. Point at the trade ledger and P&L.
8. Close with the real Stellar Testnet upgrade path.

## 30-Second Version

SignalForge is an autonomous trading agent that pays for premium signals over Stellar. The backend protects the signal behind `402 Payment Required`, the agent simulates payment on Stellar Testnet, retries to unlock the signal, and only trades if confidence and budget rules allow it. The dashboard shows the whole flow live, including payment events, trade execution, and P&L.

## UI Narration

Here's SignalForge, our autonomous trading agent on Stellar.

The core idea is simple: premium market signals should not just be readable by humans, they should be purchasable and usable by agents.

When I click `Start Agent`, the system begins thinking through the opportunity in real time. You can see the agent analyze the market, see that the signal costs two cents, and decide whether it is worth paying for based on confidence and budget rules.

Next comes the key x402 moment: the agent pays via Stellar, gets a transaction confirmation, and unlocks the premium signal. Once the signal is received, the agent executes the trade logic automatically.

Finally, the dashboard shows the outcome: trade execution, transaction receipts, budget usage, and running P&L.

So what we are demonstrating is not just a trading bot, but an economic agent that can buy intelligence, act on it, and manage its own decision loop.

## One-Liner

SignalForge is an autonomous trading agent that uses Stellar to pay for premium market intelligence, unlocks a monetized signal, and acts on it automatically.
