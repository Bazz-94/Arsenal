import type { Metadata } from "next";
import IntersectTool from "./_components/IntersectTool";

/** Page metadata for the Steam Intersect tool. */
export const metadata: Metadata = {
  title: "Steam Intersect | Arsenal",
  description:
    "Find Steam games you and your friends own in common.",
};

/** Steam Intersect tool page: identity entry + friend selection. */
export default function IntersectPage() {
  return (
    <main className="flex flex-col flex-1 items-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-semibold">Steam Intersect</h1>
        <p className="mt-2 text-foreground/70">
          Find Steam games you and your friends own in common.
        </p>
        <div className="mt-8">
          <IntersectTool />
        </div>
      </div>
    </main>
  );
}
