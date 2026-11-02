import { TokenType } from "../../lexer/tokens";
import type { CommentMeta, Token } from "../../lexer/types";
import { CN, TOKEN_CN } from "../../theme/classNames";
import {
  assignRefIndex,
  makeRefIndexMap,
  REF_PALETTE,
  type RefIndexMap,
} from "../../theme/refPalette";
import { clear, createEl } from "../dom";
import type { Decorations } from "./decorations";

const DEPTH_PALETTE_SIZE = 6;

export const DATA_TOKEN_IDX = "data-token-idx";
export const DATA_REF_INDEX = "data-ref-index";

const EMPTY_DECORATIONS: Decorations = {
  parenDepth: new Map(),
  matchPair: null,
  activeRange: null,
  argRange: null,
  unmatchedParens: new Set(),
};

interface VisualOverlayOptions {
  knownFunctions?: ReadonlySet<string>;
  exposedToAccessibility?: boolean;
}

export class VisualOverlay {
  readonly root: HTMLDivElement;
  private readonly knownFunctions: ReadonlySet<string> | undefined;
  private lastTokens: Token[] | null = null;
  private lastText: string | null = null;
  private tokenElements: (HTMLElement | null)[] = [];

  constructor(opts: VisualOverlayOptions = {}) {
    this.knownFunctions = opts.knownFunctions;
    this.root = createEl("div", {
      class: CN.overlay,
      dir: "ltr",
      ...(opts.exposedToAccessibility !== true && { "aria-hidden": "true" }),
    });
  }

  private decorate(element: HTMLElement, index: number, decorations: Decorations): void {
    element.classList.remove(CN.parenMatch, CN.dim, CN.argActive, CN.tokenParenErr);
    delete element.dataset.parenDepth;

    const depth = decorations.parenDepth.get(index);

    if (depth !== undefined) {
      element.dataset.parenDepth = String(depth % DEPTH_PALETTE_SIZE);
    }

    if (decorations.matchPair?.includes(index)) {
      element.classList.add(CN.parenMatch);
    }

    const { activeRange } = decorations;

    if (activeRange && (index < activeRange[0] || index > activeRange[1])) {
      element.classList.add(CN.dim);
    }

    const { argRange } = decorations;

    if (argRange && index >= argRange[0] && index <= argRange[1]) {
      element.classList.add(CN.argActive);
    }

    if (decorations.unmatchedParens.has(index)) {
      element.classList.add(CN.tokenParenErr);
    }
  }

  private renderToken(token: Token, index: number, refIndexMap: RefIndexMap): Node {
    if (token.type === TokenType.WHITESPACE) {
      return document.createTextNode(token.value);
    }

    if (token.type === TokenType.COMMENT) {
      const meta = token.meta as CommentMeta;
      const className = meta.contextOk
        ? `${CN.token} ${TOKEN_CN[TokenType.COMMENT]}`
        : `${CN.token} ${TOKEN_CN[TokenType.COMMENT]} ${CN.tokenCommentErr}`;

      return createEl("span", { class: className, [DATA_TOKEN_IDX]: index }, [token.value]);
    }

    if (token.type === TokenType.CELL_REF || token.type === TokenType.RANGE_REF) {
      return this.renderRefMark(token, index, refIndexMap);
    }

    if (token.type === TokenType.NAMED_EXPR) {
      return this.renderNamedExpr(token, index, refIndexMap);
    }

    const element = createEl(
      "span",
      { class: `${CN.token} ${TOKEN_CN[token.type]}`, [DATA_TOKEN_IDX]: index },
      [token.value],
    );

    if (token.type === TokenType.FUNCTION && this.knownFunctions !== undefined) {
      if (!this.knownFunctions.has(token.value.toUpperCase())) {
        element.classList.add(CN.tokenFnUnknown);
      }
    }

    return element;
  }

  private renderNamedExpr(token: Token, index: number, refIndexMap: RefIndexMap): HTMLElement {
    const refIndex = assignRefIndex(refIndexMap, token.value);

    return createEl(
      "span",
      {
        class: `${CN.refMark} ${CN.refMarkNamed}`,
        [DATA_TOKEN_IDX]: index,
        [DATA_REF_INDEX]: String(refIndex % REF_PALETTE.length),
      },
      [token.value],
    );
  }

  private renderRefMark(token: Token, index: number, refIndexMap: RefIndexMap): HTMLElement {
    const refIndex = assignRefIndex(refIndexMap, token.value);
    const exclamationIndex = token.value.indexOf("!");

    const children: (string | HTMLElement)[] =
      exclamationIndex === -1
        ? [token.value]
        : [
            createEl("span", { class: CN.tokenSheet }, [
              token.value.slice(0, exclamationIndex + 1),
            ]),
            token.value.slice(exclamationIndex + 1),
          ];

    const element = createEl(
      "span",
      {
        class: CN.refMark,
        [DATA_TOKEN_IDX]: index,
        [DATA_REF_INDEX]: String(refIndex % REF_PALETTE.length),
      },
      children,
    );

    const meta = token.meta as Record<string, unknown> | undefined;

    if (meta?.invalid === true) {
      element.classList.add(CN.tokenRefInvalid);
    }

    return element;
  }

  private tokensEqual(previous: Token[] | null, next: Token[]): boolean {
    if (previous === null) {
      return false;
    }

    if (previous === next) {
      return true;
    }

    if (previous.length !== next.length) {
      return false;
    }

    for (let index = 0; index < previous.length; index++) {
      const previousToken = previous[index];
      const nextToken = next[index];

      if (previousToken === nextToken) {
        continue;
      }

      if (!previousToken || !nextToken) {
        return false;
      }

      if (
        previousToken.type !== nextToken.type ||
        previousToken.start !== nextToken.start ||
        previousToken.end !== nextToken.end ||
        previousToken.value !== nextToken.value
      ) {
        return false;
      }
    }

    return true;
  }

  private updateDecorations(decorations: Decorations): void {
    for (let index = 0; index < this.tokenElements.length; index++) {
      const element = this.tokenElements[index];

      if (element) {
        this.decorate(element, index, decorations);
      }
    }
  }

  private fullRender(tokens: Token[], text: string, decorations: Decorations): void {
    clear(this.root);
    const refIndexMap: RefIndexMap = makeRefIndexMap();
    const tokenElements: (HTMLElement | null)[] = [];
    let cursor = 0;

    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];

      if (!token) {
        tokenElements.push(null);
        continue;
      }

      if (token.start > cursor) {
        this.root.appendChild(document.createTextNode(text.slice(cursor, token.start)));
      }

      const node = this.renderToken(token, index, refIndexMap);

      if (node instanceof HTMLElement) {
        this.decorate(node, index, decorations);
        tokenElements.push(node);
      } else {
        tokenElements.push(null);
      }

      this.root.appendChild(node);
      cursor = token.end;
    }

    if (cursor < text.length) {
      this.root.appendChild(document.createTextNode(text.slice(cursor)));
    }

    this.root.appendChild(document.createTextNode("​"));
    this.tokenElements = tokenElements;
  }

  render(tokens: Token[], text: string, decorations: Decorations = EMPTY_DECORATIONS): void {
    if (this.lastText === text && this.tokensEqual(this.lastTokens, tokens)) {
      this.updateDecorations(decorations);
      this.lastTokens = tokens;
      this.lastText = text;

      return;
    }

    this.fullRender(tokens, text, decorations);
    this.lastTokens = tokens;
    this.lastText = text;
  }
}
