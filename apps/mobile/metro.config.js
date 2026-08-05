const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@milerecover/domain': path.resolve(workspaceRoot, 'packages/domain/src'),
      '@milerecover/config': path.resolve(workspaceRoot, 'packages/config/src'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
