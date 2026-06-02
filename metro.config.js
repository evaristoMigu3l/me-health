// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(process.cwd());

config.resolver.assetExts.push('ogg', 'mp3');

module.exports = config;
