const globals = require('globals')
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')

const COMMON_RULES = {
  'no-unused-vars': 'off',
  'no-undef': 'off',
  'no-console': 'off',
  'prefer-const': 'warn',
  'no-var': 'warn',
  'eqeqeq': ['warn', 'always', { null: 'ignore' }],
  'no-prototype-builtins': 'warn',
  'no-path-concat': 'warn',
  'no-throw-literal': 'warn',
  'no-unmodified-loop-condition': 'warn',
  'no-unreachable-loop': 'warn',
  'handle-callback-err': 'warn',
  'no-loss-of-precision': 'warn',
  'no-promise-executor-return': 'warn',
  'no-template-curly-in-string': 'warn',
  'no-useless-backreference': 'warn',
  'no-constant-binary-expression': 'warn',
  'no-new-native-nonconstructor': 'warn',
  'no-self-compare': 'warn',
  'no-unused-private-class-members': 'warn',
  'grouped-accessor-pairs': 'warn',
  'no-constructor-return': 'warn',
}

const TS_RULES = {
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
}

module.exports = [
  {
    ignores: ['frontend/', 'dist/', 'node_modules/', '*.json'],
  },
  {
    files: ['src/backend/**/*.ts', 'api/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: { ...globals.node, ...globals.es2021 },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: { ...COMMON_RULES, ...TS_RULES },
  },
  {
    files: ['src/backend/__tests__/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      globals: { ...globals.node, ...globals.es2021, ...globals.vitest },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: { ...COMMON_RULES, ...TS_RULES },
  },
]
