const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };
  
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  config.watchFolders = [
    path.resolve(__dirname, '../..'),
  ];

  config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../../node_modules'),
  ];

  config.resolver.extraNodeModules = {
    '@gaia/shared': path.resolve(__dirname, '../../packages/shared/src'),
  };

  config.resolver.assetExts.push('glb', 'gltf');

  return config;
})();
