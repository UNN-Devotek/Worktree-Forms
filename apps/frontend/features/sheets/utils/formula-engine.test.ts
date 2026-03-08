import { describe, it, expect } from 'vitest';
import { evaluateFormula } from './formula-engine';

// isFormula is a thin check — test via evaluateFormula passthrough behaviour
describe('formula detection (via evaluateFormula)', () => {
  it('[P0] non-formula string is returned unchanged', () => {
    expect(evaluateFormula('hello', {})).toBe('hello');
    expect(evaluateFormula('123', {})).toBe('123');
    expect(evaluateFormula('', {})).toBe('');
  });

  it('[P0] string starting with = is evaluated as formula', () => {
    expect(evaluateFormula('=1+1', {})).toBe(2);
  });
});

describe('evaluateFormula — arithmetic', () => {
  it('[P0] addition', () => {
    expect(evaluateFormula('=1+2', {})).toBe(3);
    expect(evaluateFormula('=10+5', {})).toBe(15);
  });

  it('[P0] subtraction', () => {
    expect(evaluateFormula('=10-3', {})).toBe(7);
  });

  it('[P0] multiplication', () => {
    expect(evaluateFormula('=4*5', {})).toBe(20);
  });

  it('[P0] division', () => {
    expect(evaluateFormula('=10/2', {})).toBe(5);
  });

  it('[P0] operator precedence (* before +)', () => {
    expect(evaluateFormula('=2+3*4', {})).toBe(14);
  });

  it('[P1] parentheses override precedence', () => {
    expect(evaluateFormula('=(2+3)*4', {})).toBe(20);
  });

  it('[P1] negative numbers', () => {
    expect(evaluateFormula('=-5+3', {})).toBe(-2);
  });

  it('[P1] division by zero returns #DIV/0!', () => {
    expect(evaluateFormula('=1/0', {})).toBe('#DIV/0!');
  });
});

describe('evaluateFormula — column references {varName}', () => {
  it('[P0] substitutes a numeric variable', () => {
    expect(evaluateFormula('={price}*{qty}', { price: '10', qty: '3' })).toBe(30);
  });

  it('[P0] substitutes a string variable', () => {
    expect(evaluateFormula('=UPPER({name})', { name: 'alice' })).toBe('ALICE');
  });

  it('[P1] missing variable is treated as 0', () => {
    expect(evaluateFormula('={missing}+5', {})).toBe(5);
  });

  it('[P1] variable with special-char name is escaped correctly', () => {
    // Should not crash even if key has regex special chars
    expect(() => evaluateFormula('={a.b}', { 'a.b': '7' })).not.toThrow();
  });
});

describe('evaluateFormula — math functions', () => {
  it('[P0] SUM', () => {
    expect(evaluateFormula('=SUM(1,2,3)', {})).toBe(6);
  });

  it('[P0] AVERAGE', () => {
    expect(evaluateFormula('=AVERAGE(10,20,30)', {})).toBe(20);
  });

  it('[P0] MIN / MAX', () => {
    expect(evaluateFormula('=MIN(5,2,8)', {})).toBe(2);
    expect(evaluateFormula('=MAX(5,2,8)', {})).toBe(8);
  });

  it('[P0] COUNT — counts non-empty args', () => {
    expect(evaluateFormula('=COUNT(1,2,3)', {})).toBe(3);
  });

  it('[P0] ABS', () => {
    expect(evaluateFormula('=ABS(-7)', {})).toBe(7);
    expect(evaluateFormula('=ABS(7)', {})).toBe(7);
  });

  it('[P0] SQRT', () => {
    expect(evaluateFormula('=SQRT(9)', {})).toBe(3);
  });

  it('[P1] SQRT of negative returns #NUM!', () => {
    expect(evaluateFormula('=SQRT(-1)', {})).toBe('#NUM!');
  });

  it('[P1] ROUND', () => {
    expect(evaluateFormula('=ROUND(3.14159,2)', {})).toBe(3.14);
  });

  it('[P1] POWER', () => {
    expect(evaluateFormula('=POWER(2,8)', {})).toBe(256);
  });

  it('[P1] MOD', () => {
    expect(evaluateFormula('=MOD(10,3)', {})).toBe(1);
  });

  it('[P1] PRODUCT', () => {
    expect(evaluateFormula('=PRODUCT(2,3,4)', {})).toBe(24);
  });
});

describe('evaluateFormula — string functions', () => {
  it('[P0] UPPER / LOWER', () => {
    expect(evaluateFormula('=UPPER("hello")', {})).toBe('HELLO');
    expect(evaluateFormula('=LOWER("WORLD")', {})).toBe('world');
  });

  it('[P0] CONCAT / CONCATENATE', () => {
    expect(evaluateFormula('=CONCAT("foo","bar")', {})).toBe('foobar');
    expect(evaluateFormula('=CONCATENATE("a","b","c")', {})).toBe('abc');
  });

  it('[P0] LEN', () => {
    expect(evaluateFormula('=LEN("hello")', {})).toBe(5);
    expect(evaluateFormula('=LEN("")', {})).toBe(0);
  });

  it('[P0] TRIM', () => {
    expect(evaluateFormula('=TRIM("  hello  ")', {})).toBe('hello');
  });

  it('[P1] LEFT / RIGHT / MID', () => {
    expect(evaluateFormula('=LEFT("hello",3)', {})).toBe('hel');
    expect(evaluateFormula('=RIGHT("hello",3)', {})).toBe('llo');
    expect(evaluateFormula('=MID("hello",2,3)', {})).toBe('ell');
  });

  it('[P1] TEXT / VALUE', () => {
    expect(evaluateFormula('=TEXT(42)', {})).toBe('42');
    expect(evaluateFormula('=VALUE("123")', {})).toBe(123);
    expect(evaluateFormula('=VALUE("abc")', {})).toBe('#VALUE!');
  });

  it('[P1] & operator for string concatenation', () => {
    expect(evaluateFormula('="hello"&" "&"world"', {})).toBe('hello world');
  });
});

describe('evaluateFormula — logic functions', () => {
  it('[P0] IF — truthy branch', () => {
    expect(evaluateFormula('=IF(1,"yes","no")', {})).toBe('yes');
  });

  it('[P0] IF — falsy branch', () => {
    expect(evaluateFormula('=IF(0,"yes","no")', {})).toBe('no');
  });

  it('[P1] IFERROR — returns fallback on error value', () => {
    expect(evaluateFormula('=IFERROR("#ERROR!","safe")', {})).toBe('safe');
    expect(evaluateFormula('=IFERROR("ok","safe")', {})).toBe('ok');
  });

  it('[P1] comparison operators', () => {
    expect(evaluateFormula('=5>3', {})).toBe(true);
    expect(evaluateFormula('=3>5', {})).toBe(false);
    expect(evaluateFormula('=5=5', {})).toBe(true);
    expect(evaluateFormula('=5<>3', {})).toBe(true);
  });
});

describe('evaluateFormula — error handling', () => {
  it('[P0] unknown function returns #ERROR!', () => {
    expect(evaluateFormula('=FAKEFUNCTION(1)', {})).toBe('#ERROR!');
  });

  it('[P0] unbalanced parentheses returns #ERROR!', () => {
    expect(evaluateFormula('=SUM(1,2', {})).toBe('#ERROR!');
  });

  it('[P0] empty formula body returns null', () => {
    expect(evaluateFormula('=', {})).toBeNull();
  });
});
