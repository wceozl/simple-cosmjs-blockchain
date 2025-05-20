const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "path": require.resolve("path-browserify"),
    "vm": require.resolve("vm-browserify"),
  });
  config.resolve.fallback = fallback;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  // 禁用node_modules中CosmJS包的源码映射加载
  if (config.module && config.module.rules) {
    for (const rule of config.module.rules) {
      if (rule.use && rule.use.some(loader => loader.loader && loader.loader.includes('source-map-loader'))) {
        if (!rule.exclude) {
          rule.exclude = [];
        }
        // 添加CosmJS包路径到排除列表
        rule.exclude.push(/node_modules\/@cosmjs/);
      }
    }
  }

  return config;
};