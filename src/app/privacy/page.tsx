import type { Metadata } from "next";

import { LegalPage, Section } from "@/components/legal-page";
import { OPERATOR, SITE_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <Section heading="Who is responsible">
        <p>
          {OPERATOR.name} operates {SITE_NAME} and decides how the data described here is used.
          For any request about your data, write to {OPERATOR.contactEmail}.
        </p>
      </Section>

      <Section heading="What is collected">
        <ul className="list-disc pl-5">
          <li>
            <strong>Your Discord account identifier</strong>, plus the username and avatar Discord
            returns when you sign in. Discord does not share your password with this service.
          </li>
          <li>
            <strong>Riot IDs you link</strong> and the PUUID Riot returns for them. A PUUID is
            Riot&rsquo;s own identifier for a player account.
          </li>
          <li>
            <strong>Match summaries</strong> for linked accounts: match identifier, champion,
            role, queue, result, duration, and when the game was played.
          </li>
          <li>
            <strong>Challenges you create or join</strong>, and the progress calculated for them.
          </li>
        </ul>
        <p>
          No payment details are collected, because nothing is sold. No advertising or analytics
          trackers are used.
        </p>
      </Section>

      <Section heading="Why it is collected">
        <p>
          Solely to run challenges: to identify you between visits, to find your matches, and to
          work out whether a challenge has been completed. The data is not sold, rented, or used
          to build profiles for any other purpose.
        </p>
      </Section>

      <Section heading="Where match data comes from">
        <p>
          Match data is retrieved from Riot Games&rsquo; public developer API, which publishes it
          for any Riot ID. This service stores a reduced copy so the same match does not have to
          be fetched repeatedly. It does not reveal anything Riot does not already publish.
        </p>
      </Section>

      <Section heading="Who it is shared with">
        <p>Data is not sold or shared for marketing. It passes through these providers:</p>
        <ul className="list-disc pl-5">
          <li>
            <strong>Cloudflare</strong> — hosting, storage, and content delivery.
          </li>
          <li>
            <strong>Discord</strong> — sign-in. Discord receives your sign-in request; this
            service receives only your account identifier, username, and avatar.
          </li>
          <li>
            <strong>Riot Games</strong> — queried for the match data described above.
          </li>
        </ul>
      </Section>

      <Section heading="How long it is kept">
        <p>
          Account and challenge data is kept while your account exists. Cached match summaries are
          kept while a challenge that depends on them is active. On deletion, your account, linked
          Riot IDs, challenges, and progress are removed.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You may ask for a copy of your data, ask for it to be corrected, or ask for it to be
          deleted, by writing to {OPERATOR.contactEmail}. Deleting your account removes the data
          described above.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          This service follows Riot&rsquo;s and Discord&rsquo;s minimum age requirements and is
          not directed at children below them.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          Changes to this policy are reflected in the date above. Material changes will be
          announced on the service before they take effect.
        </p>
      </Section>
    </LegalPage>
  );
}
