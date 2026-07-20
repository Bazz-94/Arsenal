import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryCache } from "../lib/shared/cache";

describe("in-memory TTL cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a stored value before its TTL expires", () => {
    const cache = new InMemoryCache();
    cache.set("key", "value", 5_000);
    expect(cache.get("key")).toBe("value");
  });

  it("returns undefined for a missing key", () => {
    const cache = new InMemoryCache();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("returns undefined once the TTL has expired", () => {
    const cache = new InMemoryCache();
    cache.set("key", "value", 5_000);
    vi.advanceTimersByTime(5_001);
    expect(cache.get("key")).toBeUndefined();
  });

  it("keeps the value at exactly the TTL boundary", () => {
    const cache = new InMemoryCache();
    cache.set("key", "value", 5_000);
    vi.advanceTimersByTime(5_000);
    expect(cache.get("key")).toBe("value");
  });

  it("overwrites an existing key with a new value and TTL", () => {
    const cache = new InMemoryCache();
    cache.set("key", "old", 1_000);
    cache.set("key", "new", 10_000);
    vi.advanceTimersByTime(5_000);
    expect(cache.get("key")).toBe("new");
  });

  it("stores structured values", () => {
    const cache = new InMemoryCache();
    const value = { ids: ["1", "2"] };
    cache.set("key", value, 1_000);
    expect(cache.get<typeof value>("key")).toEqual(value);
  });
});
