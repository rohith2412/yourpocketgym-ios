module.exports = {
  dependencies: {
    // react-native-iap v12 depends on RCT-Folly which doesn't exist in RN 0.73+
    // The app uses mock/stub mode so native linking is not needed
    'react-native-iap': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
};
