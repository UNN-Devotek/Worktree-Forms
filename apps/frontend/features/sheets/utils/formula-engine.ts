/**
 * Story 6-8: Formula Engine Integration
 *
 * Client-side formula evaluator for SheetRow data.
 * Supports a safe subset of spreadsheet-style expressions:
 *   - Arithmetic: +, -, *, /, ^, %
 *   - Column references: {columnId}
 *   - Functions: SUM, AVERAGE, MIN, MAX, COUNT, ROUND, IF, CONCAT, LEN, UPPER, LOWER, TRIM, ABS, SQRT
 *   - String literals: "..."
 *   - Numeric literals
 *
 * No eval() or Function() constructor is used — the expression is parsed
 * with a recursive-descent parser.
 *
 * Usage:
 *   const result = evaluateFormula('={price} * {qty}', { price: '10', qty: '3' });
 *   // => 30
 */

export type FormulaContext = Record<string, unknown>;
export type FormulaResult = number | string | boolean | null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluates a formula expression against a row data context.
 *
 * @param expression - The formula string. Must start with '=' to be treated as
 *                     a formula; otherwise the raw value is returned as-is.
 * @param context    - Key/value map of column values for the current row.
 * @returns          - The computed result or '#ERROR!' on parse failure.
 */
export function evaluateFormula(expression: string, context: FormulaContext): FormulaResult {
  if (!expression.startsWith('=')) return expression;
  const source = expression.slice(1).trim();
  if (!source) return null;
  try {
    const parser = new FormulaParser(source, context);
    return parser.parse();
  } catch {
    return '#ERROR!';
  }
}

// ---------------------------------------------------------------------------
// Tokeniser
// ---------------------------------------------------------------------------

type TokenKind =
  | 'NUMBER' | 'STRING' | 'IDENT' | 'COLREF'
  | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'CARET' | 'PERCENT'
  | 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE'
  | 'LPAREN' | 'RPAREN' | 'COMMA'
  | 'AMP'   // & for string concat
  | 'EOF';

interface Token {
  kind: TokenKind;
  value: string;
}

function tokenise(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    // Skip whitespace
    if (/\s/.test(source[i])) { i++; continue; }

    // Number literal
    if (/\d/.test(source[i]) || (source[i] === '.' && /\d/.test(source[i + 1] ?? ''))) {
      let num = '';
      while (i < source.length && /[\d.]/.test(source[i])) num += source[i++];
      tokens.push({ kind: 'NUMBER', value: num });
      continue;
    }

    // String literal
    if (source[i] === '"') {
      let str = '';
      i++; // skip opening "
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\' && source[i + 1] === '"') { str += '"'; i += 2; }
        else str += source[i++];
      }
      i++; // skip closing "
      tokens.push({ kind: 'STRING', value: str });
      continue;
    }

    // Column reference: {columnId}
    if (source[i] === '{') {
      i++;
      let ref = '';
      while (i < source.length && source[i] !== '}') ref += source[i++];
      i++; // skip }
      tokens.push({ kind: 'COLREF', value: ref });
      continue;
    }

    // Identifier (function name)
    if (/[A-Za-z_]/.test(source[i])) {
      let ident = '';
      while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) ident += source[i++];
      tokens.push({ kind: 'IDENT', value: ident.toUpperCase() });
      continue;
    }

    // Operators and punctuation
    const two = source.slice(i, i + 2);
    if (two === '<>') { tokens.push({ kind: 'NEQ', value: '<>' }); i += 2; continue; }
    if (two === '<=') { tokens.push({ kind: 'LTE', value: '<=' }); i += 2; continue; }
    if (two === '>=') { tokens.push({ kind: 'GTE', value: '>=' }); i += 2; continue; }

    switch (source[i]) {
      case '+': tokens.push({ kind: 'PLUS',    value: '+' }); break;
      case '-': tokens.push({ kind: 'MINUS',   value: '-' }); break;
      case '*': tokens.push({ kind: 'STAR',    value: '*' }); break;
      case '/': tokens.push({ kind: 'SLASH',   value: '/' }); break;
      case '^': tokens.push({ kind: 'CARET',   value: '^' }); break;
      case '%': tokens.push({ kind: 'PERCENT', value: '%' }); break;
      case '=': tokens.push({ kind: 'EQ',      value: '=' }); break;
      case '<': tokens.push({ kind: 'LT',      value: '<' }); break;
      case '>': tokens.push({ kind: 'GT',      value: '>' }); break;
      case '(': tokens.push({ kind: 'LPAREN',  value: '(' }); break;
      case ')': tokens.push({ kind: 'RPAREN',  value: ')' }); break;
      case ',': tokens.push({ kind: 'COMMA',   value: ',' }); break;
      case '&': tokens.push({ kind: 'AMP',     value: '&' }); break;
      default:
        // Skip unknown characters rather than crashing
        break;
    }
    i++;
  }

  tokens.push({ kind: 'EOF', value: '' });
  return tokens;
}

