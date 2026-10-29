/*
 * The one file of `src/components/DocsAssistant/` that is not a verbatim copy of the Handsontable docs'
 * (handsontable/handsontable at 71be5d4, docs/src/components/DocsAssistant/): its storage keys, starter
 * questions and backend fallback are HyperFormula's. Refresh the other files by copying them again.
 */
// Not the Handsontable docs' `hot-docs-chat-*`: both portals are on handsontable.com, so shared keys would carry a
// conversation (and the open panel) from one product's docs into the other's.
export const STORAGE_KEYS = {
  thread: 'hf-docs-chat-thread',
  open: 'hf-docs-chat-open',
  width: 'hf-docs-chat-width',
  threadId: 'hf-docs-chat-thread-id',
  /**
   * localStorage: set once the reader closes the proactive bubble, which then never shows again.
   */
  bubbleDismissed: 'hf-docs-chat-bubble-dismissed',
} as const;

export const WIDTH = {
  min: 360,
  max: 800,
  default: 520,
} as const;

/**
 * Proactive bubble trigger (SU-598, stage I): the reader reached the bottom of a
 * long page and stayed idle. The bubble can show again on later pages, until the
 * reader closes it once.
 */
export const BUBBLE = {
  /**
   * How long the reader must stay idle at the bottom of the page.
   */
  idleMs: 3000,
  /**
   * How close to the end of the page (px) still counts as "the bottom".
   */
  bottomTolerancePx: 64,
  /**
   * A page shorter than this many viewport heights is not "long", so it never triggers.
   */
  minPageViewports: 2,
} as const;

export const STARTER_SUGGESTIONS = [
  'How do I add a custom function?',
  'How do named expressions work?',
  'How do I undo and redo changes?',
];

export const WELCOME = {
  headline: 'How can I help?',
  sub: 'I search the docs to answer questions about APIs, configuration, and usage. I say "I don\'t know" when the docs don\'t cover it.',
};

/**
 * Canonical docs hosts where the marketing worker proxies a stable same-origin
 * path (`/docs-assistant/*`) through to the assistant backend (SU-664). On
 * these hosts the widget talks to its own origin, so future backend rollovers
 * need no docs-repo, CSP, or CORS change.
 */
const SAME_ORIGIN_DOCS_HOSTS = new Set(['handsontable.com', 'dev.handsontable.com']);

/** Same-origin base proxied by the marketing worker on the canonical hosts. */
const SAME_ORIGIN_BASE = '/docs-assistant';

/**
 * Absolute backend URL used everywhere the same-origin proxy does not exist —
 * Workers Builds previews and local development. Baked at build time from
 * `PUBLIC_CHAT_API_URL`, falling back to the backend's workers.dev address (the
 * one the handsontable.com worker relays to). The backend answers only the
 * origins it allowlists, so a preview's panel opens but cannot get an answer.
 */
const ABSOLUTE_API_URL =
  (import.meta.env.PUBLIC_CHAT_API_URL as string | undefined) ||
  'https://hot-docs-assistant.handsontable-sandbox.workers.dev';

/**
 * Resolve the backend base URL at runtime. The widget mounts client-side only
 * (see `docs-assistant-bootstrap.ts`), so `window` is available — but the guard
 * keeps the module safe to evaluate during SSR/build too.
 */
function resolveApiBase(): string {
  if (typeof window !== 'undefined' && SAME_ORIGIN_DOCS_HOSTS.has(window.location.hostname)) {
    return SAME_ORIGIN_BASE;
  }
  return ABSOLUTE_API_URL;
}

export const API_URL = resolveApiBase();

export const CHAT_ENDPOINT = `${API_URL.replace(/\/$/, '')}/api/chat`;
export const FEEDBACK_ENDPOINT = `${API_URL.replace(/\/$/, '')}/api/feedback`;

export const SHIKI_LANGS = ['js', 'ts', 'html', 'css', 'json', 'bash'] as const;
export const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const;
