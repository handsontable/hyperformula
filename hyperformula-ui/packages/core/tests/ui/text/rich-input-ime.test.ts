import { describe, expect, it, vi } from "vitest";
import { EventManager } from "../../../src/events/eventManager";
import { RichInput } from "../../../src/ui/text/richInput";

interface RichInputHarness {
  input: RichInput;
  textarea: HTMLTextAreaElement;
  destroy: () => void;
}

function createRichInputHarness(): RichInputHarness {
  const events = new EventManager();
  const scope = events.createScope("rich-input-ime-test");
  const input = new RichInput(scope);

  scope.activate();
  document.body.appendChild(input.textarea);

  return {
    input,
    textarea: input.textarea,
    destroy: () => {
      events.disposeAll();
      input.textarea.remove();
    },
  };
}

describe("RichInput IME composition", () => {
  it("suppresses keydown while composing (compositionstart..compositionend)", () => {
    const harness = createRichInputHarness();
    const keydown = vi.fn();

    harness.input.on("keydown", keydown);
    harness.textarea.dispatchEvent(new Event("compositionstart"));
    harness.textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));

    expect(keydown).not.toHaveBeenCalled();

    harness.textarea.dispatchEvent(new Event("compositionend"));
    harness.textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));

    expect(keydown).toHaveBeenCalledTimes(1);

    harness.destroy();
  });

  it("suppresses keydown carrying isComposing/keyCode 229 even without composition events", () => {
    const harness = createRichInputHarness();
    const keydown = vi.fn();

    harness.input.on("keydown", keydown);

    const event = new KeyboardEvent("keydown", { key: "ArrowDown" });

    Object.defineProperty(event, "isComposing", { value: true });
    Object.defineProperty(event, "keyCode", { value: 229 });
    harness.textarea.dispatchEvent(event);

    expect(keydown).not.toHaveBeenCalled();

    harness.destroy();
  });
});
