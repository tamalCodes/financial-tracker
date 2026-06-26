import { describe, expect, it } from "vitest";
import { evaluateExpression, isCalculation } from "./expression";

describe("evaluateExpression", () => {
  it("evaluates plain numbers", () => {
    expect(evaluateExpression("400")).toBe(400);
    expect(evaluateExpression("400.5")).toBe(400.5);
    expect(evaluateExpression(".5")).toBe(0.5);
  });

  it("evaluates the reported case 400+400", () => {
    expect(evaluateExpression("400+400")).toBe(800);
  });

  it("respects operator precedence", () => {
    expect(evaluateExpression("100+50*2")).toBe(200);
    expect(evaluateExpression("(100+50)*2")).toBe(300);
  });

  it("handles all operators and unicode variants", () => {
    expect(evaluateExpression("10-3")).toBe(7);
    expect(evaluateExpression("10×3")).toBe(30);
    expect(evaluateExpression("10x3")).toBe(30);
    expect(evaluateExpression("10÷4")).toBe(2.5);
    expect(evaluateExpression("100−40")).toBe(60);
  });

  it("handles leading unary minus", () => {
    expect(evaluateExpression("-50")).toBe(-50);
    expect(evaluateExpression("-(20+5)")).toBe(-25);
  });

  it("allows a signed second operand (400 + -50)", () => {
    expect(evaluateExpression("400+-50")).toBe(350);
  });

  it("rounds to 2 decimals", () => {
    expect(evaluateExpression("10/3")).toBe(3.33);
  });

  it("returns null for empty/incomplete/invalid input", () => {
    expect(evaluateExpression("")).toBeNull();
    expect(evaluateExpression("   ")).toBeNull();
    expect(evaluateExpression("400+")).toBeNull();
    expect(evaluateExpression("400**400")).toBeNull();
    expect(evaluateExpression("(400+400")).toBeNull();
    expect(evaluateExpression("1.2.3")).toBeNull();
    expect(evaluateExpression("abc")).toBeNull();
    expect(evaluateExpression("400/0")).toBeNull();
  });

  it("never executes injected code (no eval)", () => {
    expect(evaluateExpression("alert(1)")).toBeNull();
    expect(evaluateExpression("1;2")).toBeNull();
  });
});

describe("isCalculation", () => {
  it("is true only when an operator is present", () => {
    expect(isCalculation("400+400")).toBe(true);
    expect(isCalculation("400")).toBe(false);
    expect(isCalculation("-50")).toBe(false);
  });
});
