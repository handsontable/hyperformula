import { createEl, isHTMLElement } from "../dom";
import { toErrorDescription } from "./cellError";

const ERROR_ATTRIBUTE = "data-hfe-error";
const DESCRIBEDBY = "aria-describedby";

function idRefs(element: HTMLElement, attribute: string): string[] {
  return element.getAttribute(attribute)?.split(/\s+/).filter(Boolean) ?? [];
}

function addIdRef(element: HTMLElement, attribute: string, id: string): void {
  const ids = idRefs(element, attribute);

  if (!ids.includes(id)) {
    element.setAttribute(attribute, [...ids, id].join(" "));
  }
}

function removeIdRef(element: HTMLElement, attribute: string, id: string): void {
  const ids = idRefs(element, attribute);
  const remaining = ids.filter((token) => token !== id);

  if (remaining.length === ids.length) {
    return;
  }

  if (remaining.length === 0) {
    element.removeAttribute(attribute);
  } else {
    element.setAttribute(attribute, remaining.join(" "));
  }
}

export class ErrorDescriptions {
  private readonly observer = new MutationObserver((records) => this.handleMutations(records));
  private readonly cellIds = new Map<HTMLElement, string>();
  private readonly nodes = new Map<string, HTMLElement>();
  private nodeCounter = 0;

  constructor(
    private readonly portal: HTMLElement,
    private readonly idPrefix: string,
  ) {}

  private handleMutations(records: MutationRecord[]): void {
    const targets = new Set<HTMLElement>();

    for (const record of records) {
      if (record.type === "attributes") {
        if (isHTMLElement(record.target)) {
          targets.add(record.target);
        }
      } else {
        for (const added of record.addedNodes) {
          this.collectMarked(added, targets);
        }
      }
    }

    for (const cell of targets) {
      this.sync(cell);
    }

    this.prune();
  }

  private collectMarked(node: Node, targets: Set<HTMLElement>): void {
    if (!isHTMLElement(node)) {
      return;
    }

    if (node.hasAttribute(ERROR_ATTRIBUTE)) {
      targets.add(node);
    }

    for (const marked of node.querySelectorAll<HTMLElement>(`[${ERROR_ATTRIBUTE}]`)) {
      targets.add(marked);
    }
  }

  private sync(cell: HTMLElement): void {
    const message = cell.getAttribute(ERROR_ATTRIBUTE);
    const description = message ? toErrorDescription(message) : null;
    const trackedId = this.cellIds.get(cell);

    if (description === null) {
      if (trackedId !== undefined) {
        this.unlink(cell, trackedId);
      }

      return;
    }

    const id = this.nodeFor(description).id;

    if (trackedId !== undefined && trackedId !== id) {
      this.unlink(cell, trackedId);
    }

    this.cellIds.set(cell, id);
    addIdRef(cell, DESCRIBEDBY, id);
  }

  private nodeFor(text: string): HTMLElement {
    const existing = this.nodes.get(text);

    if (existing) {
      return existing;
    }

    this.nodeCounter += 1;

    const node = createEl(
      "span",
      { id: `${this.idPrefix}-description-${this.nodeCounter}`, hidden: true },
      [text],
      this.portal.ownerDocument,
    );

    this.portal.appendChild(node);
    this.nodes.set(text, node);

    return node;
  }

  private unlink(cell: HTMLElement, id: string): void {
    this.cellIds.delete(cell);
    removeIdRef(cell, DESCRIBEDBY, id);
  }

  private prune(): void {
    for (const [cell, id] of this.cellIds) {
      if (!cell.isConnected) {
        this.unlink(cell, id);
      } else if (!idRefs(cell, DESCRIBEDBY).includes(id)) {
        this.cellIds.delete(cell);
      }
    }

    const used = new Set(this.cellIds.values());

    for (const [text, node] of this.nodes) {
      if (!used.has(node.id)) {
        node.remove();
        this.nodes.delete(text);
      }
    }
  }

  attach(container: HTMLElement): void {
    this.detach();
    this.observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [ERROR_ATTRIBUTE, DESCRIBEDBY],
    });

    for (const cell of container.querySelectorAll<HTMLElement>(`[${ERROR_ATTRIBUTE}]`)) {
      this.sync(cell);
    }

    this.prune();
  }

  detach(): void {
    this.observer.disconnect();

    for (const [cell, id] of this.cellIds) {
      this.unlink(cell, id);
    }

    for (const node of this.nodes.values()) {
      node.remove();
    }

    this.nodes.clear();
  }

  destroy(): void {
    this.detach();
  }
}
