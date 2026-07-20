"use client";

import Image from "next/image";
import type { SteamProfile } from "@/src/lib/shared/steam/types";

/** Props for `ProfileCard`. */
type ProfileCardProps = {
  /** The profile to render. */
  profile: SteamProfile;
  /** True for the resolved user's own entry. */
  isSelf: boolean;
  /** True when the profile is currently selected. */
  isSelected: boolean;
  /** Called with the profile's SteamID64 to toggle selection. */
  onToggle: (steamId: string) => void;
};

/** Tooltip shown on the "private" badge explaining why selection is off. */
const PRIVATE_TOOLTIP =
  "Game libraries are only visible on public Steam profiles, so private profiles can't be included in the comparison.";

/** One selectable profile row: avatar, name, and badges. */
export function ProfileCard({ profile, isSelf, isSelected, onToggle }: ProfileCardProps) {
  return (
    // Tooltip lives on the <li>: disabled buttons don't fire hover events
    // in all browsers, so a title inside the button may never show.
    <li title={profile.isPrivate ? PRIVATE_TOOLTIP : undefined}>
      <button
        type="button"
        onClick={() => onToggle(profile.steamId)}
        disabled={profile.isPrivate}
        aria-pressed={isSelected}
        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
          isSelected
            ? "border-foreground/60 bg-card"
            : "border-card-border bg-card hover:border-foreground/30"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Image
          src={profile.avatarUrl}
          alt=""
          width={40}
          height={40}
          className="rounded"
        />
        <span className="min-w-0 flex-1 truncate">{profile.name}</span>
        {isSelf && (
          <span className="rounded bg-foreground/10 px-2 py-0.5 text-xs">you</span>
        )}
        {profile.isPrivate && (
          <span className="cursor-help rounded bg-foreground/10 px-2 py-0.5 text-xs">
            private
          </span>
        )}
        {isSelected && <span aria-hidden className="text-sm">✓</span>}
      </button>
    </li>
  );
}
