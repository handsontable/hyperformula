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
      return this.copied ? 'Copied!' : 'Copy Markdown link';
    },
  },
  methods: {
    copy() {
      const absolute = window.location.origin + this.mdUrl;
      const fallback = (text) => {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        try { document.execCommand('copy'); } finally { document.body.removeChild(el); }
      };
      const done = () => { this.copied = true; setTimeout(() => { this.copied = false; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(absolute).then(done).catch(() => { fallback(absolute); done(); });
      } else {
        fallback(absolute);
        done();
      }
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
