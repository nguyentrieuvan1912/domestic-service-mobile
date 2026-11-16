const fs = require('node:fs');
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ||
  (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);

module.exports = ({ config }) => ({
  ...config,
  android: { ...config.android, ...(googleServicesFile ? { googleServicesFile } : {}) },
  extra: { ...config.extra, ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } } : {}) },
});
