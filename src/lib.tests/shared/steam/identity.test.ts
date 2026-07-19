import { describe, expect, it } from "vitest";
import { isSteamId64, parseSteamIdentity } from "../../../lib/shared/steam/identity";

describe("isSteamId64", () => {
  it("accepts a 17-digit id", () => {
    expect(isSteamId64("76561197960287930")).toBe(true);
  });

  it("rejects ids that are too short or too long", () => {
    expect(isSteamId64("7656119796028793")).toBe(false);
    expect(isSteamId64("765611979602879301")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(isSteamId64("7656119796028793a")).toBe(false);
    expect(isSteamId64("gabelogannewell")).toBe(false);
  });
});

describe("parseSteamIdentity", () => {
  it("parses a bare SteamID64", () => {
    expect(parseSteamIdentity("76561197960287930")).toEqual({
      kind: "steamId64",
      steamId: "76561197960287930",
    });
  });

  it("parses a bare vanity name", () => {
    expect(parseSteamIdentity("gabelogannewell")).toEqual({
      kind: "vanity",
      vanityName: "gabelogannewell",
    });
  });

  it("parses a vanity profile URL", () => {
    expect(
      parseSteamIdentity("https://steamcommunity.com/id/gabelogannewell/")
    ).toEqual({ kind: "vanity", vanityName: "gabelogannewell" });
  });

  it("parses a profiles URL containing a SteamID64", () => {
    expect(
      parseSteamIdentity("https://steamcommunity.com/profiles/76561197960287930")
    ).toEqual({ kind: "steamId64", steamId: "76561197960287930" });
  });

  it("parses a profile URL without a scheme", () => {
    expect(parseSteamIdentity("steamcommunity.com/id/gabelogannewell")).toEqual({
      kind: "vanity",
      vanityName: "gabelogannewell",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseSteamIdentity("  76561197960287930  ")).toEqual({
      kind: "steamId64",
      steamId: "76561197960287930",
    });
  });

  it("returns null for empty input", () => {
    expect(parseSteamIdentity("")).toBeNull();
    expect(parseSteamIdentity("   ")).toBeNull();
  });

  it("returns null for a profiles URL with an invalid id", () => {
    expect(
      parseSteamIdentity("https://steamcommunity.com/profiles/notanid")
    ).toBeNull();
  });

  it("returns null for input with invalid vanity characters", () => {
    expect(parseSteamIdentity("has spaces in it")).toBeNull();
    expect(parseSteamIdentity("emoji😀name")).toBeNull();
  });
});
