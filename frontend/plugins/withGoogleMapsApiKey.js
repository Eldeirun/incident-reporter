const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withGoogleMapsApiKey(config, { apiKey }) {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (!application) return modConfig;

    application["meta-data"] = application["meta-data"] || [];
    const metadata = application["meta-data"];
    const existing = metadata.find(
      (item) => item.$?.["android:name"] === "com.google.android.geo.API_KEY",
    );

    if (existing) {
      existing.$["android:value"] = apiKey;
    } else {
      metadata.push({
        $: {
          "android:name": "com.google.android.geo.API_KEY",
          "android:value": apiKey,
        },
      });
    }

    return modConfig;
  });
};
