# SignalForge (Clean Rebuild)

Autonomous trading agent demo with x402-style payment gating and real USDC
payments on Stellar Testnet.

## 1) Install & Run (Local)

Open two PowerShell windows.

### Terminal 1 (Backend)
```powershell
$env:Path = "C:\Users\USER\Downloads\node-v24.14.1-win-x64\node-v24.14.1-win-x64;" + $env:Path
cd "C:\Users\USER\Desktop\Stellar Repo For Hackathon"

$env:PORT="3000"
$env:STELLAR_PAYMENT_ASSET="USDC"
$env:STELLAR_ASSET_ISSUER="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
$env:STELLAR_DESTINATION_ADDRESS="GCJU6VCSUEP4N7XV55ZY27YATXTGD45YCP646XTBT3RZHGOWWGYJT7HZ"

npm.cmd start
```

### Terminal 2 (Agent)
```powershell
$env:Path = "C:\Users\USER\Downloads\node-v24.14.1-win-x64\node-v24.14.1-win-x64;" + $env:Path
cd "C:\Users\USER\Desktop\Stellar Repo For Hackathon"

$env:STELLAR_REAL_PAYMENTS="true"
$env:STELLAR_SECRET="YOUR_AGENT_SECRET_KEY"
$env:SIGNAL_ENDPOINT="http://localhost:3000/signal"

npm.cmd run agent
```

### UI
Open [http://localhost:3000](http://localhost:3000) in your browser.

Click **Start Agent** to run the live demo.

If the payment is real, the UI will show a Stellar Testnet transaction link.

## Notes
- The signal endpoint returns HTTP 402 with payment details.
- The agent pays in USDC on Stellar Testnet, then retries to get the signal.
- Trades are mocked but P&L is tracked in memory.

## Advanced Stellar Features – MPP Charge Intent + Soroban Guardrail

SignalForge can optionally enable MPP Charge Intents for x402-style payments and a
Soroban budget guardrail.

### Enable MPP Charge Intent (Optional)
MPP is optional and only enabled when the extra packages are installed.

Install MPP packages:
```powershell
npm.cmd install mppx @stellar/mpp --legacy-peer-deps
```

Set environment variables for the backend:
```powershell
$env:ENABLE_MPP="true"
$env:MPP_SECRET_KEY="YOUR_SIGNAL_PROVIDER_SECRET"
```

The `/signal` route returns a proper MPP charge intent (HTTP 402) and attaches
the receipt on success. The agent automatically handles MPP payments when
`ENABLE_MPP=true`. citeturn2view0

### Enable Soroban Budget Guardrail
Set:
```powershell
$env:ENABLE_SOROBAN_GUARDRAIL="true"
$env:SOROBAN_CONTRACT_ID="YOUR_SOROBAN_CONTRACT_ID"
```

The agent will call `check_spend` on the contract before paying. If it returns
false, the agent logs “Soroban guardrail denied spend”.

## Environment Variables
## Environment Variables
| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port (default 3000) |
| `SIGNAL_ENDPOINT` | Agent signal URL |
| `SIGNAL_PRICE_USDC` | Price per signal |
| `MIN_CONFIDENCE` | Minimum confidence threshold |
| `MAX_BUDGET_USD` | Agent budget |
| `STELLAR_REAL_PAYMENTS` | `true` to submit real testnet payments |
| `STELLAR_SECRET` | Agent secret key |
| `STELLAR_DESTINATION_ADDRESS` | Signal provider account |
| `STELLAR_ASSET_ISSUER` | USDC testnet issuer |
| `ENABLE_MPP` | Enable MPP charge intent |
| `MPP_SECRET_KEY` | Signal provider secret key for MPP charge |
| `ENABLE_SOROBAN_GUARDRAIL` | Enable Soroban budget guardrail |
| `SOROBAN_CONTRACT_ID` | Soroban contract ID |
| `SOROBAN_RPC_URL` | Soroban RPC URL |
