import { eq, sql } from "drizzle-orm";

import type { AuthDb } from "@/adapters/db/verification-token-repository";
import * as schema from "@/db/schema";
import type {
  EmailThrottleRepository,
  SendThrottleState,
} from "@/domain/ports/email-throttle-repository";

export function createEmailThrottleRepository(db: AuthDb): EmailThrottleRepository {
  return {
    async find(identifier: string): Promise<SendThrottleState | null> {
      const [row] = await db
        .select()
        .from(schema.authEmailThrottle)
        .where(eq(schema.authEmailThrottle.identifier, identifier))
        .limit(1);

      if (!row) return null;

      return {
        lastSentAt: row.lastSentAt,
        windowStartedAt: row.windowStartedAt,
        sentInWindow: row.sentInWindow,
      };
    },

    async save(identifier: string, state: SendThrottleState): Promise<void> {
      // Insert-or-replace of the single row for `identifier` (primary key),
      // matching the upsert shape `pollState.saveState` already uses in
      // polling-repository.ts.
      await db
        .insert(schema.authEmailThrottle)
        .values({
          identifier,
          lastSentAt: state.lastSentAt,
          windowStartedAt: state.windowStartedAt,
          sentInWindow: state.sentInWindow,
        })
        .onConflictDoUpdate({
          target: schema.authEmailThrottle.identifier,
          set: {
            lastSentAt: sql`excluded.last_sent_at`,
            windowStartedAt: sql`excluded.window_started_at`,
            sentInWindow: sql`excluded.sent_in_window`,
          },
        });
    },
  };
}
