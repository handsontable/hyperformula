const buildJavascriptBody = ({ id, html, js, css, hyperformulaVersion, lang }) => {
  return {
    files: {
      'package.json': {
        content: `{
  "name": "hyperformula-demo",
  "version": "1.0.0",
  "main": "index.html",
  "dependencies": {
    "hyperformula": "${hyperformulaVersion}",
    "moment": "latest"
  }
}`
      },
      'index.html': {
        content: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HyperFormula demo</title>
  </head>

  <body>
    ${html || `<div id="${id}"></div>`}
  </body>
</html>`
      },
      'styles.css': {
        content: css
      },
      [`index.${lang}`]: {
        content: `import './styles.css'
${js}`
      },
    }
  };
};

const stackblitz = (id, html, js, css, lang) => {
  const hyperformulaVersion = 'latest';
  const body = buildJavascriptBody({ id, html, js, css, hyperformulaVersion, lang });
  const template = lang === 'ts' ? 'typescript' : 'node';

  const projects = body?.files
    ? Object.entries(body?.files).map(([key, value]) => (
      `<textarea class="hidden" name="project[files][${key}]" readOnly v-pre>${value.content}</textarea>`
    )) : [];

  return `
  <form
    class="form-stackblitz-external" 
    action="https://stackblitz.com/run"
    method="post"
    target="_blank"
  >
    ${projects.join('\n')}
    <input type="hidden" name="project[title]" value="hyperformula-demo"/>
    <input type="hidden" name="project[dependencies]" 
      value='{"hyperformula":"${hyperformulaVersion}", "moment": "latest"}'
    />
    <input type="hidden" name="project[template]" value="${template}"/>
    
    <div class="js-stackblitz-link">
      <button type="submit">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
        width="10.43" height="15" preserveAspectRatio="xMidYMid" viewBox="0 0 256 368" class="icon outbound">
          <path fill="currentColor" d="M109.586 217.013H0L200.34 0l-53.926 150.233H256L55.645 367.246l53.927-150.233z"/>
        </svg>
        Open in Stackblitz
      </button>
    </div>
  </form>
  `;
};

module.exports = { stackblitz };
