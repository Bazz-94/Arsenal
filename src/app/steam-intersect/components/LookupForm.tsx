"use client";

import { useState } from "react";

/** Props for `LookupForm`. */
type LookupFormProps = {
  /** True while the lookup Server Function runs; disables the submit. */
  isPending: boolean;
  /** Called with the entered identity text on submit. */
  onSubmit: (input: string) => void;
};

/**
 * Steam identity form: text input for a vanity name, SteamID64, or
 * profile URL, plus the "Find friends" submit button. Owns the input
 * text; hands it to `onSubmit` when submitted.
 */
export function LookupForm({ isPending, onSubmit }: LookupFormProps) {
  /** Raw identity text in the form input. */
  const [input, setInput] = useState("");

  /** Submits the entered identity. */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={input}
        onChange={event => setInput(event.target.value)}
        placeholder="Vanity name, SteamID64, or profile URL"
        aria-label="Steam profile"
        className="flex-1 rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-foreground/40"
      />
      <button
        type="submit"
        disabled={isPending || input.trim() === ""}
        className="rounded-lg border border-card-border bg-card px-5 py-2 font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
      >
        {isPending ? "Looking up…" : "Find friends"}
      </button>
    </form>
  );
}
