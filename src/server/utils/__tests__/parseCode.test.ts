import { describe, expect, it } from "vitest";
import { parseCode } from "../parseCode";

describe("parseCode", () => {
  it("extracts code from a basic js code block", () => {
    const input = "Here is some code:\n```js\nconsole.log('hello');\n```\nDone.";
    expect(parseCode(input)).toBe("console.log('hello');");
  });

  it("extracts multi-line code from a code block", () => {
    const input = "```js\nconst a = 1;\nconst b = 2;\nconsole.log(a + b);\n```";
    expect(parseCode(input)).toBe("const a = 1;\nconst b = 2;\nconsole.log(a + b);");
  });

  it("returns null when no code block is present", () => {
    expect(parseCode("just some plain text")).toBeNull();
  });

  it("returns null when only an opening fence is present", () => {
    expect(parseCode("```js\nconsole.log('hello');")).toBeNull();
  });

  it("returns null when only a closing fence is present", () => {
    expect(parseCode("console.log('hello');\n```")).toBeNull();
  });

  it("extracts the first code block when multiple are present", () => {
    const input = "```js\nfirst();\n```\nsome text\n```js\nsecond();\n```";
    expect(parseCode(input)).toBe("first();");
  });

  it("handles code blocks with leading whitespace/indentation", () => {
    const input = "  ```js\n  const x = 1;\n  ```";
    expect(parseCode(input)).toBe("  const x = 1;");
  });

  it("returns empty string for an empty code block", () => {
    const input = "```js\n```";
    expect(parseCode(input)).toBe("");
  });

  it("does not match non-js code fences like ```python", () => {
    const input = "```python\nprint('hello')\n```";
    expect(parseCode(input)).toBeNull();
  });

  it("does not match ```javascript since it does not contain ```js", () => {
    const input = "```javascript\nconsole.log('hi');\n```";
    expect(parseCode(input)).toBeNull();
  });

  it("matches ```jsx since it contains ```js", () => {
    const input = "```jsx\nconst el = <div />;\n```";
    expect(parseCode(input)).toBe("const el = <div />;");
  });

  it("handles code block with text on the same line as the fence", () => {
    const input = "Here ```js\ncode();\n```";
    // The opening fence line contains ```js so it should match
    expect(parseCode(input)).toBe("code();");
  });
});
