/**
 * A glyph the editor renders: the popup close button (`close`), the function-help "Learn more"
 * link (`externalLink`), the named-expression marker in suggestions (`namedExpression`), and
 * the formula bar's fx icon (`function`).
 *
 * @category Theming
 */
export type IconName = "close" | "externalLink" | "namedExpression" | "function";

/**
 * Host factories that replace the built-in glyphs, keyed by {@link IconName}. A factory is
 * called once per rendered icon and must return a new element each time. An icon left out
 * keeps its built-in SVG.
 *
 * @category Theming
 */
export type IconsOptions = Partial<Record<IconName, () => Element>>;
