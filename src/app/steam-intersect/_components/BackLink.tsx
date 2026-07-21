import Link from "next/link";

/** Link back to the selection step, styled like the page's action buttons. */
export function BackLink() {
  return (
    <Link
      href="/steam-intersect"
      className="rounded-lg border border-card-border bg-card px-5 py-2 font-medium transition-colors hover:border-foreground/30"
    >
      Back
    </Link>
  );
}
