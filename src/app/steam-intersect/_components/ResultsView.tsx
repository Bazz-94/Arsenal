"use client";

import Image from "next/image";
import { useEffect, useTransition } from "react";
import { ProfileCard } from "./ProfileCard";
import { BackLink } from "./BackLink";
import { recomputeCommonGames } from "@/src/app/steam-intersect/_lib/actions";
import { MIN_SELECTED, useIntersectStore } from "../store";
import type { SteamGame, SteamProfile } from "@/src/app/_lib/steam/types";
import type { ExcludedProfile } from "@/src/app/steam-intersect/_lib/getCommonGames";

/** Props for `ResultsView`. */
type ResultsViewProps = {
  /** Profiles whose library resolved on the initial lookup, all selected by default. */
  initialProfiles: SteamProfile[];
  /** Common games for `initialProfiles`, as computed on the initial lookup. */
  initialGames: SteamGame[];
  /** Profiles left out of the initial lookup (private or unavailable). */
  excluded: ExcludedProfile[];
};

/**
 * Group + common-games view: shows the whole group pre-selected with its
 * common games already computed. Toggling a profile updates the selection
 * without recomputing until the user presses "View common games" again.
 */
export function ResultsView({ initialProfiles, initialGames, excluded: initialExcluded }: ResultsViewProps) {
  /** SteamID64 of the resolved user (always first in `initialProfiles`). */
  const selfId = initialProfiles[0]?.steamId;
  /** Profiles sorted by display name for rendering. */
  const sortedProfiles = [...initialProfiles].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  /** Results-step state and actions from the Zustand store. */
  const {
    resultsSelected: selected,
    resultsGames: games,
    resultsExcluded: excluded,
    resultsComputedFor: computedFor,
    resultsLimitHit: limitHit,
    resultsRecomputeFailed: recomputeFailed,
    initResults,
    toggleResult,
    applyRecompute,
  } = useIntersectStore();
  /** Pending state while a compute Server Function call is in flight. */
  const [isPending, startTransition] = useTransition();

  /** Ids identifying the initial group, so the store re-seeds if the URL's `ids` change. */
  const initialKey = initialProfiles
    .map(profile => profile.steamId)
    .sort()
    .join(",");

  /** Seeds the store from the group initially resolved server-side. */
  useEffect(() => {
    initResults(initialProfiles, initialGames, initialExcluded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  /** True when `games` doesn't reflect the current `selected` set. */
  const isStale =
    computedFor.size !== selected.size || [...selected].some(id => !computedFor.has(id));

  /** Computes common games for the current `selected` set. */
  function computeGames() {
    const steamIds = [...selected];
    startTransition(async () => {
      applyRecompute(steamIds, await recomputeCommonGames(steamIds));
    });
  }

  return (
    <>
      {excluded.length > 0 && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          Excluded from the comparison: {excluded.map(describeExclusion).join(", ")}.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm text-foreground/70">
          {selected.size} / {sortedProfiles.length} selected in group
        </h2>
        <BackLink />
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sortedProfiles.map(profile => (
          <ProfileCard
            key={profile.steamId}
            profile={profile}
            isSelf={profile.steamId === selfId}
            isSelected={selected.has(profile.steamId)}
            onToggle={toggleResult}
          />
        ))}
      </ul>
      {limitHit && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          Keep at least {MIN_SELECTED} people selected.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm text-foreground/70">{games.length} games in common</h2>
        <button
          type="button"
          onClick={computeGames}
          disabled={isPending || !isStale}
          className="rounded-lg border border-card-border bg-card px-5 py-2 font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          {isPending ? "Loading…" : "Update"}
        </button>
      </div>
      {recomputeFailed ? (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t update the list. Try again.
        </p>
      ) : games.length === 0 ? (
        <p className="mt-4 text-foreground/70">
          No games are common to everyone selected.
        </p>
      ) : (
        <ul
          className={`mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 ${
            isPending ? "opacity-50" : ""
          }`}
        >
          {games.map(game => (
            <li
              key={game.appid}
              className="flex items-center gap-3 rounded-lg border border-card-border bg-card p-3"
            >
              {game.iconUrl ? (
                <Image
                  src={game.iconUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-foreground/10" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate">{game.name}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Human-readable summary of one excluded profile. */
function describeExclusion({ label, reason }: ExcludedProfile): string {
  return reason === "private" ? `${label} (private profile)` : `${label} (unavailable)`;
}
