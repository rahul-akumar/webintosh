// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Warn on console usage (except warn/error)
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // Discourage use of 'any' type
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Require explicit return types on exported functions
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    
    // Allow unused vars prefixed with _
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    
    // Vue-specific rules
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
  }
})
