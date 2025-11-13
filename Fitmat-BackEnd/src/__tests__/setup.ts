// Test setup file
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
const envPath = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: envPath });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Use TEST_DATABASE_URL if available, otherwise fall back to DATABASE_URL
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Validate DATABASE_URL for tests
if (!process.env.DATABASE_URL) {
  console.warn(
    '\n⚠️  WARNING: DATABASE_URL is not set for tests!\n' +
    '   Create a .env.test file with DATABASE_URL.\n' +
    '   See .env.test.example for reference.\n' +
    '   Tests that require database will fail.\n'
  );
} else if (!process.env.DATABASE_URL.startsWith('mysql://')) {
  console.warn(
    `\n⚠️  WARNING: DATABASE_URL format may be incorrect!\n` +
    `   Expected: mysql://user:password@host:port/database\n` +
    `   Got: ${process.env.DATABASE_URL.substring(0, 50)}...\n`
  );
}