// ---------------------------------------------------------------------------
// Parser (recursive descent)
// ---------------------------------------------------------------------------

class FormulaParser {
  private tokens: Token[];
  private pos = 0;
  private context: FormulaContext;

  constructor(source: string, context: FormulaContext) {
    this.tokens = tokenise(source);
    this.context = context;
  }

  parse(): FormulaResult {
    const result = this.parseComparison();
    if (this.peek().kind !== 'EOF') {
      throw new Error(`Unexpected token: ${this.peek().value}`);
    }
    return result;
  }

  private peek(): Token { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }

  private match(...kinds: TokenKind[]): boolean {
    if (kinds.includes(this.peek().kind)) { this.pos++; return true; }
    return false;
  }

  // comparison: concat (('=' | '<>' | '<' | '<=' | '>' | '>=') concat)?
  private parseComparison(): FormulaResult {
    let left = this.parseConcat();
    const op = this.peek().kind;
    if (['EQ', 'NEQ', 'LT', 'LTE', 'GT', 'GTE'].includes(op)) {
      this.consume();
      const right = this.parseConcat();
      const l = toNum(left);
      const r = toNum(right);
      if (op === 'EQ')  return String(left) === String(right);
      if (op === 'NEQ') return String(left) !== String(right);
      if (op === 'LT')  return l < r;
      if (op === 'LTE') return l <= r;
      if (op === 'GT')  return l > r;
      if (op === 'GTE') return l >= r;
    }
    return left;
  }

  // concat: additive ('&' additive)*
  private parseConcat(): FormulaResult {
    let left = this.parseAdditive();
    while (this.peek().kind === 'AMP') {
      this.consume();
      const right = this.parseAdditive();
      left = String(left ?? '') + String(right ?? '');
    }
    return left;
  }

  // additive: multiplicative (('+' | '-') multiplicative)*
  private parseAdditive(): FormulaResult {
    let left = this.parseMultiplicative();
    while (this.peek().kind === 'PLUS' || this.peek().kind === 'MINUS') {
      const op = this.consume().kind;
      const right = this.parseMultiplicative();
      if (op === 'PLUS') left = toNum(left) + toNum(right);
      else               left = toNum(left) - toNum(right);
    }
    return left;
  }

  // multiplicative: power (('*' | '/' | '%') power)*
  private parseMultiplicative(): FormulaResult {
    let left = this.parsePower();
    while (['STAR', 'SLASH', 'PERCENT'].includes(this.peek().kind)) {
      const op = this.consume().kind;
      const right = this.parsePower();
      if (op === 'STAR')    left = toNum(left) * toNum(right);
      else if (op === 'SLASH') {
        const r = toNum(right);
        left = r === 0 ? '#DIV/0!' : toNum(left) / r;
      } else {
        left = toNum(left) % toNum(right);
      }
    }
    return left;
  }

  // power: unary ('^' unary)*
  private parsePower(): FormulaResult {
    let base = this.parseUnary();
    while (this.peek().kind === 'CARET') {
      this.consume();
      const exp = this.parseUnary();
      base = Math.pow(toNum(base), toNum(exp));
    }
    return base;
  }

  // unary: ('-'|'+') unary | primary
  private parseUnary(): FormulaResult {
    if (this.peek().kind === 'MINUS') { this.consume(); return -toNum(this.parseUnary()); }
    if (this.peek().kind === 'PLUS')  { this.consume(); return this.parseUnary(); }
    return this.parsePrimary();
  }

