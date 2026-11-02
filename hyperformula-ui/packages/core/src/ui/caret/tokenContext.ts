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

export function currentFunctionPrefix(tokens: Token[], offset: number): FunctionPrefix | null {
  for (let index = tokens.length - 1; index >= 0; index--) {
    const token = tokens[index];

    if (!token) {
      continue;
    }

    if (token.end < offset) {
      return null;
    }

    if (offset >= token.start && offset <= token.end) {
      if (token.type === TokenType.IDENT) {
        return { prefix: token.value.slice(0, offset - token.start), start: token.start };
      }

      return null;
    }
  }

  return null;
}
