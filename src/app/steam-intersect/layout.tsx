import type { ReactNode } from "react";

/** Shared page shell for the Steam Intersect tool: title, description, and layout chrome. */
export default function SteamIntersectLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-col flex-1 items-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-semibold">Steam Intersect</h1>
        <p className="mt-2 text-foreground/70">
          Find Steam games you and your friends own in common.
        </p>
        {children}
      </div>
    </main>
  );
}
