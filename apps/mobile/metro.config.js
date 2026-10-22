const { getDefaultConfig } = require('expo/metro-config');

// Expo gère automatiquement les monorepos (watchFolders, nodeModulesPaths).
// Aucun contournement n'est nécessaire tant qu'une seule version de react-native est installée.
const config = getDefaultConfig(__dirname);

module.exports = config;
