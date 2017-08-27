module.exports = {
    "extends": "../.eslintrc.js",
    /**
     * ESLint rules
     *
     * All available rules: http://eslint.org/docs/rules/
     *
     * Rules take the following form:
     *   "rule-name", [severity, { opts }]
     * Severity: 2 == error, 1 == warning, 0 == off.
     */
    "rules": {
        "indent": [2, 2, { "SwitchCase": 1, "CallExpression": {"arguments": 2}, "MemberExpression": 2, "outerIIFEBody": 0 }],
        "strict": [2, "global"],
    }
};
