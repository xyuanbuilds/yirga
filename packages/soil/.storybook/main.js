const path = require('path');

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    // https://www.npmjs.com/package/@storybook/addon-essentials
    '@storybook/addon-essentials',
    // {
    //   name: "@storybook/preset-typescript",
    //   options: {
    //     tsLoaderOptions: {
    //       configFile: path.resolve(__dirname, "./tsconfig.json"),
    //     },
    //     include: [path.resolve(__dirname, "../src/components")],
    //   },
    // },
    '@storybook/preset-ant-design',
  ],
};
