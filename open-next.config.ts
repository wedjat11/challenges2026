import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache override yet: the R2-backed cache needs a bucket that
// does not exist, and nothing here is statically revalidated. Revisit when the
// challenge pages start using ISR.
export default defineCloudflareConfig();
