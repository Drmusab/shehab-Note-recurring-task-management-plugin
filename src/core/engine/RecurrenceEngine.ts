import type { Frequency } from "@/core/models/Frequency";
import { addDays, addWeeks, addMonths, setTime, parseTime } from "@/utils/date";

/**
 * RecurrenceEngine calculates next occurrence dates based on frequency rules
 */
export class RecurrenceEngine {
  /**
   * Calculate the next occurrence date based on frequency
   * @param currentDue Current due date
   * @param frequency Recurrence rule
   * @returns Next occurrence date
   */
  calculateNext(currentDue: Date, frequency: Frequency): Date {
    const { type, interval, time } = frequency;
    let nextDate: Date;

    switch (type) {
      case "daily":
        nextDate = this.calculateNextDaily(currentDue, interval);
        break;
      case "weekly":
        nextDate = this.calculateNextWeekly(
          currentDue,
          interval,
          frequency.weekdays
        );
        break;
      case "monthly":
        nextDate = this.calculateNextMonthly(
          currentDue,
          interval,
          frequency.dayOfMonth
        );
        break;
      default:
        throw new Error(`Unknown frequency type: ${type}`);
    }

    // Apply fixed time if specified
    if (time) {
      const { hours, minutes } = parseTime(time);
      nextDate = setTime(nextDate, hours, minutes);
    }

    return nextDate;
  }

  /**
   * Calculate next daily occurrence
   */
  private calculateNextDaily(currentDue: Date, interval: number): Date {
    return addDays(currentDue, interval);
  }

  /**
   * Calculate next weekly occurrence
   */
  private calculateNextWeekly(
    currentDue: Date,
    interval: number,
    weekdays?: number[]
  ): Date {
    if (!weekdays || weekdays.length === 0) {
      // No specific weekdays, just add weeks
      return addWeeks(currentDue, interval);
    }

    // Find next occurrence on specified weekdays
    const currentDay = currentDue.getDay();
    let daysToAdd = 0;
    let found = false;

    // Sort weekdays to process in order
    const sortedWeekdays = [...weekdays].sort((a, b) => a - b);

    // First, check remaining days in current week
    for (const weekday of sortedWeekdays) {
      if (weekday > currentDay) {
        daysToAdd = weekday - currentDay;
        found = true;
        break;
      }
    }

    // If not found in current week, go to next interval period
    if (!found) {
      // Move to first weekday in the next occurrence
      const firstWeekday = sortedWeekdays[0];
      // Calculate days to the first weekday of next interval
      const daysToEndOfWeek = 7 - currentDay;
      const weeksToSkip = interval - 1;
      daysToAdd = daysToEndOfWeek + (weeksToSkip * 7) + firstWeekday;
    }

    return addDays(currentDue, daysToAdd);
  }

  /**
   * Calculate next monthly occurrence
   */
  private calculateNextMonthly(
    currentDue: Date,
    interval: number,
    dayOfMonth?: number
  ): Date {
    const nextBase = addMonths(currentDue, interval);
    const targetDay = dayOfMonth ?? currentDue.getDate();
    const year = nextBase.getFullYear();
    const month = nextBase.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(targetDay, daysInMonth);
    const nextDate = new Date(nextBase);
    nextDate.setDate(day);
    return nextDate;
  }

  /**
   * Get all occurrences within a date range
   * @param startDate Start of range
   * @param endDate End of range
   * @param frequency Recurrence rule
   * @param firstOccurrence First occurrence date
   * @returns Array of occurrence dates
   */
  getOccurrencesInRange(
    startDate: Date,
    endDate: Date,
    frequency: Frequency,
    firstOccurrence: Date
  ): Date[] {
    const occurrences: Date[] = [];
    let currentDate = new Date(firstOccurrence);

    // Safety limit to prevent infinite loops
    const maxIterations = 1000;
    let iterations = 0;

    while (currentDate <= endDate && iterations < maxIterations) {
      if (currentDate >= startDate) {
        occurrences.push(new Date(currentDate));
      }
      currentDate = this.calculateNext(currentDate, frequency);
      iterations++;
    }

    return occurrences;
  }
}
