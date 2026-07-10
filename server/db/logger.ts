import { Logger } from 'drizzle-orm/logger';

export class SlowQueryLogger implements Logger {
  private thresholdMs: number;

  constructor(thresholdMs: number = 100) { // 100ms default
    this.thresholdMs = thresholdMs;
  }

  logQuery(query: string, params: unknown[]): void {
    // Basic logging, but we need to know duration.
    // Drizzle's default logger doesn't track duration out of the box in the `logQuery` method.
    // We would need to hook into pg pool or use a wrapper.
  }
}
