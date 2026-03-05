/**
 * Test Signal Script
 *
 * Sends a fake webhook POST to localhost:3000/webhook that looks like
 * a PumpFun buy transaction. Useful for manual end-to-end pipeline testing.
 *
 * Run via: npm run test:signal
 */
import bs58 from 'bs58';
import crypto from 'node:crypto';

const PUMP_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const PUMP_BUY_DISCRIMINATOR = Buffer.from('66063d1201daebea', 'hex');

// Generate a random base58 string that looks like a Solana pubkey
function randomPubkey(): string {
  return bs58.encode(crypto.randomBytes(32));
}

async function main(): Promise<void> {
  const port = process.env.PORT || '3000';
  const url = `http://localhost:${port}/webhook`;

  const fakeMint = randomPubkey();
  const fakeUser = randomPubkey();
  const fakeSig = bs58.encode(crypto.randomBytes(64));

  // Build instruction data: discriminator + some padding
  const ixData = Buffer.alloc(24);
  PUMP_BUY_DISCRIMINATOR.copy(ixData, 0);
  const ixDataB58 = bs58.encode(ixData);

  // Account keys: indices matter for signal detection
  // PumpFun expects: accounts[2] = mint, accounts[6] = user
  const accountKeys = [
    randomPubkey(), // 0 - some account
    randomPubkey(), // 1 - some account
    fakeMint,       // 2 - mint (PUMP_MINT_INDEX)
    randomPubkey(), // 3 - some account
    randomPubkey(), // 4 - some account
    randomPubkey(), // 5 - some account
    fakeUser,       // 6 - user (PUMP_USER_INDEX)
    PUMP_PROGRAM,   // 7 - program ID
  ];

  const payload = {
    signature: fakeSig,
    transaction: {
      message: {
        accountKeys,
        instructions: [
          {
            programIdIndex: 7, // points to PUMP_PROGRAM
            accounts: [0, 1, 2, 3, 4, 5, 6], // accounts[2]=mint, accounts[6]=user
            data: ixDataB58,
          },
        ],
      },
    },
  };

  console.log(`Sending fake PumpFun BUY signal to ${url}`);
  console.log(`  Mint: ${fakeMint.slice(0, 12)}...`);
  console.log(`  User: ${fakeUser.slice(0, 12)}...`);
  console.log(`  Sig:  ${fakeSig.slice(0, 12)}...`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([payload]),
  });

  console.log(`Response: ${res.status} ${res.statusText}`);
  const body = await res.json();
  console.log('Body:', JSON.stringify(body));
}

main().catch((err) => {
  console.error('Test signal failed:', err);
  process.exit(1);
});
