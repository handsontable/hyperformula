<template>
  <p v-if="mdUrl" class="view-markdown-link">
    <a :href="mdUrl">View as Markdown</a>
  </p>
</template>

<script>
export default {
  name: 'ViewMarkdownLink',
  computed: {
    mdUrl() {
      const p = this.$page && this.$page.path;
      // The 404 page is excluded from companion generation — no link there.
      if (!p || p === '/404.html') return null;
      // `.html` page → sibling `.md`; directory / landing URL (`/`, `/guide/`)
      // → its `index.md` companion. Both are emitted by the md-companions plugin,
      // so the link is available on every generated page.
      if (/\.html$/.test(p)) return this.$withBase(p.replace(/\.html$/, '.md'));
      if (p.endsWith('/')) return this.$withBase(`${p}index.md`);
      return null;
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../styles/palette.styl'

// Rendered in the `page-top` slot, this sits above `.theme-default-content`
// at the very top of `main.page` — a zone the fixed navbar covers (the theme
// clears the navbar only *inside* the content block, via the first heading's
// top padding). Mirror the content wrapper's `$wrapper` geometry but take no
// flow height: the link floats right-aligned inside the title's transparent
// navbar-clearance padding, just above the page title, without pushing the
// article down. `z-index` keeps it clickable above the heading's padding box.
.view-markdown-link
  position relative
  z-index 1
  max-width $contentWidth
  height 0
  margin 0 auto
  padding 0 2.5rem
  font-size 0.85rem

  a
    position absolute
    top ($navbarHeight + 0.2rem)
    right 2.5rem
    line-height 1.4
    color $accentColor
    text-decoration none

    &:hover
      text-decoration underline

// Keep the wrapper's paddings (and the anchor's `right` offset, resolved
// against the wrapper's padding box) in lockstep with `$wrapper`'s responsive
// paddings, so the link tracks the article text's right edge at every width.
@media (max-width: $MQNarrow)
  .view-markdown-link
    padding 0 2rem

    a
      right 2rem

@media (max-width: $MQMobileNarrow)
  .view-markdown-link
    padding 0 1.5rem

    a
      right 1.5rem
</style>
