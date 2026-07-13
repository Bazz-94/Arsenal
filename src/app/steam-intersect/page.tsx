import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Steam Intersect | Arsenal",
  description:
    "Find Steam games you and your friends own in common.",
};

export default function IntersectPage() {
  return (
    <main className="flex flex-col flex-1 items-center justify-center gap-2 px-4">
      <h1 className="text-3xl font-semibold">Steam Intersect</h1>
      <p className="text-foreground/70">Coming soon.</p>
    </main>
  );
}
