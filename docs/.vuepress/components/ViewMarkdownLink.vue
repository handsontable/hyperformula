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

.view-markdown-link
  margin 0 0 1rem
  font-size 0.85rem

  a
    color $accentColor
    text-decoration none

    &:hover
      text-decoration underline
</style>
