import { HeroCtas } from "@/app/hero-ctas";
import { AuthStatus } from "@/components/auth-status";
import { SITE_NAME } from "@/lib/legal";

/**
 * Landing page. T12 has now shipped create/browse/join, so the headline
 * reuses `login-panel.tsx`'s display type scale (`font-display`/
 * `tracking-display`) and the "Not open yet" panel is replaced by real CTAs
 * (`HeroCtas`) — design-system: Design Tokens as CSS Custom Properties,
 * Mobile-First Responsive Contract.
 */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <div className="flex items-center justify-between gap-6">
        <h1 className="font-display text-display-3 font-bold tracking-display text-text-primary">
          {SITE_NAME}
        </h1>
        <AuthStatus />
      </div>

      <p className="mt-6 text-body-lg leading-relaxed text-text-secondary">
        Set a League of Legends challenge, share the link, and let it track itself.
      </p>

      <p className="mt-4 text-body leading-relaxed text-text-secondary">
        Pick a goal — win ten ranked games as Jungle this week, play twenty games as one champion
        — and invite whoever you want. Progress is worked out from match history as games finish,
        so nobody has to report their own results.
      </p>

      <HeroCtas />
    </main>
  );
}
