/**
 * Mounts the interactive HyperFormula demos.
 *
 * The content preprocessor injects each demo's HTML into a
 * `.hf-example__preview[data-example-js]` container. The runnable example module
 * lives under `docs/examples/**` and is resolved at build time via Vite's
 * `import.meta.glob`. Importing the module executes its top-level code, which
 * wires up the injected DOM.
 *
 * Each demo runs in isolation (try/catch) so one broken example never blocks the
 * rest of the page.
 */
const modules = import.meta.glob('/examples/**/*.js');

function runExamples(): void {
  const containers = document.querySelectorAll<HTMLElement>('.hf-example__preview[data-example-js]');

  containers.forEach((el) => {
    const path = el.dataset.exampleJs;

    if (!path) return;

    const loader = modules[path];

    if (!loader) {
      // eslint-disable-next-line no-console
      console.warn(`[example-runner] no module found for ${path}`);
      return;
    }

    el.classList.add('is-loading');

    Promise.resolve(loader())
      .then(() => el.classList.remove('is-loading'))
      .catch((err) => {
        el.classList.remove('is-loading');
        // eslint-disable-next-line no-console
        console.error(`[example-runner] failed to run ${path}`, err);
      });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runExamples);
} else {
  runExamples();
}
