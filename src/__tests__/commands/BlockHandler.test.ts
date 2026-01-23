/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from "vitest";
import { getCurrentBlockContent } from "@/commands/BlockHandler";

describe("BlockHandler", () => {
  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = "";
    // Clear any selection
    window.getSelection()?.removeAllRanges();
  });

  it("should extract content from selected block", () => {
    // Create a mock block element
    const blockElement = document.createElement("div");
    blockElement.setAttribute("data-node-id", "test-block-123");
    blockElement.textContent = "- [ ] Test task content";
    document.body.appendChild(blockElement);

    // Create a text node and select it
    const textNode = blockElement.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 5);
    
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Get block content
    const result = getCurrentBlockContent();

    expect(result).not.toBeNull();
    expect(result?.blockId).toBe("test-block-123");
    expect(result?.content).toBe("- [ ] Test task content");
    expect(result?.isChecklist).toBe(true);
  });

  it("should detect checklist format correctly", () => {
    const testCases = [
      { content: "- [ ] Task", expected: true },
      { content: "- [x] Task", expected: true },
      { content: "- [-] Task", expected: true },
      { content: "Plain text", expected: false },
      { content: "* Not a checkbox", expected: false },
    ];

    testCases.forEach(({ content, expected }) => {
      const blockElement = document.createElement("div");
      blockElement.setAttribute("data-node-id", "test-block");
      blockElement.textContent = content;
      document.body.innerHTML = "";
      document.body.appendChild(blockElement);

      const textNode = blockElement.firstChild!;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      const result = getCurrentBlockContent();
      expect(result?.isChecklist).toBe(expected);
    });
  });

  it("should return null when no block is selected", () => {
    // No selection
    const result = getCurrentBlockContent();
    expect(result).toBeNull();
  });

  it("should return null when selection is outside a block", () => {
    // Create element without data-node-id
    const element = document.createElement("div");
    element.textContent = "Not a block";
    document.body.appendChild(element);

    const textNode = element.firstChild!;
    const range = document.createRange();
    range.selectNodeContents(textNode);
    
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = getCurrentBlockContent();
    expect(result).toBeNull();
  });

  it("should handle nested elements correctly", () => {
    // Create a mock block with nested structure
    const blockElement = document.createElement("div");
    blockElement.setAttribute("data-node-id", "nested-block");
    
    const span = document.createElement("span");
    span.textContent = "- [ ] Nested task";
    blockElement.appendChild(span);
    document.body.appendChild(blockElement);

    // Select inside the nested span
    const textNode = span.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 5);
    
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = getCurrentBlockContent();

    expect(result).not.toBeNull();
    expect(result?.blockId).toBe("nested-block");
    expect(result?.content).toBe("- [ ] Nested task");
  });
});
