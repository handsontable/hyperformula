/**
 * `<hf-coding-agent-wizard>`: asks which coding agent the reader uses and shows the matching setup snippet, with a
 * copy button. Used on the "Set up your coding agent" guide page.
 */
import { copyToClipboard } from './clipboard.mjs';

const OPTIONS = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    snippet: '/plugin marketplace add handsontable/handsontable-skills\n/plugin install handsontable-skills@handsontable-skills',
    note: 'Installs the official <code>hyperformula</code> skill. Claude Code loads it automatically.',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    snippet: 'Add to .cursor/mcp.json:\n{\n  "mcpServers": {\n    "handsontable-docs": { "url": "https://docs-assistant.handsontable.com/mcp" }\n  }\n}',
    note: 'Connects Cursor to the first-party docs MCP server (docs guides, API reference, code recipes, release notes, blog posts, and GitHub issues). Alternatively, point a rules file at the full docs corpus: <code>https://handsontable.com/docs/hyperformula/llms-full.txt</code>.',
  },
  {
    id: 'copilot',
    label: 'GitHub Copilot',
    snippet: 'Add to .github/copilot-instructions.md:\nReference HyperFormula docs: https://handsontable.com/docs/hyperformula/llms-full.txt',
    note: 'Copilot reads an instructions file — link it to the corpus so it fetches authoritative docs.',
  },
  {
    id: 'other',
    label: 'Other / API',
    snippet: 'curl -s https://handsontable.com/docs/hyperformula/llms-full.txt',
    note: 'Fetch the full corpus, upload the skill folder from <code>handsontable/handsontable-skills</code> to the Claude API, or connect any MCP-capable agent to <code>https://docs-assistant.handsontable.com/mcp</code>.',
  },
];

class CodingAgentWizard extends HTMLElement {
  connectedCallback() {
    this.classList.add('not-content');
    this.showChoices();
  }

  showChoices() {
    this.replaceChildren(
      Object.assign(document.createElement('p'), { className: 'hf-agent-wizard__prompt', textContent: 'Which coding agent do you use?' }),
      ...OPTIONS.map((option) => this.button(option.label, 'hf-agent-wizard__choice', () => this.showResult(option))),
    );
  }

  showResult(option) {
    const snippet = document.createElement('pre');
    const note = document.createElement('p');
    const copy = this.button('Copy', 'hf-agent-wizard__copy', () => {
      copyToClipboard(option.snippet).then(() => {
        copy.textContent = 'Copied!';
        setTimeout(() => { copy.textContent = 'Copy'; }, 1500);
      });
    });

    snippet.className = 'hf-agent-wizard__snippet';
    snippet.appendChild(document.createElement('code')).textContent = option.snippet;
    note.className = 'hf-agent-wizard__note';
    // The notes are the fixed strings above, not user input.
    note.innerHTML = option.note;

    this.replaceChildren(
      this.button('← Change', 'hf-agent-wizard__back', () => this.showChoices()),
      Object.assign(document.createElement('h3'), { textContent: option.label }),
      snippet,
      copy,
      note,
    );
  }

  button(label, className, onClick) {
    const button = Object.assign(document.createElement('button'), { type: 'button', className, textContent: label });

    button.addEventListener('click', onClick);

    return button;
  }
}

customElements.define('hf-coding-agent-wizard', CodingAgentWizard);
