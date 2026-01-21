// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// This disables the strict package exports check
config.resolver.unstable_enablePackageExports = false;

// Configure path aliases for Metro's module resolution
// This is needed for Metro to resolve require() calls with @/ prefix for assets
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, '.'),
  '@assets': path.resolve(__dirname, 'assets'),
};

module.exports = config;
