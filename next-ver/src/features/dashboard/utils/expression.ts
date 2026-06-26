// Safe arithmetic expression evaluator for amount inputs.
// Supports + - * / and parentheses with decimals. No eval() — a hand-rolled
// tokenizer + shunting-yard parser, so user input can never execute code.
//
// `×`/`x` map to `*`, `÷` to `/`, `−` (unicode minus) to `-`.

type Token =
  | { type: "num"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "paren"; value: "(" | ")" };

const PRECEDENCE: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

function normalize(input: string): string {
  return input.replace(/[×x]/gi, "*").replace(/÷/g, "/").replace(/−/g, "-");
}

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  const s = normalize(input);

  while (i < s.length) {
    const ch = s[i];

    if (ch === " ") {
      i++;
      continue;
    }

    if (ch >= "0" && ch <= "9") {
      let num = "";
      while (i < s.length && ((s[i] >= "0" && s[i] <= "9") || s[i] === ".")) {
        num += s[i];
        i++;
      }
      // reject malformed numbers like "1.2.3"
      if ((num.match(/\./g)?.length ?? 0) > 1) return null;
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }

    if (ch === ".") {
      let num = "";
      while (i < s.length && ((s[i] >= "0" && s[i] <= "9") || s[i] === ".")) {
        num += s[i];
        i++;
      }
      if ((num.match(/\./g)?.length ?? 0) > 1) return null;
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }

    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }

    if (ch === "(" || ch === ")") {
      tokens.push({ type: "paren", value: ch });
      i++;
      continue;
    }

    return null; // unsupported character
  }

  return tokens;
}

// Handle leading/contextual unary minus/plus by folding into the next number.
function applyUnary(tokens: Token[]): Token[] | null {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === "op" && (tok.value === "-" || tok.value === "+")) {
      const prev = out[out.length - 1];
      const isUnary =
        !prev ||
        (prev.type === "op") ||
        (prev.type === "paren" && prev.value === "(");
      if (isUnary) {
        const next = tokens[i + 1];
        if (next && next.type === "num") {
          out.push({
            type: "num",
            value: tok.value === "-" ? -next.value : next.value,
          });
          i++; // consume the number
          continue;
        }
        if (next && next.type === "paren" && next.value === "(") {
          // -(...) → 0 - (...)
          out.push({ type: "num", value: 0 });
          out.push({ type: "op", value: tok.value });
          continue;
        }
        return null;
      }
    }
    out.push(tok);
  }
  return out;
}

function toRpn(tokens: Token[]): Token[] | null {
  const output: Token[] = [];
  const ops: Token[] = [];

  for (const tok of tokens) {
    if (tok.type === "num") {
      output.push(tok);
    } else if (tok.type === "op") {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.type === "op" && PRECEDENCE[top.value] >= PRECEDENCE[tok.value]) {
          output.push(ops.pop()!);
        } else break;
      }
      ops.push(tok);
    } else if (tok.value === "(") {
      ops.push(tok);
    } else {
      // ")"
      let found = false;
      while (ops.length) {
        const top = ops.pop()!;
        if (top.type === "paren" && top.value === "(") {
          found = true;
          break;
        }
        output.push(top);
      }
      if (!found) return null; // unbalanced
    }
  }

  while (ops.length) {
    const top = ops.pop()!;
    if (top.type === "paren") return null; // unbalanced
    output.push(top);
  }

  return output;
}

function evalRpn(rpn: Token[]): number | null {
  const stack: number[] = [];
  for (const tok of rpn) {
    if (tok.type === "num") {
      stack.push(tok.value);
      continue;
    }
    if (tok.type !== "op") return null;
    const b = stack.pop();
    const a = stack.pop();
    if (a === undefined || b === undefined) return null;
    let r: number;
    switch (tok.value) {
      case "+":
        r = a + b;
        break;
      case "-":
        r = a - b;
        break;
      case "*":
        r = a * b;
        break;
      case "/":
        if (b === 0) return null;
        r = a / b;
        break;
    }
    stack.push(r);
  }
  if (stack.length !== 1) return null;
  const result = stack[0];
  return Number.isFinite(result) ? result : null;
}

/**
 * Evaluate an arithmetic expression. Returns the numeric result, or `null` if
 * the input is empty, incomplete, or invalid. Result is rounded to 2 decimals.
 */
export function evaluateExpression(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const tokens = tokenize(trimmed);
  if (!tokens || tokens.length === 0) return null;

  const unaried = applyUnary(tokens);
  if (!unaried) return null;

  const rpn = toRpn(unaried);
  if (!rpn) return null;

  const result = evalRpn(rpn);
  if (result === null) return null;

  return Math.round((result + Number.EPSILON) * 100) / 100;
}

/** True if the input contains an operator (i.e. it's a calculation, not a plain number). */
export function isCalculation(input: string): boolean {
  return /[+\-*/×÷x]/i.test(input.trim().replace(/^[-−]/, ""));
}
