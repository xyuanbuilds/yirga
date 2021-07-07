/* eslint-disable import/no-extraneous-dependencies */
import { ParserOptions } from '@typescript-eslint/parser';

const parserOptions: ParserOptions = {
  sourceType: 'module',
  project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
  ecmaFeatures: {
    jsx: true,
  },
  ecmaVersion: 2020,
};

const defaultConfig = {
  root: true,
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'airbnb-typescript', // react, ts
    'airbnb/hooks', // hooks
    // https://www.npmjs.com/package/eslint-config-prettier
    'prettier', // 关闭与 prettier 冲突的rules
  ],
  env: {
    es6: true,
    node: true,
  },
  rules: {
    'import/extensions': 0,
    'react/require-default-props': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
      {
        selector: 'objectLiteralProperty',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
      {
        selector: 'variable',
        format: ['PascalCase'],
        filter: {
          regex: 'ontext$',
          match: true,
        },
      },
      {
        selector: 'variable',
        format: ['PascalCase'],
        filter: {
          regex: 'RangePicker',
          match: true,
        },
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase'],
        types: ['function'],
      },
      {
        selector: 'parameter',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allowSingleOrDouble',
        trailingUnderscore: 'allowSingleOrDouble',
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],
    '@typescript-eslint/no-use-before-define': [
      'error',
      { functions: false, classes: true, variables: true, typedefs: true },
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/explicit-member-accessibility': 0,
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
  },
  parserOptions,
  settings: {
    react: {
      version: 'detect',
    },
  },
};

module.exports = defaultConfig;
