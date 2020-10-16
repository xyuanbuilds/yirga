const path = require('path');

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    // https://www.npmjs.com/package/@storybook/addon-essentials
    '@storybook/addon-essentials',
    '@storybook/preset-ant-design',
  ],
  webpackFinal: async (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    // Make whatever fine-grained changes you need
    const lessRuleIndex = config.module.rules.findIndex(
      (i) => String(i.test) === String(/\.less$/),
    );
    config.module.rules[lessRuleIndex] = {
      test: /\.less$/,
      oneOf: [
        {
          use: [
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[local]___[hash:base64:5]',
                },
              },
            },
            {
              loader: 'less-loader',
              options: { javascriptEnabled: true },
            },
          ],
          include: [path.join(__dirname, '../src/')],
          exclude: [path.join(__dirname, '../node_modules')],
        },
        {
          use: [
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
            },
            {
              loader: 'less-loader',
              options: { javascriptEnabled: true },
            },
          ],
        },
      ],
    };

    // Return the altered config
    return config;
  },
};
