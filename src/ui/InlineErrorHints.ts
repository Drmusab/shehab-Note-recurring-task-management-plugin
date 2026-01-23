/**
 * Inline Error Hints - Display parse errors in a user-friendly way
 */

import type { ParseError } from "@/parser/InlineTaskParser";
import { toast } from "@/utils/notifications";
import * as logger from "@/utils/logger";

// Track error timeouts for cleanup
const errorTimeouts = new Map<string, number>();

/**
 * Show parse error to user with actionable feedback
 */
export function showParseErrorHint(error: ParseError, blockId: string): void {
  logger.warn("Task parse error", { error, blockId });
  
  // Show user-friendly notification
  const message = `Invalid task syntax: ${error.message}`;
  toast.warning(message, 5000);
  
  // Add CSS class to block for visual feedback
  addErrorClassToBlock(blockId);
  
  // Log additional context if available
  if (error.token) {
    logger.info("Problematic token", { token: error.token });
  }
  if (error.position !== undefined) {
    logger.info("Error position", { position: error.position });
  }
}

/**
 * Add error CSS class to a block element
 */
function addErrorClassToBlock(blockId: string): void {
  try {
    const blockElement = document.querySelector(`[data-node-id="${blockId}"]`);
    if (blockElement) {
      blockElement.classList.add('task-parse-error');
      
      // Clear any existing timeout for this block
      const existingTimeout = errorTimeouts.get(blockId);
      if (existingTimeout !== undefined) {
        clearTimeout(existingTimeout);
      }
      
      // Remove error class after 5 seconds
      const timeoutId = setTimeout(() => {
        // Check if element still exists before removing class
        const element = document.querySelector(`[data-node-id="${blockId}"]`);
        if (element) {
          element.classList.remove('task-parse-error');
        }
        errorTimeouts.delete(blockId);
      }, 5000) as unknown as number;
      
      errorTimeouts.set(blockId, timeoutId);
    }
  } catch (error) {
    logger.warn("Failed to add error class to block", { error, blockId });
  }
}

/**
 * Add managed task indicator to a block element
 */
export function addManagedTaskIndicator(blockId: string): void {
  try {
    const blockElement = document.querySelector(`[data-node-id="${blockId}"]`);
    if (blockElement) {
      blockElement.classList.add('task-managed');
    }
  } catch (error) {
    logger.warn("Failed to add managed indicator to block", { error, blockId });
  }
}

/**
 * Remove managed task indicator from a block element
 */
export function removeManagedTaskIndicator(blockId: string): void {
  try {
    const blockElement = document.querySelector(`[data-node-id="${blockId}"]`);
    if (blockElement) {
      blockElement.classList.remove('task-managed');
    }
  } catch (error) {
    logger.warn("Failed to remove managed indicator from block", { error, blockId });
  }
}
