import { describe, expect, it } from "vitest";
import { withSharedClose } from "../../../src/ui/popup/popupsOptions";
import type { SuggestionsOptions } from "../../../src/ui/popup/types";

describe("withSharedClose", () => {
  it("returns the per-popup config unchanged when no shared default is given", () => {
    expect(withSharedClose(undefined, { showClose: true })).toEqual({ showClose: true });
  });

  it("returns undefined when neither shared nor per-popup config is given", () => {
    expect(withSharedClose(undefined, undefined)).toBeUndefined();
  });

  it("applies the shared default when the per-popup config is absent", () => {
    expect(withSharedClose(false, undefined)).toEqual({ showClose: false });
  });

  it("lets a per-popup showClose win over the shared default", () => {
    expect(withSharedClose(false, { showClose: true })).toEqual({ showClose: true });
  });

  it("preserves other fields on the per-popup config while merging showClose", () => {
    const own: SuggestionsOptions = { showKeyboardHelp: false };

    expect(withSharedClose(false, own)).toEqual({
      showKeyboardHelp: false,
      showClose: false,
    });
  });
});
