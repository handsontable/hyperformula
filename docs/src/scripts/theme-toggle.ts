/**
 * Sun/moon theme toggle wiring. Bound by ThemeSelect.astro, which renders the
 * `[data-hf-theme-toggle]` button. Writes to Starlight's `starlight-theme`
 * localStorage key so the choice persists across page loads.
 */
const STORAGE_KEY = 'starlight-theme';
const root = document.documentElement;

function currentTheme(): 'light' | 'dark' {
  return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function setTheme(next: 'light' | 'dark'): void {
  root.setAttribute('data-theme', next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode etc. */
  }
}

function wire(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-hf-theme-toggle]').forEach((btn) => {
    if (btn.dataset.hfBound === 'true') return;
    btn.dataset.hfBound = 'true';
    btn.addEventListener('click', () => {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wire);
} else {
  wire();
}
