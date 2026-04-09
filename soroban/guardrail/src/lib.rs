#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Map, Symbol};

const LIMIT_KEY: Symbol = symbol_short!("limit");
const SPEND_KEY: Symbol = symbol_short!("spend");

#[contract]
pub struct Guardrail;

#[contractimpl]
impl Guardrail {
    pub fn initialize(env: Env, daily_limit: i128) {
        env.storage().instance().set(&LIMIT_KEY, &daily_limit);
        env.storage()
            .instance()
            .set::<Symbol, Map<(Address, Symbol), i128>>(&SPEND_KEY, &Map::new(&env));
    }

    pub fn check_spend(env: Env, account: Address, day: Symbol, amount: i128) -> bool {
        let limit: i128 = env.storage().instance().get(&LIMIT_KEY).unwrap_or(0);
        let mut spend: Map<(Address, Symbol), i128> =
            env.storage().instance().get(&SPEND_KEY).unwrap_or(Map::new(&env));
        let key = (account.clone(), day);
        let used = spend.get(key.clone()).unwrap_or(0);
        used + amount <= limit
    }

    pub fn record_spend(env: Env, account: Address, day: Symbol, amount: i128) {
        let mut spend: Map<(Address, Symbol), i128> =
            env.storage().instance().get(&SPEND_KEY).unwrap_or(Map::new(&env));
        let key = (account.clone(), day);
        let used = spend.get(key.clone()).unwrap_or(0);
        spend.set(key, &(used + amount));
        env.storage().instance().set(&SPEND_KEY, &spend);
    }
}
