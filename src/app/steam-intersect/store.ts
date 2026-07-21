import { create } from "zustand";
import type { Profile } from "@/src/lib/steam-intersect/types";
import type { LookupErrorCode, LookupProfilesResult } from "@/src/lib/steam-intersect/lookupProfiles";

/** Max people (including self) that can be included in the intersection. */
export const MAX_SELECTED = 10;
/** Minimum selections before the user can proceed to results. */
export const MIN_SELECTED = 2;

/** State and actions for the Steam Intersect selection step. */
type IntersectState = {
  /** Raw identity text in the lookup form input (vanity name, SteamID64, or profile URL). */
  identityInput: string;
  /** Error code from the last failed lookup, if any. */
  error: LookupErrorCode | null;
  /** Resolved profiles; sorted with filter matches first. */
  profiles: Profile[] | null;
  /** SteamID64s currently selected. */
  selected: Set<string>;
  /** Name filter applied to the profile list (case-insensitive). */
  filter: string;
  /** True when the user just tried to select beyond the limit. */
  limitHit: boolean;
  /** Sets the lookup form input text. */
  setIdentityInput: (identityInput: string) => void;
  /** Sets the name filter text and sorts matching profiles to the top. */
  setFilter: (filter: string) => void;
  /**
   * Applies a lookup result: on success stores the profiles (self first)
   * with self pre-selected; on failure stores the error and clears the
   * profiles.
   */
  applyLookup: (result: LookupProfilesResult) => void;
  /** Toggles one profile's selection, enforcing the cap with feedback. */
  toggle: (steamId: string) => void;
};

/**
 * Sorts profiles whose name contains `filter` (case-insensitive) to the
 * top, keeping relative order within each group.
 */
function sortByFilter(
  profiles: Profile[] | null,
  filter: string
): Profile[] | null {
  if (!profiles) return null;
  const needle = filter.trim().toLowerCase();
  const matches = (profile: Profile) =>
    profile.name.toLowerCase().includes(needle);
  return [...profiles.filter(matches), ...profiles.filter(p => !matches(p))];
}

/** Zustand store backing the Steam Intersect selection step. */
export const useIntersectStore = create<IntersectState>(set => ({
  identityInput: "",
  error: null,
  profiles: null,
  selected: new Set<string>(),
  filter: "",
  limitHit: false,

  setIdentityInput: identityInput => set({ identityInput }),

  setFilter: filter =>
    set(state => ({
      filter,
      profiles: sortByFilter(state.profiles, filter),
    })),

  applyLookup: result =>
    set(() => {
      if (!result.ok) {
        return { error: result.error, profiles: null };
      }
      return {
        error: null,
        profiles: [result.self, ...result.friends].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
        selected: new Set([result.self.steamId]),
        limitHit: false,
        filter: "",
      };
    }),

  toggle: steamId =>
    set(state => {
      const next = new Set(state.selected);
      if (next.has(steamId)) {
        next.delete(steamId);
      } else if (next.size >= MAX_SELECTED) {
        return { limitHit: true };
      } else {
        next.add(steamId);
      }
      return { selected: next, limitHit: false };
    }),
}));
