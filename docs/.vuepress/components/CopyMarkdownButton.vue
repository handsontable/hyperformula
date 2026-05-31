<template>
  <button
    v-if="mdUrl"
    class="copy-md-button"
    type="button"
    :title="'Copy this page as Markdown URL for LLMs'"
    @click="copy"
  >{{ label }}</button>
</template>

<script>
export default {
  name: 'CopyMarkdownButton',
  data() {
    return { copied: false };
  },
  computed: {
    mdUrl() {
      const p = this.$page && this.$page.path;
      if (!p || !/\.html$/.test(p)) return null;
      return this.$withBase(p.replace(/\.html$/, '.md'));
    },
    label() {
      return this.copied ? 'Copied!' : 'Copy Markdown';
    },
  },
  methods: {
    copy() {
      const absolute = window.location.origin + this.mdUrl;
      navigator.clipboard.writeText(absolute).then(() => {
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 1500);
      });
    },
  },
};
</script>

<style scoped>
.copy-md-button {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  border: 1px solid #3eaf7c;
  border-radius: 4px;
  background: #fff;
  color: #3eaf7c;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}
.copy-md-button:hover { background: #3eaf7c; color: #fff; }
</style>
