import { TokenType } from "../../lexer/tokens";
import type { Token } from "../../lexer/types";

export interface CallContext {
  name: string;
  argIndex: number;
}

export interface FunctionPrefix {
  prefix: string;
  start: number;
}

export function activeCallContext(tokens: Token[], offset: number): CallContext | null {
  const stack: Array<{ name: string | null; argIndex: number }> = [];
  let pendingFunc: string | null = null;

  for (const token of tokens) {
    if (token.start >= offset) {
      break;
    }

    switch (token.type) {
      case TokenType.FUNCTION:
        pendingFunc = token.value;
        break;
      case TokenType.LPAREN:
        stack.push({ name: pendingFunc, argIndex: 0 });
        pendingFunc = null;
        break;
      case TokenType.RPAREN:
        stack.pop();
        pendingFunc = null;
        break;
      case TokenType.COMMA: {
        const top = stack[stack.length - 1];

        if (top) {
          top.argIndex++;
        }

        break;
      }

      case TokenType.WHITESPACE:
        break;
      default:
        pendingFunc = null;
    }
  }

  for (let depth = stack.length - 1; depth >= 0; depth--) {
    const frame = stack[depth];

    if (frame?.name) {
      return { name: frame.name, argIndex: frame.argIndex };
    }
  }

  return null;
}

const RE_NAME_CONTINUATION = /[\p{L}\p{N}_.$]/u;

export function currentFunctionPrefix(tokens: Token[], offset: number): FunctionPrefix | null {
  const token = tokens.find(
    (candidate) =>
      candidate.end === offset &&
      (candidate.type === TokenType.IDENT || candidate.type === TokenType.FUNCTION),
  );

  if (!token) {
    return null;
  }

  const next = tokens.find((candidate) => candidate.start === offset);

  if (next && RE_NAME_CONTINUATION.test(next.value.charAt(0))) {
    return null;
  }

  return { prefix: token.value, start: token.start };
}
