// Shared cache interface. Implementation is swappable (e.g. Redis later)
// without touching consumers — per artifacts/standards.md "Abstraction".
export interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
}

type Entry = {
  value: unknown;
  expiresAt: number;
};

export class InMemoryCache implements Cache {
  private entries = new Map<string, Entry>();

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
