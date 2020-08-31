const defaultStylelint = {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  rules: {
    'property-case': null,
    'shorthand-property-no-redundant-values': null,
    'number-leading-zero': 'always',
    'selector-list-comma-newline-after': 'always',
    'no-descending-specificity': null,
    'font-family-no-missing-generic-family-keyword': null,
    'value-keyword-case': null,
  },
};

module.exports = defaultStylelint;
export default defaultStylelint;
