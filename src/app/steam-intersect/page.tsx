import type { Metadata } from "next";
import GroupCreationView from "./_components/GroupCreationView";

/** Page metadata for the Steam Intersect tool. */
export const metadata: Metadata = {
  title: "Steam Intersect | Arsenal",
  description:
    "Find Steam games you and your friends own in common.",
};

/** Steam Intersect tool page: identity entry + friend selection. */
export default function IntersectPage() {
  return (
    <div className="mt-8">
      <GroupCreationView />
    </div>
  );
}
