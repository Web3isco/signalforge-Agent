# Soroban Guardrail (Example)

This is a minimal Soroban contract used as a budget guardrail. It exposes:

- `check_spend(account, day, amount)` → `bool`
- `record_spend(account, day, amount)`

## Deploy (Testnet)

Use the Stellar CLI to build and deploy. Example:

```bash
stellar contract build
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/guardrail.wasm \
  --network testnet \
  --source YOUR_SECRET
```

Then initialize with a daily limit:

```bash
stellar contract invoke \
  --id CONTRACT_ID \
  --network testnet \
  --source YOUR_SECRET \
  -- initialize --daily_limit 5
```

Set `SOROBAN_CONTRACT_ID` in the app env to enable checks.
