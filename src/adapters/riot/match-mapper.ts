import type { MatchSummary, Queue, Role } from "@/domain/match";

/**
 * Translates Riot's match payload into the domain's vocabulary.
 *
 * This is the only place that knows Riot's field names. Everything downstream
 * reads `MatchSummary`, so a Riot rename breaks one file instead of the rules.
 */

/**
 * `teamPosition` is the field to trust. Riot also sends `lane` and `role`, and
 * they disagree: in the recorded fixture the same participant is TOP by
 * teamPosition and JUNGLE by lane. Reading `lane` would mis-score every role
 * challenge, silently.
 */
const ROLE_BY_POSITION: Record<string, Role> = {
  TOP: "top",
  JUNGLE: "jungle",
  MIDDLE: "middle",
  BOTTOM: "bottom",
  UTILITY: "support",
};

export function toRole(teamPosition: string): Role {
  return ROLE_BY_POSITION[teamPosition] ?? "unknown";
}

/** Riot queue ids. Anything unlisted becomes `other` rather than a guess. */
const QUEUE_BY_ID: Record<number, Queue> = {
  400: "normal-draft",
  420: "ranked-solo",
  430: "normal-blind",
  440: "ranked-flex",
  450: "aram",
};

export function toQueue(queueId: number): Queue {
  return QUEUE_BY_ID[queueId] ?? "other";
}

/** The slice of Riot's payload this mapper reads. The rest is ignored on purpose. */
type RiotMatch = {
  metadata: { matchId: string };
  info: {
    queueId: number;
    gameDuration: number;
    gameStartTimestamp: number;
    participants: {
      puuid: string;
      championName: string;
      teamPosition: string;
      win: boolean;
    }[];
  };
};

export function toMatchSummary(match: RiotMatch, puuid: string): MatchSummary {
  const participant = match.info.participants.find((candidate) => candidate.puuid === puuid);

  if (!participant) {
    // Asking about someone who did not play is a caller bug, not missing data.
    // Returning a half-filled summary here would surface as a wrong score later.
    throw new Error(`${puuid} is not a participant in match ${match.metadata.matchId}`);
  }

  return {
    game: "lol",
    matchId: match.metadata.matchId,
    puuid: participant.puuid,
    champion: participant.championName,
    role: toRole(participant.teamPosition),
    queue: toQueue(match.info.queueId),
    win: participant.win,
    durationSeconds: match.info.gameDuration,
    playedAt: new Date(match.info.gameStartTimestamp),
  };
}
