const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const path = require("path");

const config = getSentryExpoConfig(__dirname);

// react-native-sortables ships both a prebuilt `dist` and its TS `src`, and its
// package.json `react-native` field points at `src/index`. Letting Metro consume
// the TS source from node_modules is brittle (it intermittently fails to resolve
// `src/index`). Pin the package to its prebuilt ESM build instead.
const sortablesEntry = path.resolve(
  __dirname,
  "node_modules/react-native-sortables/dist/module/index.js"
);
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-sortables") {
    return { type: "sourceFile", filePath: sortablesEntry };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
