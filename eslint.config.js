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
      // The SDK 57 preset enables React Compiler compatibility checks. The app
      // does not enable the compiler yet, so keep these as a separate migration.
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
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
