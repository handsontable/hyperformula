module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    "rules": {
        // Automatic fixers
        "@typescript-eslint/member-delimiter-style": ["error", {
            multiline: {
                delimiter: "comma",
            },
            singleline: {
                delimiter: "comma",
            },
        }],
        "@typescript-eslint/semi": ["error", "never"],
        "@typescript-eslint/brace-style": "error", // wtf
        "@typescript-eslint/indent": ["error", 2],
        "@typescript-eslint/no-unnecessary-boolean-literal-compare": ["error"],
        "@typescript-eslint/no-extra-non-null-assertion": ["error"],
        "@typescript-eslint/array-type": ["error"],

        // Extensions (superseded by other rules)
        "semi": "off", // superseded by @typescript-eslint/semi
        "semi-style": "off", // superseded by @typescript-eslint/semi
        "brace-style": "off", // superseded by @typescript-eslint/brace-style
        "indent": "off", // superseded by @typescript-eslint/indent
        "@typescript-eslint/comma-spacing": ["error"],
        "comma-spacing": "off", // superseded by @typescript-eslint/comma-spacing
        "@typescript-eslint/func-call-spacing": ["error"],
        "func-call-spacing": "off", // superseded by @typescript-eslint/func-call-spacing
        "@typescript-eslint/no-extra-semi": ["error"],
        "no-extra-semi": "off", // superseded by @typescript-eslint/no-extra-semi
        "@typescript-eslint/quotes": ["error", "single", { avoidEscape: true }],
        "quotes": "off", // superseded by @typescript-eslint/quotes
        "@typescript-eslint/space-before-function-paren": ["error", "never"],
        "space-before-function-paren": "off", // superseded by @typescript-eslint/space-before-function-paren

        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/ban-types": "off",
        "no-prototype-builtins": "off",

        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-namespace": "off",
        "no-useless-escape": "off",
        "no-inner-declarations": "off",

        // warn
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/prefer-regexp-exec": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",

        // error
        "@typescript-eslint/interface-name-prefix": "off",

        "@typescript-eslint/camelcase": "error",
    }
};
