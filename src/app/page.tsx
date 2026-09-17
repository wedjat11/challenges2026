import { SITE_NAME } from "@/lib/legal";

/**
 * Minimal landing page. Deliberately not the real product UI, which is T12 —
 * but Riot's production key review requires the site to show what the product
 * does, and the create-next-app template did not.
 */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">{SITE_NAME}</h1>

      <p className="mt-6 text-lg leading-relaxed text-black/70 dark:text-white/70">
        Set a League of Legends challenge, share the link, and let it track itself.
      </p>

      <p className="mt-4 leading-relaxed text-black/70 dark:text-white/70">
        Pick a goal — win ten ranked games as Jungle this week, play twenty games as one champion
        — and invite whoever you want. Progress is worked out from match history as games finish,
        so nobody has to report their own results.
      </p>

      <div className="mt-12 rounded-lg border border-black/10 p-6 dark:border-white/15">
        <h2 className="text-sm font-medium tracking-tight">Not open yet</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
          This service is still being built and is waiting on approved access to Riot&rsquo;s
          match data. Nothing can be created or joined yet.
        </p>
      </div>
    </main>
  );
}
