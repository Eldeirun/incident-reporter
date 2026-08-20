const staticConfig = require("./app.json").expo;

module.exports = ({ config }) => ({
  ...config,
  ...staticConfig,
  android: {
    ...staticConfig.android,
    config: {
      ...staticConfig.android.config,
      googleMaps: {
        ...staticConfig.android.config.googleMaps,
        apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY || "",
      },
    },
  },
});
