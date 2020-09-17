const debug = require('debug')('yirga:babel');

const esBuild = process.env.ENV_MODULE === 'es';

debug('using %o', 'tools-locale-config');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: esBuild ? false : 'cjs',
        targets: {
          esmodules: esBuild,
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: { version: 3, proposals: true },
        version: '^7.11.2',
        useESModules: esBuild,
        regenerator: true,
      },
    ],
  ],
};
