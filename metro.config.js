// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This disables the strict package exports check
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
