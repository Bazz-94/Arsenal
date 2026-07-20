"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { lookupSteamProfiles } from "../../../lib/steam-intersect/actions";
import { LookupForm } from "./LookupForm";
import { ProfileCard } from "./ProfileCard";
import { ERROR_MESSAGES } from "../../../lib/steam-intersect/errorMessages";
import { MAX_SELECTED, MIN_SELECTED, useIntersectStore } from "../store";

/**
 * Steam Intersect step 1: enter a Steam identity, then pick up to 10
 * people (self included) from the resolved friend list. Proceeds to the
 * results page with the selected SteamID64s.
 */
export default function IntersectTool() {
  const router = useRouter();
  /** Selection-step state and actions from the Zustand store. */
  const {
    error,
    profiles,
    selected,
    filter,
    limitHit,
    setFilter,
    applyLookup,
    toggle,
  } = useIntersectStore();
  /** Pending state while the lookup Server Function runs. */
  const [isPending, startTransition] = useTransition();

  /** Submits the entered identity to the lookup Server Function. */
  function handleSubmit(input: string) {
    setFilter("");
    startTransition(async () => {
      applyLookup(await lookupSteamProfiles(input));
    });
  }

  /** Navigates to the results page with the selected ids. */
  function proceed() {
    router.push(`/steam-intersect/results?ids=${[...selected].join(",")}`);
  }

  return (
    <div className="w-full max-w-4xl">
      <LookupForm isPending={isPending} onSubmit={handleSubmit} />

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      {profiles && (
        <>
          <input
            type="search"
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder="Filter by name"
            aria-label="Filter friends by name"
            className="mt-8 w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-foreground/40 sm:max-w-xs"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-foreground/70">
              {selected.size} / {MAX_SELECTED} selected
              {selected.size < MIN_SELECTED && ` — pick at least ${MIN_SELECTED}`}
            </p>
            <button
              type="button"
              onClick={proceed}
              disabled={selected.size < MIN_SELECTED}
              className="rounded-lg border border-card-border bg-card px-5 py-2 font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
            >
              View common games
            </button>
          </div>
          {limitHit && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              You can select at most {MAX_SELECTED} people. Deselect someone first.
            </p>
          )}
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map(profile => (
              <ProfileCard
                key={profile.steamId}
                profile={profile}
                isSelf={profile.isUser}
                isSelected={selected.has(profile.steamId)}
                onToggle={toggle}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
