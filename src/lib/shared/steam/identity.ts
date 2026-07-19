/** A user-entered Steam identity, classified by how it must be resolved. */
export type SteamIdentity =
  | {
      /** Discriminator: the input is already a SteamID64. */
      kind: "steamId64";
      /** The 17-digit SteamID64. */
      steamId: string;
    }
  | {
      /** Discriminator: the input is a vanity name needing resolution. */
      kind: "vanity";
      /** The custom profile name to pass to ResolveVanityURL. */
      vanityName: string;
    };

/** Matches a 17-digit SteamID64. */
const STEAM_ID_64 = /^\d{17}$/;
/** Matches a valid Steam vanity (custom profile) name. */
const VANITY_NAME = /^[A-Za-z0-9_-]{2,32}$/;
/** Matches steamcommunity.com /id/<vanity> and /profiles/<steamid64> URLs. */
const PROFILE_URL =
  /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/(id|profiles)\/([^/?#]+)\/?$/i;

/** Returns true when `value` is a well-formed 17-digit SteamID64. */
export function isSteamId64(value: string): boolean {
  return STEAM_ID_64.test(value);
}

/**
 * Classifies user input as a Steam identity. Accepts a bare SteamID64, a
 * bare vanity name, or a steamcommunity.com /id/<vanity> or
 * /profiles/<steamid64> URL.
 *
 * @param input Raw text the user typed; surrounding whitespace is ignored.
 * @returns The classified identity, or `null` if the input fits none
 * of the accepted forms.
 */
export function parseSteamIdentity(input: string): SteamIdentity | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(PROFILE_URL);
  if (urlMatch) {
    const [, section, value] = urlMatch;
    if (section.toLowerCase() === "profiles") {
      return isSteamId64(value) ? { kind: "steamId64", steamId: value } : null;
    }
    return VANITY_NAME.test(value)
      ? { kind: "vanity", vanityName: value }
      : null;
  }

  if (isSteamId64(trimmed)) return { kind: "steamId64", steamId: trimmed };
  if (VANITY_NAME.test(trimmed)) return { kind: "vanity", vanityName: trimmed };
  return null;
}
