const debug = require('debug')('yirga:babel');

debug('using %o', 'tools-locale-config');
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-typescript'],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: { version: 3, proposals: true },
        version: '^7.11.2',
        useESModules: true,
        regenerator: true,
      },
    ],
  ],
};
