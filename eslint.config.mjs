import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'next-env.d.ts'],
  },
  {
    rules: {
      // R3F mutates three.js objects inside useFrame by design.
      'react-hooks/immutability': 'off',
    },
  },
];

export default config;
