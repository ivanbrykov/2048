import auto from 'eslint-config-canonical/auto';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  ...auto,
  // override parserOptions.project for TypeScript files to point to tsconfig.app.json
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json'],
      },
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'public/**', '.git/**'],
    rules: {
      'react/forbid-component-props': 'off',
      'react/prop-types': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
]);
