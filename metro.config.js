const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  // Gradle replaces generated directories while compiling. Watching them can crash Metro on Windows.
  /[/\\]android[/\\](?:build|\.gradle|\.cxx)[/\\].*/,
  /[/\\]android[/\\]app[/\\](?:build|\.cxx)[/\\].*/,
];
module.exports = config;
