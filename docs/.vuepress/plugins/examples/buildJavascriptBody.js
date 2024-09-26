const buildJavascriptBody = ({ id, html, js, css, hyperformulaVersion, lang }) => {
  return {
    files: {
      'package.json': {
        content: `{
  "name": "hyperformula-demo",
  "version": "1.0.0",
  "description": "",
  "dependencies": {
    "hyperformula": "${hyperformulaVersion}"
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

module.exports = { buildJavascriptBody };
