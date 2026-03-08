import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parsePaginationParam } from '../../utils/query.js';
import { validateEnvironment } from '../../utils/validate-env.js';

// ---------------------------------------------------------------------------
// parsePaginationParam
// ---------------------------------------------------------------------------

describe('parsePaginationParam', () => {
  it('[P0] returns parsed integer for a valid numeric string', () => {
    expect(parsePaginationParam('20', 10, 100)).toBe(20);
  });

  it('[P0] returns defaultVal when value is undefined', () => {
    expect(parsePaginationParam(undefined, 10, 100)).toBe(10);
  });

  it('[P0] returns defaultVal when value is NaN string', () => {
    expect(parsePaginationParam('abc', 10, 100)).toBe(10);
  });

  it('[P0] returns defaultVal when value is zero', () => {
    expect(parsePaginationParam('0', 10, 100)).toBe(10);
  });

  it('[P0] returns defaultVal when value is negative', () => {
    expect(parsePaginationParam('-5', 10, 100)).toBe(10);
  });

  it('[P0] clamps to max when parsed value exceeds max', () => {
    expect(parsePaginationParam('500', 10, 100)).toBe(100);
  });

  it('[P0] returns exact max when value equals max', () => {
    expect(parsePaginationParam('100', 10, 100)).toBe(100);
  });

  it('[P1] returns parsed value when it is 1 (boundary)', () => {
    expect(parsePaginationParam('1', 10, 100)).toBe(1);
  });

  it('[P1] treats float strings as truncated integers', () => {
    // parseInt('9.9') === 9
    expect(parsePaginationParam('9.9', 10, 100)).toBe(9);
  });

  it('[P1] works with actual number type (not just strings)', () => {
    expect(parsePaginationParam(50, 10, 100)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// validateEnvironment
// ---------------------------------------------------------------------------

describe('validateEnvironment', () => {
  const saved: Record<string, string | undefined> = {};
  const requiredVars = ['JWT_SECRET', 'S3_BUCKET', 'DYNAMODB_TABLE_NAME'];
  const productionVars = ['DYNAMODB_ENDPOINT', 'S3_ENDPOINT', 'NODE_ENV'];

  beforeEach(() => {
    // Save and set required vars
    [...requiredVars, ...productionVars].forEach((k) => {
      saved[k] = process.env[k];
    });
    process.env.JWT_SECRET = 'test-secret';
    process.env.S3_BUCKET = 'test-bucket';
    process.env.DYNAMODB_TABLE_NAME = 'test-table';
    process.env.NODE_ENV = 'development';
    delete process.env.DYNAMODB_ENDPOINT;
    delete process.env.S3_ENDPOINT;
  });

  afterEach(() => {
    [...requiredVars, ...productionVars].forEach((k) => {
      if (saved[k] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = saved[k];
      }
    });
  });

  it('[P0] passes when all required vars are set', () => {
    expect(() => validateEnvironment()).not.toThrow();
  });

  it('[P0] throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => validateEnvironment()).toThrow(/JWT_SECRET/);
  });

  it('[P0] throws when S3_BUCKET is missing', () => {
    delete process.env.S3_BUCKET;
    expect(() => validateEnvironment()).toThrow(/S3_BUCKET/);
  });

  it('[P0] throws when DYNAMODB_TABLE_NAME is missing', () => {
    delete process.env.DYNAMODB_TABLE_NAME;
    expect(() => validateEnvironment()).toThrow(/DYNAMODB_TABLE_NAME/);
  });

  it('[P1] error message lists all missing variables', () => {
    delete process.env.JWT_SECRET;
    delete process.env.S3_BUCKET;
    let message = '';
    try {
      validateEnvironment();
    } catch (e: any) {
      message = e.message;
    }
    expect(message).toMatch(/JWT_SECRET/);
    expect(message).toMatch(/S3_BUCKET/);
  });

  it('[P0] production: throws when DYNAMODB_ENDPOINT is set', () => {
    process.env.NODE_ENV = 'production';
    process.env.DYNAMODB_ENDPOINT = 'http://dynamodb-local:8100';
    expect(() => validateEnvironment()).toThrow(/DYNAMODB_ENDPOINT/);
  });

  it('[P0] production: throws when S3_ENDPOINT is set', () => {
    process.env.NODE_ENV = 'production';
    process.env.S3_ENDPOINT = 'http://localstack:4510';
    expect(() => validateEnvironment()).toThrow(/S3_ENDPOINT/);
  });

  it('[P1] development: DYNAMODB_ENDPOINT is allowed', () => {
    process.env.NODE_ENV = 'development';
    process.env.DYNAMODB_ENDPOINT = 'http://dynamodb-local:8100';
    expect(() => validateEnvironment()).not.toThrow();
  });
});
