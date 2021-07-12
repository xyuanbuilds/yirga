require('@rushstack/eslint-patch/modern-module-resolution');
const path = require('path');
const fs = require('fs');

const isDirectory = (source) => fs.lstatSync(source).isDirectory();
const getDirectories = (source) =>
  fs
    .readdirSync(source)
    .map((name) => path.resolve(source, name))
    .filter(isDirectory);

module.exports = {
  extends: [require.resolve('./packages/prelints/lib/eslint')],
  parserOptions: {
    // sourceType: 'module',
    project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
    warnOnUnsupportedTypeScriptVersion: false,
  },
  env: {
    es6: true,
    node: true,
  },
  globals: {
    document: true,
    localStorage: true,
    window: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'arrow-body-style': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/prop-types': 'off',
    'react/jsx-filename-extension': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        packageDir: [
          __dirname,
          path.resolve(__dirname, 'node_modules/antd'),
          ...getDirectories(path.resolve(__dirname, './packages')),
        ],
      },
    ],
    'react/require-default-props': 'off',
    '@typescript-eslint/explicit-module-boundary-types': ['off'],
    '@typescript-eslint/explicit-function-return-type': ['off'],
  },
};
