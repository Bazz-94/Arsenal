import type { Metadata } from "next";
import Link from "next/link";
import { getSteamClient } from "@/src/app/_lib/steam/server";
import { getCommonGames } from "@/src/app/steam-intersect/_lib/getCommonGames";
import { MIN_SELECTED } from "../store";
import { ResultsView } from "./ResultsView";

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
        <Link href="/steam-intersect" className="text-sm text-foreground/70 underline">
          Back to selection
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Common Games</h1>
        {ids.length < MIN_SELECTED ? (
          <SelectionRequiredNotice />
        ) : (
          <Group ids={ids} />
        )}
      </div>
    </main>
  );
}

/** Shown when the URL doesn't carry a valid selection to compare. */
function SelectionRequiredNotice() {
  return (
    <p className="mt-4 text-foreground/70">
      Select at least {MIN_SELECTED} people to compare.
    </p>
  );
}

/** Resolves the group and its common games for `ids` and hands off to `ResultsView`. */
async function Group({ ids }: { ids: string[] }) {
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
    <ResultsView
      initialProfiles={result.profiles}
      initialGames={result.games}
      excluded={result.excluded}
    />
  );
}
