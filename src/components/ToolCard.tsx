import Link from "next/link";

export type Tool = {
  name: string;
  description: string;
  path: string;
};

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
