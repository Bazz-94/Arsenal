/**
 * Shared cache interface. Implementation is swappable (e.g. Redis later)
 * without touching consumers — per artifacts/standards.md "Abstraction".
 */
export interface Cache {
  /**
   * Returns the value stored under `key`, or `undefined` if the key is
   * missing or its TTL has expired.
   */
  get<T>(key: string): T | undefined;

  /**
   * Stores `value` under `key` for `ttlMs` milliseconds, replacing any
   * existing entry.
   */
  set<T>(key: string, value: T, ttlMs: number): void;
}

/** A single cache slot: the stored value and its expiry timestamp. */
type Entry = {
  /** The cached value. */
  value: unknown;
  /** Epoch milliseconds after which the entry is considered expired. */
  expiresAt: number;
};

/** Map-based in-process `Cache` implementation with per-entry TTL. */
export class InMemoryCache implements Cache {
  /** Backing store keyed by cache key. */
  private entries = new Map<string, Entry>();

  /**
   * Returns the live value for `key`, deleting and skipping it if expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  /** Stores `value` under `key`, expiring `ttlMs` milliseconds from now. */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
