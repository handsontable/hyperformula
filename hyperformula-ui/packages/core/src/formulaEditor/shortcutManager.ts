import type { Binding, Combo, CommandId, ContextFlag, KeyContext } from "./types";

export class ShortcutManager {
  private bindings: Binding[] = [];
  private readonly commands = new Map<CommandId, () => boolean>();

  private matchesCombo(event: KeyboardEvent, combo: Combo): boolean {
    const primaryModifier = event.ctrlKey || event.metaKey;
    const isPrintableKey = combo.key.length === 1;
    const shiftMatches =
      isPrintableKey && combo.shift === undefined
        ? true
        : event.shiftKey === (combo.shift ?? false);

    return (
      event.key === combo.key &&
      primaryModifier === (combo.mod ?? false) &&
      shiftMatches &&
      event.altKey === (combo.alt ?? false)
    );
  }

  private matchesContext(flags: ContextFlag[], ctx: KeyContext): boolean {
    return flags.every((flag) => flag === "always" || ctx[flag]);
  }

  setBindings(bindings: Binding[]): void {
    this.bindings = bindings;
  }

  register(command: CommandId, handler: () => boolean): void {
    this.commands.set(command, handler);
  }

  dispatch(event: KeyboardEvent, ctx: KeyContext): boolean {
    for (const binding of this.bindings) {
      if (!this.matchesCombo(event, binding.combo)) {
        continue;
      }

      if (!this.matchesContext(binding.when, ctx)) {
        continue;
      }

      const handler = this.commands.get(binding.command);

      if (!handler) {
        continue;
      }

      if (handler()) {
        event.preventDefault();

        return true;
      }
    }

    return false;
  }
}
