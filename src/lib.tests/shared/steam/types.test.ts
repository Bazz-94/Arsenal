import { describe, expect, it } from "vitest";
import { formatOfflineDuration } from "../../../lib/shared/steam/types";

describe("formatOfflineDuration", () => {
  const now = 1_700_100_000_000;

  it("reports just now for under a minute", () => {
    expect(formatOfflineDuration(1_700_100_000 - 30, now)).toBe("just now");
  });

  it("reports singular units", () => {
    expect(formatOfflineDuration(1_700_100_000 - 60 * 60, now)).toBe("1 hour");
  });

  it("reports plural units", () => {
    expect(formatOfflineDuration(1_700_100_000 - 60 * 60 * 3, now)).toBe("3 hours");
  });

  it("rounds down to the largest whole unit", () => {
    expect(formatOfflineDuration(1_700_100_000 - 60 * 60 * 24 * 2, now)).toBe("2 days");
  });

  it("clamps to zero for a lastLogoff in the future", () => {
    expect(formatOfflineDuration(1_700_100_000 + 60, now)).toBe("just now");
  });
});
