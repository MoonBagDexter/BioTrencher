import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { PublicKey } from '@solana/web3.js';
import type { Config } from '../core/types.js';

loadEnv();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadWallets(walletsPath: string): string[] {
  let raw: string;
  try {
    raw = readFileSync(walletsPath, 'utf-8');
  } catch {
    throw new Error(`Cannot read wallets file: ${walletsPath}`);
  }

  const wallets: unknown = JSON.parse(raw);
  if (!Array.isArray(wallets) || wallets.length === 0) {
    throw new Error(`Wallets file must contain a non-empty JSON array: ${walletsPath}`);
  }

  // Validate each wallet is a valid Solana public key (base58)
  // Replace the example addresses in data/wallets.json with real wallet addresses.
  for (const addr of wallets) {
    if (typeof addr !== 'string') {
      throw new Error(`Invalid wallet entry (not a string): ${JSON.stringify(addr)}`);
    }
    try {
      new PublicKey(addr);
    } catch {
      throw new Error(`Invalid Solana wallet address: ${addr}`);
    }
  }

  return wallets as string[];
}

export function loadConfig(): Config {
  const walletsFile = process.env.WALLETS_FILE || resolve('data/wallets.json');
  const wallets = loadWallets(walletsFile);

  const mode = (process.env.MODE || 'SAFE') as Config['mode'];
  if (mode !== 'SAFE' && mode !== 'LIVE') {
    throw new Error(`Invalid MODE: ${mode}. Must be SAFE or LIVE.`);
  }

  return {
    heliusApiKey: requireEnv('HELIUS_API_KEY'),
    rpcUrl: requireEnv('SOLANA_RPC_URL'),
    jupiterApiKey: requireEnv('JUPITER_API_KEY'),
    webhookBaseUrl: requireEnv('WEBHOOK_BASE_URL'),
    port: parseInt(process.env.PORT || '3000', 10),
    mode,
    wallets,
    maxPositions: parseInt(process.env.MAX_POSITIONS || '5', 10),
    buyAmountSol: parseFloat(process.env.BUY_AMOUNT_SOL || '0.1'),
  };
}
