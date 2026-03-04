// Stub -- full implementation in Task 2
// Provides the PositionManager type for trade-executor.ts

export class PositionManager {
  canOpenPosition(_mint: string): { allowed: boolean; reason?: string } {
    throw new Error('Not implemented');
  }
}
