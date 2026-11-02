import { describe, expect, it } from "vitest";
import { NullAdapter } from "../../src/adapter/nullAdapter";
import { createEditorHarness, requireTextarea } from "../helpers";

function pressTab(textarea: HTMLTextAreaElement): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });

  textarea.dispatchEvent(event);

  return event;
}

describe("Tab when nothing to apply", () => {
  it("commits the current value instead of inserting a tab", () => {
    const committed: string[] = [];
    const { host, editor, destroy } = createEditorHarness({
      adapter: new NullAdapter(),
      onCommit: (value) => committed.push(value),
    });
    const textarea = requireTextarea(host);

    editor.setValue("=1+2");
    const event = pressTab(textarea);

    expect(event.defaultPrevented).toBe(true);
    expect(committed).toEqual(["=1+2"]);

    destroy();
  });

  it("does not commit on Tab when there is no onCommit handler", () => {
    const { host, editor, destroy } = createEditorHarness({ adapter: new NullAdapter() });
    const textarea = requireTextarea(host);

    editor.setValue("=1+2");
    const event = pressTab(textarea);

    expect(event.defaultPrevented).toBe(false);

    destroy();
  });
});
