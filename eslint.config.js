// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/config/*'],
              message: 'Use @config/* instead of @/config/*',
            },
            {
              group: ['@/modules/*'],
              message: 'Use @modules/* instead of @/modules/*',
            },
            {
              group: ['@/components/*'],
              message: 'Use @components/* instead of @/components/*',
            },
            {
              group: ['@/assets/*'],
              message: 'Use @assets/* instead of @/assets/*',
            },
            {
              group: ['@/context/*'],
              message: 'Use @context/* instead of @/context/*',
            },
            {
              group: ['@/hooks/*'],
              message: 'Use @hooks/* instead of @/hooks/*',
            },
          ],
        },
      ],
    },
  },
])
