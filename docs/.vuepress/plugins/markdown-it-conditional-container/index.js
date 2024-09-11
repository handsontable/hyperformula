const chalk = require('chalk');

/* eslint-disable */
/**
 * Container used to display blocks of content only for to specific frameworks.
 *
 * Usage:
 * ```
 * ::: only-for react
 * Content to be displayed only for React documentation.
 * :::
 *
 * ::: only-for javascript react vue
 * Content to be displayed only for JS, React and Vue documentation.
 * :::
 * ```
 */
module.exports = function conditionalContainer(markdown) {
  const openAndCloseTagOneliner = /::: only-for (((react|javascript) ?)+)(.*?):::$/ms; // It is multi line text.
  const openTokenContent = /(?:\n?)::: only-for (((react|javascript) ?)+)\n?/;
  const fullMatchOpenToken = /^(?:\n?)::: only-for (((react|javascript) ?)+)\n?$/;
  const closeTokenContent = /(?:\n?):::(?:\n?)$/;
  const fullMatchCloseToken = /^(?:\n?):::(?:\n?)$/;
  const markupForCustomContainer = ':::';
  const newLineTokenType = 'softbreak';
  const capturedGroupIndex = 1;
  let endIndex;

  const removeValueAndNewLine = ({ token, regexp, env }) => {
    // Removing value from token's content.
    token.content = token.content.replace(regexp, '');

    // Some tokens may not have children. Children are component parts of the displayed text in most cases.
    if (token.children === null) {
      return;
    }

    let childrenIndex = token.children.findIndex(childrenToken => regexp.test(childrenToken.content));

    // Some tokens contains children which also represents the removed value (and they are displayed in the output file).
    if (childrenIndex !== -1) {
      const nextElement = token.children[childrenIndex + 1];
      const previousElement = token.children[childrenIndex - 1];
      let howMany = 1;

      if (childrenIndex > 0 && previousElement.type === newLineTokenType) {
        childrenIndex -= 1;
        howMany += 1;
      }

      if (nextElement?.type === newLineTokenType) {
        howMany += 1;
      }

      token.children.splice(childrenIndex, howMany);
    } else {
      // eslint-disable-next-line no-console
      console.error(`${chalk.red('\nUnexpected error while processing a conditional container (::: only-for) in the file '
        `"${env.relativePath}".` +
        ` Please check the file or the resulting page "${env.frontmatter.permalink}".`
      )}`);
    }
  };

  const cleanTokens = ({ tokens, token, tokenIndex, preciseRegexp, lessPreciseRegexp, env }) => {
    if (preciseRegexp.test(token.content)) {
      tokens.splice(tokenIndex, 1);

    } else {
      removeValueAndNewLine({ token, regexp: lessPreciseRegexp, env });
    }
  };

  const findAndRemove = (state) => {
    const relativePath = state.env?.relativePath; // Sometimes the `env` key is an empty object.

    if (relativePath === void 0) {
      return;
    }

    const env = state.env;

    for (let index = state.tokens.length - 1; index >= 0; index -= 1) {
      const token = state.tokens[index];
      // We don't create custom container intentionally. It can create paragraphs or break listed elements.
      const isNotNativeContainer = token.markup !== markupForCustomContainer;

      if (isNotNativeContainer) {
        if (openAndCloseTagOneliner.test(token.content)) {
          const onlyForFrameworks = openAndCloseTagOneliner.exec(token.content)[capturedGroupIndex].split(' ');

          removeValueAndNewLine({ token, regexp: openTokenContent, env });
          removeValueAndNewLine({ token, regexp: closeTokenContent, env });
        } else if (closeTokenContent.test(token.content)) {

          endIndex = index;
        } else if (openTokenContent.test(token.content)) {
          const onlyForFrameworks = openTokenContent.exec(token.content)[capturedGroupIndex].split(' ');

          if (endIndex === void 0) {
            console.error(`${chalk.red('\nUnexpected error while processing a conditional container (::: only-for)' +
              ` in the file "${getNormalizedPath(env.relativePath)}". It seems that the opening token (::: only-for)` +
              ' exists, but the ending token (:::) does not.'
            )}`);
          }

          cleanTokens({ tokens: state.tokens, token: state.tokens[endIndex], tokenIndex: endIndex, lessPreciseRegexp: closeTokenContent, preciseRegexp: fullMatchCloseToken, env  });
          cleanTokens({ tokens: state.tokens, token, tokenIndex: index, lessPreciseRegexp: openTokenContent, preciseRegexp: fullMatchOpenToken, env });
        }
      }
    }
  };

  markdown.core.ruler.push('conditional_container', findAndRemove);
};
