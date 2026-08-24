const staticConfig = require("./app.json").expo;
const googleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_KEY;

module.exports = ({ config }) => ({
  ...config,
  ...staticConfig,
  android: {
    ...staticConfig.android,
    config: {
      ...staticConfig.android.config,
      googleMaps: {
        ...staticConfig.android.config.googleMaps,
        apiKey: googleMapsApiKey || "",
      },
    },
  },
  plugins: [
    ...staticConfig.plugins,
    ["./plugins/withGoogleMapsApiKey", { apiKey: googleMapsApiKey || "" }],
  ],
});
