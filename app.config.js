const fs = require('node:fs');
module.exports = ({ config }) => ({
  ...config,
  android: { ...config.android, ...(fs.existsSync('./google-services.json') ? { googleServicesFile: './google-services.json' } : {}) },
  extra: { ...config.extra, ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } } : {}) },
});
