/**
 * Fallback type for OpenNext's generated Worker entry, imported from
 * worker.ts as `@open-next/worker` (see the path alias in tsconfig.json)
 * rather than the literal relative path `./.open-next/worker.js`.
 *
 * `.open-next/worker.js` does not exist yet the moment
 * `opennextjs-cloudflare build` invokes its own internal `next build`: that
 * CLI wipes `.open-next` first (see @opennextjs/cloudflare's
 * `initOutputDir`) and only regenerates `worker.js` in a later build step.
 * Worse, `cloudflare-env.d.ts`'s `WORKER_SELF_REFERENCE` service binding
 * type-imports `./worker` (this app's own Worker points a service binding at
 * itself, for OpenNext's revalidation — see wrangler.jsonc), which forces
 * TypeScript to resolve worker.ts's imports too, even if worker.ts were
 * excluded from a build-only tsconfig.
 *
 * TypeScript only falls back to this declaration when the real file cannot
 * be found through the `@open-next/worker` path mapping; once any build has
 * produced `.open-next/worker.js`, TypeScript resolves that file directly
 * (via `allowJs`) and this declaration is ignored. `ExportedHandlerFetchHandler`
 * and `CloudflareEnv` are ambient globals from `cloudflare-env.d.ts`, visible
 * here without an import.
 */
declare module "@open-next/worker" {
  const handler: { fetch: ExportedHandlerFetchHandler<CloudflareEnv> };
  export default handler;
  export class DOQueueHandler {}
  export class DOShardedTagCache {}
  export class BucketCachePurge {}
}
