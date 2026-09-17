import type { Metadata } from "next";

import { LegalPage, Section } from "@/components/legal-page";
import { OPERATOR, SITE_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <Section heading="What this service is">
        <p>
          {SITE_NAME} lets you create challenges for League of Legends, share them, and have
          progress worked out automatically from publicly available match history. It is operated
          by {OPERATOR.name}.
        </p>
        <p>
          The service is free. There is no paid tier, no advertising, and no entry fee of any
          kind.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          You sign in with Discord. You are responsible for activity under your account, and you
          may stop using the service and request deletion at any time by writing to{" "}
          {OPERATOR.contactEmail}.
        </p>
        <p>
          Linking a Riot ID records a claim, not a verified fact. Riot does not currently make
          account-ownership verification available to this service, so anyone can enter any
          public Riot ID. Do not treat a linked Riot ID as proof of identity, and do not attach
          stakes to it.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <p>You agree not to use the service to:</p>
        <ul className="list-disc pl-5">
          <li>harass, impersonate, or expose information about other players</li>
          <li>run betting, gambling, or wagering of any kind on challenges</li>
          <li>attach real-money prizes to challenges</li>
          <li>automate requests in a way that burdens the service or Riot&rsquo;s API</li>
        </ul>
        <p>
          The gambling and prize restrictions are not ours alone: Riot&rsquo;s developer policy
          prohibits them, and breaking them would end this service&rsquo;s access to match data.
        </p>
      </Section>

      <Section heading="Relationship with Riot Games">
        <p>
          This service reads match data through Riot&rsquo;s public developer API. It is an
          independent project. It is not affiliated with, endorsed by, or sponsored by Riot
          Games, and it does not produce alternative rankings or skill ratings.
        </p>
      </Section>

      <Section heading="No warranty">
        <p>
          The service is provided as is. Progress is derived from data Riot publishes, which can
          be delayed, incomplete, or changed without notice, so challenge results may be wrong or
          out of date. Nothing here is guaranteed to be available, accurate, or preserved.
        </p>
      </Section>

      <Section heading="Changes and ending access">
        <p>
          These terms may change; material changes will be reflected in the date above. Access may
          be suspended for conduct that breaks these terms or that puts the service&rsquo;s Riot
          API access at risk.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>These terms are governed by the laws of {OPERATOR.jurisdiction}.</p>
      </Section>

      <Section heading="Contact">
        <p>Questions about these terms: {OPERATOR.contactEmail}.</p>
      </Section>
    </LegalPage>
  );
}
