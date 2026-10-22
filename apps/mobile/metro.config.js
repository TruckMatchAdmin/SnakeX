const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Surveiller la racine du monorepo
config.watchFolders = [monorepoRoot];

// 2. Résolution des modules hoistés
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Redirection explicite des modules internes pour compatibilité Expo 58
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native/asset-registry' || moduleName === 'react-native/Libraries/Image/AssetRegistry') {
    return {
      filePath: path.resolve(monorepoRoot, 'node_modules/react-native/Libraries/Image/AssetRegistry.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react-native/unstable-internals-do-not-use') {
    return {
      filePath: path.resolve(monorepoRoot, 'node_modules/react-native/unstable-internals-do-not-use.js'),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
