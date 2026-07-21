import { create } from "zustand";
import type { Profile } from "@/src/app/steam-intersect/_lib/types";
import type { LookupErrorCode, LookupProfilesResult } from "@/src/app/steam-intersect/_lib/lookupProfiles";
import type { CommonGamesResult, ExcludedProfile } from "@/src/app/steam-intersect/_lib/getCommonGames";
import type { SteamGame, SteamProfile } from "@/src/app/_lib/steam/types";

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

  /** SteamID64s currently included in the results comparison. */
  resultsSelected: Set<string>;
  /** Common games for the last computed `resultsSelected` set. */
  resultsGames: SteamGame[];
  /** Profiles left out of the last computation. */
  resultsExcluded: ExcludedProfile[];
  /** Ids `resultsGames` was last computed for. Used to detect when the
   * selection has changed since, so the recompute button re-enables. */
  resultsComputedFor: Set<string>;
  /** True when the user just tried to drop the results selection below `MIN_SELECTED`. */
  resultsLimitHit: boolean;
  /** True when the last recompute failed to resolve any profile. */
  resultsRecomputeFailed: boolean;
  /** Seeds the results view from the group initially resolved server-side. */
  initResults: (profiles: SteamProfile[], games: SteamGame[], excluded: ExcludedProfile[]) => void;
  /** Toggles one profile in or out of the results comparison, enforcing `MIN_SELECTED`. */
  toggleResult: (steamId: string) => void;
  /** Applies a recompute result for `steamIds`: updates games/excluded and marks them current, or flags failure. */
  applyRecompute: (steamIds: string[], result: CommonGamesResult) => void;
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

  resultsSelected: new Set<string>(),
  resultsGames: [],
  resultsExcluded: [],
  resultsComputedFor: new Set<string>(),
  resultsLimitHit: false,
  resultsRecomputeFailed: false,

  initResults: (profiles, games, excluded) => {
    const ids = new Set(profiles.map(profile => profile.steamId));
    set({
      resultsSelected: ids,
      resultsGames: games,
      resultsExcluded: excluded,
      resultsComputedFor: ids,
      resultsLimitHit: false,
      resultsRecomputeFailed: false,
    });
  },

  toggleResult: steamId =>
    set(state => {
      const next = new Set(state.resultsSelected);
      if (next.has(steamId)) {
        if (next.size <= MIN_SELECTED) {
          return { resultsLimitHit: true };
        }
        next.delete(steamId);
      } else {
        next.add(steamId);
      }
      return { resultsSelected: next, resultsLimitHit: false };
    }),

  applyRecompute: (steamIds, result) =>
    set({
      resultsRecomputeFailed: !result.ok,
      resultsGames: result.ok ? result.games : [],
      resultsExcluded: result.excluded,
      resultsComputedFor: new Set(steamIds),
    }),
}));
