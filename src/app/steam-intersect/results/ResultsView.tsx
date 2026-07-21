"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ProfileCard } from "../_components/ProfileCard";
import { recomputeCommonGames } from "@/src/app/steam-intersect/_lib/actions";
import { MIN_SELECTED } from "../store";
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
  /** SteamID64s currently included in the comparison. */
  const [selected, setSelected] = useState(
    () => new Set(initialProfiles.map(profile => profile.steamId))
  );
  /** Common games for the last computed `selected` set. */
  const [games, setGames] = useState<SteamGame[]>(initialGames);
  /** Profiles left out of the last computation. */
  const [excluded, setExcluded] = useState<ExcludedProfile[]>(initialExcluded);
  /** Ids `games` was last computed for. Used to detect when the selection
   * has changed since, so the button re-enables. */
  const [computedFor, setComputedFor] = useState(
    () => new Set(initialProfiles.map(profile => profile.steamId))
  );
  /** True when the user just tried to drop below `MIN_SELECTED`. */
  const [limitHit, setLimitHit] = useState(false);
  /** True when the last computation failed to resolve any profile. */
  const [recomputeFailed, setRecomputeFailed] = useState(false);
  /** Pending state while a compute Server Function call is in flight. */
  const [isPending, startTransition] = useTransition();

  /** True when `games` doesn't reflect the current `selected` set. */
  const isStale =
    computedFor.size !== selected.size || [...selected].some(id => !computedFor.has(id));

  /** Computes common games for the current `selected` set. */
  function computeGames() {
    const steamIds = [...selected];
    startTransition(async () => {
      const result = await recomputeCommonGames(steamIds);
      setRecomputeFailed(!result.ok);
      setGames(result.ok ? result.games : []);
      setExcluded(result.excluded);
      setComputedFor(new Set(steamIds));
    });
  }

  /** Toggles one profile in or out, enforcing `MIN_SELECTED`. */
  function toggle(steamId: string) {
    const next = new Set(selected);
    if (next.has(steamId)) {
      if (next.size <= MIN_SELECTED) {
        setLimitHit(true);
        return;
      }
      next.delete(steamId);
    } else {
      next.add(steamId);
    }
    setLimitHit(false);
    setSelected(next);
  }

  return (
    <>
      {excluded.length > 0 && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          Excluded from the comparison: {excluded.map(describeExclusion).join(", ")}.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-foreground/70">Group</h2>
        <button
          type="button"
          onClick={computeGames}
          disabled={isPending || !isStale}
          className="rounded-lg border border-card-border bg-card px-5 py-2 font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          {isPending ? "Loading…" : "View common games"}
        </button>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sortedProfiles.map(profile => (
          <ProfileCard
            key={profile.steamId}
            profile={profile}
            isSelf={profile.steamId === selfId}
            isSelected={selected.has(profile.steamId)}
            onToggle={toggle}
          />
        ))}
      </ul>
      {limitHit && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          Keep at least {MIN_SELECTED} people selected.
        </p>
      )}

      <h2 className="mt-8 text-foreground/70">Games in Common</h2>
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
