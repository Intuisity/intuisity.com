const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.maxWorkers = 1;
// Expo 54's default config still includes this disabled experimental option,
// while the installed Metro validator no longer accepts the key.
delete config.watcher.unstable_workerThreads;

module.exports = config;
