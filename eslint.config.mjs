import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ['next-env.d.ts', '.next/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      // Phase 1 strictness: surface issues as warnings first, then promote to errors.
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      curly: ['warn', 'all'],
      eqeqeq: ['warn', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-var': 'warn',
      'object-shorthand': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/__tests__/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/lib/observability/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    },
  },
];

export default eslintConfig;
