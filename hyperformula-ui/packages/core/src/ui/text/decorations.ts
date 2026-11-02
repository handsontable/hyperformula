import { TokenType } from "../../lexer/tokens";
import type { Token } from "../../lexer/types";

export interface Decorations {
  parenDepth: Map<number, number>;
  matchPair: [number, number] | null;
  activeRange: [number, number] | null;
  argRange: [number, number] | null;
  unmatchedParens: Set<number>;
}

interface ParenFrame {
  openIndex: number;
  closeIndex: number;
  functionIndex: number;
  depth: number;
  commaIndexes: number[];
}

function functionIndexBefore(tokens: Token[], openIndex: number): number {
  for (let index = openIndex - 1; index >= 0; index--) {
    const token = tokens[index];

    if (!token || token.type === TokenType.WHITESPACE) {
      continue;
    }

    return token.type === TokenType.FUNCTION ? index : -1;
  }

  return -1;
}

function buildFrames(tokens: Token[]): ParenFrame[] {
  const frames: ParenFrame[] = [];
  const open: ParenFrame[] = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    if (!token) {
      continue;
    }

    if (token.type === TokenType.LPAREN) {
      open.push({
        openIndex: index,
        closeIndex: -1,
        functionIndex: functionIndexBefore(tokens, index),
        depth: open.length,
        commaIndexes: [],
      });

      continue;
    }

    if (token.type === TokenType.RPAREN) {
      const frame = open.pop();

      if (frame) {
        frame.closeIndex = index;
        frames.push(frame);
      } else {
        frames.push({
          openIndex: -1,
          closeIndex: index,
          functionIndex: -1,
          depth: 0,
          commaIndexes: [],
        });
      }

      continue;
    }

    if (token.type === TokenType.COMMA) {
      const top = open[open.length - 1];

      if (top) {
        top.commaIndexes.push(index);
      }
    }
  }

  for (const frame of open) {
    frames.push(frame);
  }

  return frames;
}

function buildParenDepth(frames: ParenFrame[]): Map<number, number> {
  const parenDepth = new Map<number, number>();

  for (const frame of frames) {
    if (frame.openIndex >= 0) {
      parenDepth.set(frame.openIndex, frame.depth);
    }

    if (frame.closeIndex >= 0) {
      parenDepth.set(frame.closeIndex, frame.depth);
    }
  }

  return parenDepth;
}

function buildUnmatchedParens(tokens: Token[], frames: ParenFrame[]): Set<number> {
  const matchedOpen = new Set(
    frames.filter((f) => f.openIndex >= 0 && f.closeIndex >= 0).map((f) => f.openIndex),
  );
  const matchedClose = new Set(
    frames.filter((f) => f.openIndex >= 0 && f.closeIndex >= 0).map((f) => f.closeIndex),
  );
  const unmatched = new Set<number>();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (!token) {
      continue;
    }

    if (token.type === TokenType.LPAREN && !matchedOpen.has(i)) {
      unmatched.add(i);
    }

    if (token.type === TokenType.RPAREN && !matchedClose.has(i)) {
      unmatched.add(i);
    }
  }

  return unmatched;
}

function findMatchPair(
  tokens: Token[],
  frames: ParenFrame[],
  offset: number,
): [number, number] | null {
  let adjacent = -1;

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    if (!token || (token.type !== TokenType.LPAREN && token.type !== TokenType.RPAREN)) {
      continue;
    }

    if (token.end === offset) {
      adjacent = index;
      break;
    }

    if (token.start === offset) {
      adjacent = index;
    }
  }

  if (adjacent < 0) {
    return null;
  }

  for (const frame of frames) {
    if (frame.openIndex < 0 || frame.closeIndex < 0) {
      continue;
    }

    if (frame.openIndex === adjacent) {
      return [frame.openIndex, frame.closeIndex];
    }

    if (frame.closeIndex === adjacent) {
      return [frame.openIndex, frame.closeIndex];
    }
  }

  return null;
}

function enclosingFrame(tokens: Token[], frames: ParenFrame[], offset: number): ParenFrame | null {
  let active: ParenFrame | null = null;

  for (const frame of frames) {
    if (frame.openIndex < 0 || frame.functionIndex < 0) {
      continue;
    }

    const openToken = tokens[frame.openIndex];

    if (!openToken || openToken.start >= offset) {
      continue;
    }

    if (frame.closeIndex >= 0) {
      const closeToken = tokens[frame.closeIndex];

      if (closeToken && closeToken.start < offset) {
        continue;
      }
    }

    if (!active || frame.depth > active.depth) {
      active = frame;
    }
  }

  return active;
}

function argRangeFor(tokens: Token[], frame: ParenFrame, offset: number): [number, number] | null {
  const closeIndex = frame.closeIndex >= 0 ? frame.closeIndex : tokens.length;
  const delimiters = [frame.openIndex, ...frame.commaIndexes, closeIndex];

  for (let index = 0; index < delimiters.length - 1; index++) {
    const startDelimiter = delimiters[index];
    const endDelimiter = delimiters[index + 1];

    if (startDelimiter === undefined || endDelimiter === undefined) {
      continue;
    }

    const startToken = tokens[startDelimiter];
    const endToken = tokens[endDelimiter];
    const segmentStart = startToken ? startToken.end : 0;
    const segmentEnd = endToken ? endToken.start : Number.POSITIVE_INFINITY;

    if (offset < segmentStart || offset > segmentEnd) {
      continue;
    }

    const firstTokenIndex = startDelimiter + 1;
    const lastTokenIndex = endDelimiter - 1;

    return firstTokenIndex <= lastTokenIndex ? [firstTokenIndex, lastTokenIndex] : null;
  }

  return null;
}

export function computeDecorations(tokens: Token[], offset: number): Decorations {
  const frames = buildFrames(tokens);
  const active = enclosingFrame(tokens, frames, offset);

  return {
    parenDepth: buildParenDepth(frames),
    matchPair: findMatchPair(tokens, frames, offset),
    activeRange: active
      ? [active.functionIndex, active.closeIndex >= 0 ? active.closeIndex : tokens.length - 1]
      : null,
    argRange: active ? argRangeFor(tokens, active, offset) : null,
    unmatchedParens: buildUnmatchedParens(tokens, frames),
  };
}
