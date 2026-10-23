import { TokenType } from "../lexer/tokens";

const PREFIX = "hfe";

/**
 * The `hfe-` BEM class-name table shared by core, adapters, and consumer CSS overrides.
 *
 * @category Theming
 */
export const CN = {
  editor: `${PREFIX}-editor`,
  editorFocused: `${PREFIX}-editor--focused`,
  editorFormula: `${PREFIX}-editor--formula`,
  editorHeightCapped: `${PREFIX}-editor--height-capped`,
  editorInput: `${PREFIX}-editor__input`,
  editorLayers: `${PREFIX}-editor__layers`,
  formulaBar: `${PREFIX}-formula-bar`,
  formulaBarBody: `${PREFIX}-formula-bar__body`,
  formulaBarOverlay: `${PREFIX}-formula-bar__overlay`,
  formulaBarCell: `${PREFIX}-formula-bar__cell`,
  formulaBarCellAddress: `${PREFIX}-formula-bar__cell--address`,
  formulaBarCellFormula: `${PREFIX}-formula-bar__cell--formula`,
  formulaBarAddressInput: `${PREFIX}-formula-bar__address-input`,
  formulaBarFxIcon: `${PREFIX}-formula-bar__fx-icon`,
  formulaBarIdle: `${PREFIX}-formula-bar__idle`,

  highlight: `${PREFIX}-highlight`,
  highlightItem: `${PREFIX}-highlight__item`,

  overlay: `${PREFIX}-overlay`,

  token: `${PREFIX}-token`,
  tokenCommentErr: `${PREFIX}-token--comment-err`,
  tokenParenErr: `${PREFIX}-token--paren-err`,
  tokenFnUnknown: `${PREFIX}-token--fn-unknown`,
  parenMatch: `${PREFIX}-token--paren-match`,
  dim: `${PREFIX}-token--dim`,
  argActive: `${PREFIX}-token--arg-active`,

  refMark: `${PREFIX}-ref-mark`,
  refMarkNamed: `${PREFIX}-ref-mark--named`,
  tokenRefInvalid: `${PREFIX}-token--ref-invalid`,
  tokenSheet: `${PREFIX}-token--sheet`,

  popup: `${PREFIX}-popup`,
  popupClose: `${PREFIX}-popup__close`,
  popupHosted: `${PREFIX}-popup--hosted`,

  suggestions: `${PREFIX}-suggestions`,
  suggestionsItem: `${PREFIX}-suggestions__item`,
  suggestionsItemActive: `${PREFIX}-suggestions__item--active`,
  suggestionsItemLabel: `${PREFIX}-suggestions__item-label`,
  suggestionsMatch: `${PREFIX}-suggestions__match`,
  suggestionsItemDescription: `${PREFIX}-suggestions__item-description`,
  suggestionsItemNamed: `${PREFIX}-suggestions__item--named`,
  suggestionsList: `${PREFIX}-suggestions__list`,
  suggestionsKbdRow: `${PREFIX}-suggestions__kbd-row`,
  suggestionsKbdChip: `${PREFIX}-suggestions__kbd-chip`,
  fnHelp: `${PREFIX}-fn-help`,
  fnHelpBody: `${PREFIX}-fn-help__body`,
  fnHelpSignature: `${PREFIX}-fn-help__signature`,
  fnHelpName: `${PREFIX}-fn-help__name`,
  fnHelpArg: `${PREFIX}-fn-help__arg`,
  fnHelpArgActive: `${PREFIX}-fn-help__arg--active`,
  fnHelpSection: `${PREFIX}-fn-help__section`,
  fnHelpSectionLabel: `${PREFIX}-fn-help__section-label`,
  fnHelpExample: `${PREFIX}-fn-help__example`,
  fnHelpAbout: `${PREFIX}-fn-help__about`,
  fnHelpParamName: `${PREFIX}-fn-help__param-name`,
  fnHelpParamNameActive: `${PREFIX}-fn-help__param-name--active`,
  fnHelpParamDesc: `${PREFIX}-fn-help__param-desc`,
  fnHelpSeparator: `${PREFIX}-fn-help__separator`,
  fnHelpLearnMore: `${PREFIX}-fn-help__learn-more`,

  errorPopup: `${PREFIX}-error`,
  errorPopupTitle: `${PREFIX}-error__title`,
  errorPopupMessage: `${PREFIX}-error__message`,
  cellError: `${PREFIX}-cell--error`,

  popupPortal: `${PREFIX}-popup-portal`,
  liveRegion: `${PREFIX}-live-region`,
} as const;

export const TOKEN_CN: Record<TokenType, string> = {
  [TokenType.FUNCTION]: `${PREFIX}-token--fn`,
  [TokenType.CELL_REF]: `${PREFIX}-token--ref`,
  [TokenType.RANGE_REF]: `${PREFIX}-token--range`,
  [TokenType.NUMBER]: `${PREFIX}-token--num`,
  [TokenType.STRING]: `${PREFIX}-token--str`,
  [TokenType.OPERATOR]: `${PREFIX}-token--op`,
  [TokenType.LPAREN]: `${PREFIX}-token--paren`,
  [TokenType.RPAREN]: `${PREFIX}-token--paren`,
  [TokenType.LBRACE]: `${PREFIX}-token--bracket`,
  [TokenType.RBRACE]: `${PREFIX}-token--bracket`,
  [TokenType.COMMA]: `${PREFIX}-token--sep`,
  [TokenType.SEMICOLON]: `${PREFIX}-token--sep`,
  [TokenType.WHITESPACE]: `${PREFIX}-token--ws`,
  [TokenType.IDENT]: `${PREFIX}-token--ident`,
  [TokenType.COMMENT]: `${PREFIX}-token--comment`,
  [TokenType.NAMED_EXPR]: `${PREFIX}-token--named`,
  [TokenType.ERROR_LITERAL]: `${PREFIX}-token--errlit`,
  [TokenType.ERROR]: `${PREFIX}-token--err`,
};
