import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/config/jest.setup.ts',
    '<rootDir>/__tests__/config/jest.env.setup.ts'
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid|@radix-ui|@ai-sdk|ai|web-streams-polyfill|pretty-bytes|trim-lines|markdown-table|escape-string-regexp|unified|unist-.*|vfile.*|bail|is-plain-obj|trough|remark-.*|mdast-util-.*|micromark.*|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|react-markdown)/)'
  ],
  moduleDirectories: ['node_modules', '<rootDir>'],
};

export default createJestConfig(config); 