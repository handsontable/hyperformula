# Sample page

This sentence has a citation marker [V1] right after a word, and another one [V42].

Real markdown links such as [V12](https://example.com/v12) MUST remain intact because they are not bare citation markers.

A line with multiple markers [V3] [V4] should collapse trailing whitespace cleanly.

Inline code like `[V99]` must NOT be stripped because authors may need to discuss the audit-harness syntax itself.

```text
fenced code [V7] stays as-is
```

## A subsection [V8]

Body of a subsection [V9].

## § Sources

- [V1] https://example.com/source-1
- [V3] https://example.com/source-3
- [V4] https://example.com/source-4
- [V8] https://example.com/source-8
- [V9] https://example.com/source-9
- [V42] https://example.com/source-42

Trailing footer content that must also be removed.
