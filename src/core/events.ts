import { TypedEmitter } from 'tiny-typed-emitter';
import type {
  RawWebhookPayload,
  Signal,
  ValidatedSignal,
  TradeResult,
  Position,
  ExitReason,
} from './types.js';

export interface PipelineEvents {
  'webhook:received': (payload: RawWebhookPayload) => void;
  'signal:detected': (signal: Signal) => void;
  'signal:validated': (signal: ValidatedSignal) => void;
  'signal:rejected': (signal: Signal, reason: string) => void;
  'signal:skipped': (signal: Signal, reason: string) => void;
  'trade:executed': (result: TradeResult) => void;
  'position:opened': (position: Position) => void;
  'position:updated': (position: Position) => void;
  'position:closed': (position: Position, reason: ExitReason) => void;
  'price:updated': (prices: Map<string, number>) => void;
}

export const bus = new TypedEmitter<PipelineEvents>();
bus.setMaxListeners(20);
