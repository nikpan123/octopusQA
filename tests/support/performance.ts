import type { TestInfo } from "@playwright/test";

export type PerformanceEvent = {
  name: string;
  durationMs: number;
};

export type PerformanceSnapshot = {
  events: PerformanceEvent[];
  counters: Record<string, number>;
};

export class PerformanceMetrics {
  private readonly events: PerformanceEvent[] = [];
  private readonly counters = new Map<string, number>();

  async measure<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startedAt = performance.now();

    try {
      return await operation();
    } finally {
      this.events.push({
        name,
        durationMs: performance.now() - startedAt,
      });
    }
  }

  increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  snapshot(): PerformanceSnapshot {
    return {
      events: [...this.events],
      counters: Object.fromEntries(this.counters),
    };
  }

  async attach(testInfo: TestInfo): Promise<void> {
    await testInfo.attach("octopus-performance", {
      body: JSON.stringify(this.snapshot()),
      contentType: "application/json",
    });
  }
}
