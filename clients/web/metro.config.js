const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);


config.watchFolders = [
  path.resolve(__dirname, '../..'),
];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];

config.resolver.extraNodeModules = {
  '@gaia/shared': path.resolve(__dirname, '../../packages/shared/src'),
  '@': path.resolve(__dirname, 'src'),
};

config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;
