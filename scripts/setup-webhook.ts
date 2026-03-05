/**
 * Helius Webhook Setup Script
 *
 * Registers or updates a raw webhook for tracked wallets.
 * Run via: npm run setup:webhook
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createHelius } from 'helius-sdk';

loadEnv();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const apiKey = requireEnv('HELIUS_API_KEY');
  const webhookBaseUrl = requireEnv('WEBHOOK_BASE_URL');

  const walletsPath = process.env.WALLETS_FILE || resolve('data/wallets.json');
  const wallets: string[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));

  if (!Array.isArray(wallets) || wallets.length === 0) {
    throw new Error('No wallets found in wallets file');
  }

  const webhookURL = `${webhookBaseUrl}/webhook`;
  console.log(`Webhook URL: ${webhookURL}`);
  console.log(`Tracking ${wallets.length} wallet(s)`);

  const helius = createHelius({ apiKey });

  // Check for existing webhooks to avoid duplicates
  const existing = await helius.webhooks.getAll();
  const match = existing.find((w) => w.webhookURL === webhookURL);

  if (match) {
    console.log(`Updating existing webhook: ${match.webhookID}`);
    const updated = await helius.webhooks.update(match.webhookID, {
      accountAddresses: wallets,
      transactionTypes: ['ANY'],
      webhookType: 'raw',
    });
    console.log(`Webhook updated: ${updated.webhookID}`);
  } else {
    console.log('Creating new webhook...');
    const created = await helius.webhooks.create({
      webhookURL,
      accountAddresses: wallets,
      transactionTypes: ['ANY'],
      webhookType: 'raw',
    });
    console.log(`Webhook created: ${created.webhookID}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Webhook setup failed:', err);
  process.exit(1);
});
