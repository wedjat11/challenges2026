/** What is remembered about one address's send history. */
export type SendThrottleState = {
  lastSentAt: Date;
  windowStartedAt: Date;
  sentInWindow: number;
};

/** Storage only — the rule lives in domain/send-throttle.ts (D12). */
export type EmailThrottleRepository = {
  find(identifier: string): Promise<SendThrottleState | null>;
  /** Insert-or-replace of the single row for `identifier`. */
  save(identifier: string, state: SendThrottleState): Promise<void>;
};
