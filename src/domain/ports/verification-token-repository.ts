/** Auth.js's minimal verification token. `token` arrives already hashed. */
export type VerificationToken = {
  identifier: string;
  token: string;
  expires: Date;
};

export type VerificationTokenRepository = {
  /**
   * Stores one token, then opportunistically deletes already-expired tokens for
   * the same identifier (D7). Does not touch live tokens for that identifier:
   * requesting a second link must not invalidate the first (A6).
   */
  create(token: VerificationToken): Promise<void>;

  /**
   * Single use: deletes the row and returns what it deleted, in one statement
   * (D6). Returns null when the pair does not exist — including the second
   * attempt on the same link. Does **not** compare `expires`: Auth.js owns that
   * comparison (@auth/core/lib/actions/callback/index.js:147), and a repository
   * that silently dropped an expired row would turn an explainable "that link
   * expired" into an unexplainable "that link never existed".
   */
  consume(lookup: { identifier: string; token: string }): Promise<VerificationToken | null>;
};
