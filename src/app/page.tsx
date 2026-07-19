import ToolCard, { type Tool } from "@/src/components/ToolCard";

/** All tools available on the site, rendered as menu cards. */
const tools: Tool[] = [
  {
    name: "Steam Intersect",
    description: "Find Steam games you and your friends own in common.",
    path: "/steam-intersect",
  },
];

/** Home page: static menu of available tools. */
export default function Home() {
  return (
    <main className="flex flex-col flex-1 items-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-semibold">Arsenal</h1>
        <p className="mt-2 text-foreground/70">
          A collection of small web tools.
        </p>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.path} {...tool} />
          ))}
        </ul>
      </div>
    </main>
  );
}
