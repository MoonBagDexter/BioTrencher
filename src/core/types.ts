// Core type definitions for the BioTrencher trading pipeline.
// These types define the data contracts used across all modules.

export interface RawWebhookPayload {
  signature: string;
  transaction: {
    message: {
      accountKeys: string[];
      instructions: {
        programIdIndex: number;
        accounts: number[];
        data: string;
      }[];
    };
  };
}

export interface Signal {
  type: 'BUY' | 'SELL';
  source: 'pumpfun' | 'pumpswap';
  mint: string;
  user: string;
  signature: string;
  timestamp: number;
}

export interface ValidatedSignal extends Signal {
  rugCheckPassed: true;
}

export type ExitReason = 'copy-sell' | 'take-profit' | 'stop-loss' | 'time-limit';

export interface ExitParams {
  takeProfitPct: number;
  stopLossPct: number;
  timeLimitMs: number;
}

export interface TradeResult {
  signature: string;
  mint: string;
  copiedFrom: string; // wallet address that triggered the copy-trade
  solAmount: number;
  tokensReceived: number;
  entryPrice?: number;
  exitPrice?: number;
  mode: 'SAFE' | 'LIVE';
  reason?: ExitReason;
  timestamp: number;
}

export interface Position {
  id: string;
  mint: string;
  entryPrice: number;
  tokensHeld: number;
  solInvested: number;
  currentPrice: number;
  pnlPct: number;
  exitParams: ExitParams;
  openedAt: number;
  status: 'open' | 'closed';
  copiedFrom: string; // wallet address that triggered the buy
}

export interface Config {
  heliusApiKey: string;
  rpcUrl: string;
  jupiterApiKey: string;
  webhookBaseUrl: string;
  port: number;
  mode: 'SAFE' | 'LIVE';
  wallets: string[];
  maxPositions: number;
  buyAmountSol: number;
}
