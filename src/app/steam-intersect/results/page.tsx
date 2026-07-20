import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSteamClient } from "@/src/lib/shared/steam/server";
import { getCommonGames, type ExcludedProfile } from "@/src/lib/steam-intersect/getCommonGames";
import { MIN_SELECTED } from "../store";

/** Page metadata for the Steam Intersect results view. */
export const metadata: Metadata = {
  title: "Common Games | Steam Intersect | Arsenal",
  description: "Games owned in common by the selected Steam profiles.",
};

/** Query string shape this page reads. */
type ResultsPageProps = {
  /** Route search params; `ids` is a comma-separated list of SteamID64s. */
  searchParams: Promise<{ ids?: string | string[] }>;
};

/** Parses the `ids` search param into a deduplicated list of SteamID64s. */
function parseIds(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];
  return [...new Set(value.split(",").filter(Boolean))];
}

/** Steam Intersect results view: games owned in common by the selected profiles. */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const ids = parseIds((await searchParams).ids);

  return (
    <main className="flex flex-col flex-1 items-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-semibold">Common Games</h1>
        {ids.length < MIN_SELECTED ? (
          <SelectionRequiredNotice />
        ) : (
          <Results ids={ids} />
        )}
      </div>
    </main>
  );
}

/** Shown when the URL doesn't carry a valid selection to compare. */
function SelectionRequiredNotice() {
  return (
    <p className="mt-4 text-foreground/70">
      Select at least {MIN_SELECTED} people to compare.{" "}
      <Link href="/steam-intersect" className="underline">
        Back to selection
      </Link>
    </p>
  );
}

/** Fetches and renders the common-games lookup for `ids`. */
async function Results({ ids }: { ids: string[] }) {
  const result = await getCommonGames(getSteamClient(), ids);

  if (!result.ok) {
    return (
      <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
        None of the selected profiles could be read. Try again, or go back
        and pick different people.
      </p>
    );
  }

  return (
    <>
      {result.excluded.length > 0 && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          Excluded from the comparison: {result.excluded.map(describeExclusion).join(", ")}.
        </p>
      )}

      {result.games.length === 0 ? (
        <p className="mt-4 text-foreground/70">
          No games are common to everyone selected.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {result.games.map(game => (
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
