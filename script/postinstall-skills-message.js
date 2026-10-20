/**
 * Runs after `npm i hyperformula` and prints a short message that points to the SKILLS file for AI assistants.
 *
 * The message is cosmetic, so the script never fails: an error here must not break the installation.
 */
const path = require('path')

const PRODUCT_NAME = 'HyperFormula'
const SKILLS_URL = 'https://handsontable.com/docs/javascript-data-grid/skills-for-claude-code/'
const HYPERLINK_TERMINALS = ['iTerm.app', 'vscode', 'WezTerm', 'ghostty', 'WarpTerminal']

/**
 * Tells whether the output can show colors. Colors are off when `NO_COLOR` is set or the output is not a TTY.
 *
 * @returns {boolean}
 */
function supportsColor() {
  return Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
}

/**
 * Tells whether the terminal can show clickable links (OSC 8 hyperlinks).
 *
 * @returns {boolean}
 */
function supportsHyperlinks() {
  if (!process.stdout.isTTY) {
    return false
  }

  const { TERM_PROGRAM, VTE_VERSION, WT_SESSION } = process.env

  return HYPERLINK_TERMINALS.includes(TERM_PROGRAM) || Number(VTE_VERSION) >= 5000 || Boolean(WT_SESSION)
}

/**
 * Wraps the text in an ANSI style, or returns it unchanged when colors are off.
 *
 * @param {string} code - ANSI SGR code, e.g. `1` for bold
 * @param {string} text - text to style
 * @returns {string}
 */
function paint(code, text) {
  return supportsColor() ? `\x1b[${code}m${text}\x1b[0m` : text
}

/**
 * Renders the link to the skills page. Terminals without clickable links get the text followed by the full URL,
 * so the URL is not lost.
 *
 * @param {string} text - the clickable text
 * @returns {string}
 */
function renderSkillsLink(text) {
  if (supportsHyperlinks()) {
    return `\x1b]8;;${SKILLS_URL}\x1b\\${paint('4;36', text)}\x1b]8;;\x1b\\`
  }

  return `${text} ${paint('4;36', SKILLS_URL)}`
}

/**
 * Tells whether `npm install` was started inside this package's own folder (a HyperFormula developer or CI),
 * as opposed to a user installing the package into their own project. npm sets `INIT_CWD` to the folder
 * where the install command was run.
 *
 * @returns {boolean}
 */
function isInstalledInsideOwnRepo() {
  return Boolean(process.env.INIT_CWD) && path.resolve(process.env.INIT_CWD) === path.resolve(__dirname, '..')
}

/**
 * Prints the message with the name and the version of the package being installed.
 */
function printSkillsMessage() {
  if (isInstalledInsideOwnRepo()) {
    return
  }

  const { version } = require(path.join(__dirname, '..', 'package.json'))

  console.log(`${paint('38;5;208', '▲')} ${paint('1', PRODUCT_NAME)} ${paint('2', version)}`)
  console.log(`  AI assistants can use our ${renderSkillsLink('SKILLS file')}`)
}

try {
  printSkillsMessage()
} catch (error) {
  // Intentionally ignored: see the file description.
}
