"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ProfileCard } from "../components/ProfileCard";
import { recomputeCommonGames } from "@/src/lib/steam-intersect/actions";
import { MIN_SELECTED } from "../store";
import type { SteamGame, SteamProfile } from "@/src/lib/shared/steam/types";
import type { ExcludedProfile } from "@/src/lib/steam-intersect/getCommonGames";

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
 * Interactive results view: lets the user toggle profiles in or out of the
 * comparison, recomputing the common-games list on the server each time.
 */
export function ResultsView({ initialProfiles, initialGames, excluded }: ResultsViewProps) {
  /** SteamID64 of the resolved user (always first in `initialProfiles`). */
  const selfId = initialProfiles[0]?.steamId;
  /** SteamID64s currently included in the comparison. */
  const [selected, setSelected] = useState(
    () => new Set(initialProfiles.map(profile => profile.steamId))
  );
  /** Common games for the current `selected` set. */
  const [games, setGames] = useState(initialGames);
  /** True when the user just tried to drop below `MIN_SELECTED`. */
  const [limitHit, setLimitHit] = useState(false);
  /** True when the last recompute failed to resolve any profile. */
  const [recomputeFailed, setRecomputeFailed] = useState(false);
  /** Pending state while a recompute Server Function call is in flight. */
  const [isPending, startTransition] = useTransition();

  /** Toggles one profile in or out, enforcing `MIN_SELECTED` and recomputing. */
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
    startTransition(async () => {
      const result = await recomputeCommonGames([...next]);
      setRecomputeFailed(!result.ok);
      setGames(result.ok ? result.games : []);
    });
  }

  return (
    <>
      {excluded.length > 0 && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          Excluded from the comparison: {excluded.map(describeExclusion).join(", ")}.
        </p>
      )}

      <h2 className="mt-6 text-foreground/70">Selected Profiles</h2>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {initialProfiles.map(profile => (
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
          Couldn&apos;t update the list. Try toggling again.
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
