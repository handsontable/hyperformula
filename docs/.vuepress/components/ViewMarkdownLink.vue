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
// clears the navbar with margins *inside* the content block only). Clear the
// navbar explicitly and mirror the content wrapper's `$wrapper` geometry so
// the link lines up with the article column.
.view-markdown-link
  max-width $contentWidth
  margin 0 auto
  padding ($navbarHeight + 1.2rem) 2.5rem 0
  font-size 0.85rem

  a
    color $accentColor
    text-decoration none

    &:hover
      text-decoration underline

@media (max-width: $MQNarrow)
  .view-markdown-link
    padding ($navbarHeight + 1.2rem) 2rem 0

@media (max-width: $MQMobileNarrow)
  .view-markdown-link
    padding ($navbarHeight + 1.2rem) 1.5rem 0
</style>
