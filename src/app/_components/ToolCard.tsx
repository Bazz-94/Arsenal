import Link from "next/link";

/** Metadata describing one tool listed on the home page menu. */
export type Tool = {
  /** Display name shown as the card title. */
  name: string;
  /** One-line summary shown under the name. */
  description: string;
  /** Route path the card links to (e.g. `/steam-intersect`). */
  path: string;
};

/** Home page menu card linking to a single tool. */
export default function ToolCard({ name, description, path }: Tool) {
  return (
    <li>
      <Link
        href={path}
        className="block h-full rounded-lg border border-card-border bg-card p-5 transition-colors hover:border-foreground/30"
      >
        <h2 className="text-lg font-medium">{name}</h2>
        <p className="mt-1 text-sm text-foreground/70">{description}</p>
      </Link>
    </li>
  );
}