  // primary: NUMBER | STRING | COLREF | IDENT '(' args ')' | '(' expr ')'
  private parsePrimary(): FormulaResult {
    const tok = this.peek();

    if (tok.kind === 'NUMBER') {
      this.consume();
      return parseFloat(tok.value);
    }

    if (tok.kind === 'STRING') {
      this.consume();
      return tok.value;
    }

    if (tok.kind === 'COLREF') {
      this.consume();
      const val = this.context[tok.value];
      if (val === undefined || val === null || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? String(val) : num;
    }

    if (tok.kind === 'IDENT') {
      this.consume();
      // Expect '('
      if (this.peek().kind !== 'LPAREN') throw new Error(`Expected '(' after ${tok.value}`);
      this.consume(); // consume LPAREN
      const args: FormulaResult[] = [];
      if (this.peek().kind !== 'RPAREN') {
        args.push(this.parseComparison());
        while (this.peek().kind === 'COMMA') {
          this.consume();
          args.push(this.parseComparison());
        }
      }
      if (this.peek().kind !== 'RPAREN') throw new Error(`Expected ')' after arguments`);
      this.consume(); // consume RPAREN
      return this.callFunction(tok.value, args);
    }

    if (tok.kind === 'LPAREN') {
      this.consume();
      const val = this.parseComparison();
      if (this.peek().kind !== 'RPAREN') throw new Error(`Expected ')'`);
      this.consume();
      return val;
    }

    throw new Error(`Unexpected token: ${tok.value}`);
  }

  // ---------------------------------------------------------------------------
  // Built-in functions
  // ---------------------------------------------------------------------------
  private callFunction(name: string, args: FormulaResult[]): FormulaResult {
    const nums = args.map(toNum);
    switch (name) {
      case 'SUM':     return nums.reduce((a, b) => a + b, 0);
      case 'AVERAGE': return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      case 'MIN':     return Math.min(...nums);
      case 'MAX':     return Math.max(...nums);
      case 'COUNT':   return args.filter((a) => a !== null && a !== '').length;
      case 'ABS':     return Math.abs(nums[0] ?? 0);
      case 'SQRT':    return nums[0] !== undefined && nums[0] >= 0 ? Math.sqrt(nums[0]) : '#NUM!';
      case 'ROUND':   return round(nums[0] ?? 0, nums[1] ?? 0);
      case 'ROUNDUP': return roundUp(nums[0] ?? 0, nums[1] ?? 0);
      case 'ROUNDDOWN': return roundDown(nums[0] ?? 0, nums[1] ?? 0);
      case 'INT':     return Math.trunc(nums[0] ?? 0);
      case 'MOD':     return nums[1] ? (nums[0] ?? 0) % nums[1] : '#DIV/0!';
      case 'POWER':   return Math.pow(nums[0] ?? 0, nums[1] ?? 0);
      case 'PRODUCT': return nums.reduce((a, b) => a * b, 1);

      case 'IF': {
        const condition = args[0];
        const truthy = isTruthy(condition);
        return truthy ? (args[1] ?? null) : (args[2] ?? null);
      }
      case 'IFERROR': return (args[0] === '#ERROR!' || args[0] === '#DIV/0!' || args[0] === '#NUM!') ? (args[1] ?? null) : args[0];

      case 'CONCATENATE':
      case 'CONCAT':  return args.map((a) => String(a ?? '')).join('');
      case 'LEN':     return String(args[0] ?? '').length;
      case 'UPPER':   return String(args[0] ?? '').toUpperCase();
      case 'LOWER':   return String(args[0] ?? '').toLowerCase();
      case 'TRIM':    return String(args[0] ?? '').trim();
      case 'LEFT':    return String(args[0] ?? '').slice(0, nums[1] ?? 1);
      case 'RIGHT': {
        const s = String(args[0] ?? '');
        const n = nums[1] ?? 1;
        return s.slice(Math.max(0, s.length - n));
      }
      case 'MID': {
        const s = String(args[0] ?? '');
        const start = (nums[1] ?? 1) - 1; // 1-based
        return s.slice(start, start + (nums[2] ?? 0));
      }
      case 'VALUE': {
        const n = Number(args[0]);
        return isNaN(n) ? '#VALUE!' : n;
      }
      case 'TEXT': return String(args[0] ?? '');

      case 'TODAY': return new Date().toISOString().slice(0, 10);
      case 'NOW':   return new Date().toISOString();

      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(v: FormulaResult): number {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function isTruthy(v: FormulaResult): boolean {
  if (v === null || v === '' || v === 0 || v === false) return false;
  return true;
}

function round(n: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round(n * factor) / factor;
}

function roundUp(n: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.ceil(n * factor) / factor;
}

function roundDown(n: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.floor(n * factor) / factor;
}
