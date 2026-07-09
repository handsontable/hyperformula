<template>
  <div class="agent-wizard">
    <div v-if="!selected" class="agent-wizard__choices">
      <p class="agent-wizard__prompt">Which coding agent do you use?</p>
      <button
        v-for="opt in options"
        :key="opt.id"
        class="agent-wizard__choice"
        type="button"
        @click="selected = opt.id"
      >{{ opt.label }}</button>
    </div>

    <div v-else class="agent-wizard__result">
      <button class="agent-wizard__back" type="button" @click="reset">&larr; Change</button>
      <h3>{{ current.label }}</h3>
      <pre class="agent-wizard__snippet"><code>{{ current.snippet }}</code></pre>
      <button class="agent-wizard__copy" type="button" @click="copy">{{ copied ? 'Copied!' : 'Copy' }}</button>
      <p class="agent-wizard__note" v-html="current.note"></p>
    </div>
  </div>
</template>

<script>
import { copyToClipboard } from './clipboard';

export default {
  name: 'CodingAgentWizard',
  data() {
    return {
      selected: null,
      copied: false,
      options: [
        {
          id: 'claude-code',
          label: 'Claude Code',
          snippet: '/plugin marketplace add handsontable/handsontable-skills\n/plugin install handsontable-skills@handsontable-skills',
          note: 'Installs the official <code>hyperformula</code> skill. Claude Code loads it automatically.',
        },
        {
          id: 'cursor',
          label: 'Cursor',
          snippet: 'Add to your AGENTS.md / rules file:\nHyperFormula docs (LLM-friendly): https://hyperformula.handsontable.com/docs/llms-full.txt',
          note: 'Cursor has no Claude-skill installer yet — point it at the full docs corpus instead.',
        },
        {
          id: 'copilot',
          label: 'GitHub Copilot',
          snippet: 'Add to .github/copilot-instructions.md:\nReference HyperFormula docs: https://hyperformula.handsontable.com/docs/llms-full.txt',
          note: 'Copilot reads an instructions file — link it to the corpus so it fetches authoritative docs.',
        },
        {
          id: 'other',
          label: 'Other / API',
          snippet: 'curl -s https://hyperformula.handsontable.com/docs/llms-full.txt',
          note: 'Fetch the full corpus, or upload the skill folder from <code>handsontable/handsontable-skills</code> to the Claude API.',
        },
      ],
    };
  },
  computed: {
    current() {
      return this.options.find(o => o.id === this.selected) || null;
    },
  },
  methods: {
    reset() { this.selected = null; this.copied = false; },
    copy() {
      if (!this.current) return;
      copyToClipboard(this.current.snippet).then(() => {
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 1500);
      });
    },
  },
};
</script>

<style scoped>
.agent-wizard { border: 1px solid #eaecef; border-radius: 6px; padding: 1rem 1.25rem; margin: 1.5rem 0; }
.agent-wizard__prompt { font-weight: 600; margin: 0 0 0.75rem; }
.agent-wizard__choice,
.agent-wizard__copy,
.agent-wizard__back {
  cursor: pointer; border: 1px solid #3eaf7c; background: #fff; color: #3eaf7c;
  border-radius: 4px; padding: 0.4rem 0.8rem; margin: 0 0.5rem 0.5rem 0; font-size: 0.9rem;
}
.agent-wizard__choice:hover,
.agent-wizard__copy:hover { background: #3eaf7c; color: #fff; }
.agent-wizard__back { border-color: #ccc; color: #666; }
.agent-wizard__snippet { background: #f6f6f6; padding: 0.75rem; border-radius: 4px; overflow-x: auto; }
.agent-wizard__note { font-size: 0.85rem; color: #666; }
</style>
