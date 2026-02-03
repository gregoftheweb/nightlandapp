module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
     [
  'module-resolver',
  {
    alias: {
      '@': './',
      '@assets': './assets',
    },
    extensions: [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.json',
      '.png',
      '.webp'
    ],
  },
]

    ],
  }
}
