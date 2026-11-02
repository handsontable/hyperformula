import type { IconName } from "./types";

export interface SvgIcon {
  attributes: Record<string, string>;
  paths: Record<string, string>[];
}

const OUTLINE_16 = {
  width: "16",
  height: "16",
  viewBox: "0 0 16 16",
  fill: "none",
};

const ROUNDED_STROKE = {
  stroke: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

const CLOSE_BUTTON: SvgIcon = {
  attributes: OUTLINE_16,
  paths: [
    {
      d: "M4 4L12 12M12 4L4 12",
      stroke: "currentColor",
      "stroke-width": "1",
      "stroke-linecap": "round",
    },
  ],
};

const EXTERNAL_LINK: SvgIcon = {
  attributes: OUTLINE_16,
  paths: [
    {
      d: "M8.25033 3.99996H4.25033C3.8967 3.99996 3.55756 4.14044 3.30752 4.39048C3.05747 4.64053 2.91699 4.97967 2.91699 5.33329V12C2.91699 12.3536 3.05747 12.6927 3.30752 12.9428C3.55756 13.1928 3.8967 13.3333 4.25033 13.3333H10.917C11.2706 13.3333 11.6098 13.1928 11.8598 12.9428C12.1098 12.6927 12.2503 12.3536 12.2503 12V7.99996M7.58366 8.66663L13.5837 2.66663M13.5837 5.99996V2.66663H10.2503",
      ...ROUNDED_STROKE,
    },
  ],
};

const TABLE_ICON: SvgIcon = {
  attributes: OUTLINE_16,
  paths: [
    {
      d: "M2 6.66667H14M6.66667 2V14M2 3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H12.6667C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333Z",
      ...ROUNDED_STROKE,
    },
  ],
};

const MATH_FUNCTION_ICON: SvgIcon = {
  attributes: {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    "stroke-width": "2",
    "aria-hidden": "true",
    ...ROUNDED_STROKE,
  },
  paths: [
    { d: "M3 19a2 2 0 0 0 2 2c2 0 2 -4 3 -9s1 -9 3 -9a2 2 0 0 1 2 2" },
    { d: "M5 12h6" },
    { d: "M15 12l6 6" },
    { d: "M15 18l6 -6" },
  ],
};

export const BUILT_IN_ICONS: Record<IconName, SvgIcon> = {
  close: CLOSE_BUTTON,
  externalLink: EXTERNAL_LINK,
  namedExpression: TABLE_ICON,
  function: MATH_FUNCTION_ICON,
};
