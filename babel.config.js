module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ⭐️ Reanimatedプラグインは必ずこの配列の末尾に追加してください ⭐️
      'react-native-reanimated/plugin',
    ],
  };
};