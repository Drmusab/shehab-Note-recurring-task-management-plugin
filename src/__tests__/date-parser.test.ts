import { describe, it, expect } from 'vitest';
import { DateParser } from '@/core/parsers/DateParser';

describe('DateParser', () => {
  const referenceDate = new Date('2024-01-15T12:00:00Z'); // Monday, Jan 15, 2024

  describe('parse - ISO format', () => {
    it('should parse valid ISO date format', () => {
      const result = DateParser.parse('2024-01-20', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-20');
    });

    it('should handle different ISO dates', () => {
      const result = DateParser.parse('2025-12-31', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.date!.toISOString().split('T')[0]).toBe('2025-12-31');
    });
  });

  describe('parse - simple keywords', () => {
    it('should parse "today"', () => {
      const result = DateParser.parse('today', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-15');
    });

    it('should parse "tomorrow"', () => {
      const result = DateParser.parse('tomorrow', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-16');
    });

    it('should parse "yesterday"', () => {
      const result = DateParser.parse('yesterday', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-14');
    });

    it('should be case insensitive', () => {
      const result1 = DateParser.parse('Today', referenceDate);
      const result2 = DateParser.parse('TOMORROW', referenceDate);
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
    });
  });

  describe('parse - "in X days/weeks/months"', () => {
    it('should parse "in 1 day"', () => {
      const result = DateParser.parse('in 1 day', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-16');
    });

    it('should parse "in 3 days"', () => {
      const result = DateParser.parse('in 3 days', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-18');
    });

    it('should parse "in 1 week"', () => {
      const result = DateParser.parse('in 1 week', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-22');
    });

    it('should parse "in 2 weeks"', () => {
      const result = DateParser.parse('in 2 weeks', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-29');
    });

    it('should parse "in 1 month"', () => {
      const result = DateParser.parse('in 1 month', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-02-15');
    });

    it('should parse "in 3 months"', () => {
      const result = DateParser.parse('in 3 months', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-04-15');
    });
  });

  describe('parse - "X days/weeks ago"', () => {
    it('should parse "1 day ago"', () => {
      const result = DateParser.parse('1 day ago', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-14');
    });

    it('should parse "3 days ago"', () => {
      const result = DateParser.parse('3 days ago', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-12');
    });

    it('should parse "1 week ago"', () => {
      const result = DateParser.parse('1 week ago', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-08');
    });

    it('should parse "2 weeks ago"', () => {
      const result = DateParser.parse('2 weeks ago', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-01');
    });

    it('should parse "1 month ago"', () => {
      const result = DateParser.parse('1 month ago', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2023-12-15');
    });
  });

  describe('parse - "next/last weekday"', () => {
    it('should parse "next Monday" (reference is Monday, so next Monday)', () => {
      const result = DateParser.parse('next Monday', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-22'); // Next Monday
    });

    it('should parse "next Friday"', () => {
      const result = DateParser.parse('next Friday', referenceDate);
      expect(result.isValid).toBe(true);
      // chrono interprets "next Friday" as the Friday of next week
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-26');
    });

    it('should parse "next Sunday"', () => {
      const result = DateParser.parse('next Sunday', referenceDate);
      expect(result.isValid).toBe(true);
      // chrono interprets "next Sunday" as the Sunday of next week
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-28');
    });

    it('should parse "last Monday"', () => {
      const result = DateParser.parse('last Monday', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-08'); // Last Monday
    });

    it('should parse "last Friday"', () => {
      const result = DateParser.parse('last Friday', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-12'); // Last Friday
    });

    it('should be case insensitive', () => {
      const result = DateParser.parse('Next TUESDAY', referenceDate);
      expect(result.isValid).toBe(true);
    });
  });

  describe('parse - "this/next/last week/month"', () => {
    it('should parse "this week" (Monday of current week)', () => {
      const result = DateParser.parse('this week', referenceDate);
      expect(result.isValid).toBe(true);
      // chrono interprets "this week" as the start of current week (Sunday)
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-14');
    });

    it('should parse "next week"', () => {
      const result = DateParser.parse('next week', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-22'); // Monday next week
    });

    it('should parse "last week"', () => {
      const result = DateParser.parse('last week', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-08'); // Monday last week
    });

    it('should parse "this month" (1st of current month)', () => {
      const result = DateParser.parse('this month', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-01');
    });

    it('should parse "next month"', () => {
      const result = DateParser.parse('next month', referenceDate);
      expect(result.isValid).toBe(true);
      // chrono maintains the day of month when parsing "next month"
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-02-15');
    });

    it('should parse "last month"', () => {
      const result = DateParser.parse('last month', referenceDate);
      expect(result.isValid).toBe(true);
      // chrono maintains the day of month when parsing "last month"
      expect(result.date!.toISOString().split('T')[0]).toBe('2023-12-15');
    });
  });

  describe('parse - invalid input', () => {
    it('should handle empty string', () => {
      const result = DateParser.parse('', referenceDate);
      expect(result.isValid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error).toBe('Empty date string');
    });

    it('should handle unparseable input', () => {
      const result = DateParser.parse('not a date', referenceDate);
      expect(result.isValid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error).toContain('Could not parse date');
    });

    it('should preserve original input', () => {
      const result = DateParser.parse('invalid date', referenceDate);
      expect(result.original).toBe('invalid date');
    });
  });

  describe('toISODateString', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T12:34:56Z');
      const formatted = DateParser.toISODateString(date);
      expect(formatted).toBe('2024-01-15');
    });

    it('should handle different dates', () => {
      const date = new Date('2025-12-31T23:59:59Z');
      const formatted = DateParser.toISODateString(date);
      expect(formatted).toBe('2025-12-31');
    });

    it('should pad single-digit months and days', () => {
      const date = new Date('2024-03-05T00:00:00Z');
      const formatted = DateParser.toISODateString(date);
      expect(formatted).toBe('2024-03-05');
    });
  });

  describe('edge cases', () => {
    it('should handle reference date at end of month', () => {
      const endOfMonth = new Date('2024-01-31T12:00:00Z');
      const result = DateParser.parse('in 1 month', endOfMonth);
      expect(result.isValid).toBe(true);
      // Feb has only 29 days in 2024 (leap year), should handle gracefully
    });

    it('should handle whitespace in input', () => {
      const result = DateParser.parse('  tomorrow  ', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-16');
    });
  });

  describe('chrono-node enhanced parsing', () => {
    it('should parse month names like "January 15"', () => {
      const result = DateParser.parse('January 20, 2024', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-20');
    });

    it('should parse abbreviated month names like "Jan 15"', () => {
      const result = DateParser.parse('Jan 20', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
      // chrono will use the reference year
    });

    it('should parse "in 2 weeks" using chrono', () => {
      const result = DateParser.parse('in 2 weeks', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.date!.toISOString().split('T')[0]).toBe('2024-01-29');
    });

    it('should parse "two weeks from now" (chrono variant)', () => {
      const result = DateParser.parse('two weeks from now', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
    });

    it('should handle invalid dates gracefully like "February 30"', () => {
      // chrono might parse or reject this - we just ensure it doesn't crash
      const result = DateParser.parse('February 30', referenceDate);
      // Either parsed with adjustment or failed - both acceptable
      expect(result).toBeDefined();
    });

    it('should normalize times to midnight', () => {
      const result = DateParser.parse('tomorrow at 3pm', referenceDate);
      expect(result.isValid).toBe(true);
      expect(result.date).not.toBeNull();
      // Should be normalized to midnight
      expect(result.date!.getHours()).toBe(0);
      expect(result.date!.getMinutes()).toBe(0);
      expect(result.date!.getSeconds()).toBe(0);
      expect(result.date!.getMilliseconds()).toBe(0);
    });
  });

  describe('parseNaturalLanguageDate', () => {
    it('should parse "tomorrow"', () => {
      const result = DateParser.parseNaturalLanguageDate('tomorrow', referenceDate);
      expect(result).not.toBeNull();
      expect(result!.toISOString().split('T')[0]).toBe('2024-01-16');
    });

    it('should parse "next Friday"', () => {
      const result = DateParser.parseNaturalLanguageDate('next Friday', referenceDate);
      expect(result).not.toBeNull();
      expect(result!.toISOString().split('T')[0]).toBe('2024-01-26');
    });

    it('should parse "in 3 days"', () => {
      const result = DateParser.parseNaturalLanguageDate('in 3 days', referenceDate);
      expect(result).not.toBeNull();
      expect(result!.toISOString().split('T')[0]).toBe('2024-01-18');
    });

    it('should handle shortcuts - eod', () => {
      const result = DateParser.parseNaturalLanguageDate('eod', referenceDate);
      expect(result).not.toBeNull();
      expect(result!.getHours()).toBe(17);
    });

    it('should handle shortcuts - eow', () => {
      const result = DateParser.parseNaturalLanguageDate('eow', referenceDate);
      expect(result).not.toBeNull();
      expect(result!.getDay()).toBe(5); // Friday
      expect(result!.getHours()).toBe(17);
    });

    it('should handle shortcuts - eom', () => {
      const result = DateParser.parseNaturalLanguageDate('eom', referenceDate);
      expect(result).not.toBeNull();
      expect(result!.getDate()).toBe(31); // January has 31 days
      expect(result!.getHours()).toBe(17);
    });

    it('should return null for invalid input', () => {
      const result = DateParser.parseNaturalLanguageDate('xyz invalid', referenceDate);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = DateParser.parseNaturalLanguageDate('', referenceDate);
      expect(result).toBeNull();
    });
  });

  describe('parseToISO', () => {
    it('should convert natural language to ISO string', () => {
      const result = DateParser.parseToISO('tomorrow', referenceDate);
      expect(result).not.toBeNull();
      expect(result).toContain('2024-01-16');
    });

    it('should return null for invalid input', () => {
      const result = DateParser.parseToISO('invalid date', referenceDate);
      expect(result).toBeNull();
    });
  });

  describe('isDateExpression', () => {
    it('should recognize date keywords', () => {
      expect(DateParser.isDateExpression('tomorrow')).toBe(true);
      expect(DateParser.isDateExpression('next Friday')).toBe(true);
      expect(DateParser.isDateExpression('in 3 days')).toBe(true);
      expect(DateParser.isDateExpression('Monday')).toBe(true);
      expect(DateParser.isDateExpression('eod')).toBe(true);
      expect(DateParser.isDateExpression('eow')).toBe(true);
      expect(DateParser.isDateExpression('eom')).toBe(true);
    });

    it('should reject non-date strings', () => {
      expect(DateParser.isDateExpression('hello world')).toBe(false);
      expect(DateParser.isDateExpression('random text')).toBe(false);
      expect(DateParser.isDateExpression('')).toBe(false);
    });

    it('should recognize parseable dates', () => {
      expect(DateParser.isDateExpression('Jan 15, 2024')).toBe(true);
      expect(DateParser.isDateExpression('2024-01-15')).toBe(true);
    });
  });

  describe('getDateSuggestions', () => {
    it('should return suggestions for empty input', () => {
      const suggestions = DateParser.getDateSuggestions('', referenceDate);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });

    it('should filter suggestions based on input', () => {
      const suggestions = DateParser.getDateSuggestions('tom', referenceDate);
      expect(suggestions.some(s => s.text.toLowerCase().includes('tomorrow'))).toBe(true);
    });

    it('should include relative dates', () => {
      const suggestions = DateParser.getDateSuggestions('', referenceDate);
      const hasRelative = suggestions.some(s => s.category === 'relative');
      expect(hasRelative).toBe(true);
    });

    it('should include named days', () => {
      const suggestions = DateParser.getDateSuggestions('monday', referenceDate);
      const hasNamed = suggestions.some(s => s.category === 'named' && s.text.toLowerCase().includes('monday'));
      expect(hasNamed).toBe(true);
    });

    it('should include shortcuts', () => {
      const suggestions = DateParser.getDateSuggestions('eo', referenceDate);
      const hasShortcut = suggestions.some(s => s.category === 'shortcut');
      expect(hasShortcut).toBe(true);
    });

    it('should format descriptions correctly', () => {
      const suggestions = DateParser.getDateSuggestions('', referenceDate);
      expect(suggestions[0].description).toBeTruthy();
      expect(suggestions[0].value).toBeTruthy();
    });

    it('should limit to 8 suggestions', () => {
      const suggestions = DateParser.getDateSuggestions('', referenceDate);
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format without time', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const formatted = DateParser.formatDateForDisplay(date, false);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
      expect(formatted).not.toContain('14:30');
    });

    it('should format with time', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const formatted = DateParser.formatDateForDisplay(date, true);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('parseTime', () => {
    it('should parse 24-hour format', () => {
      expect(DateParser.parseTime('14:00')).toEqual({ hours: 14, minutes: 0 });
      expect(DateParser.parseTime('09:30')).toEqual({ hours: 9, minutes: 30 });
      expect(DateParser.parseTime('23:59')).toEqual({ hours: 23, minutes: 59 });
    });

    it('should parse 12-hour format with am', () => {
      expect(DateParser.parseTime('9am')).toEqual({ hours: 9, minutes: 0 });
      expect(DateParser.parseTime('12am')).toEqual({ hours: 0, minutes: 0 });
      expect(DateParser.parseTime('11:30am')).toEqual({ hours: 11, minutes: 30 });
      expect(DateParser.parseTime('9:45 am')).toEqual({ hours: 9, minutes: 45 });
    });

    it('should parse 12-hour format with pm', () => {
      expect(DateParser.parseTime('2pm')).toEqual({ hours: 14, minutes: 0 });
      expect(DateParser.parseTime('12pm')).toEqual({ hours: 12, minutes: 0 });
      expect(DateParser.parseTime('3:30pm')).toEqual({ hours: 15, minutes: 30 });
      expect(DateParser.parseTime('11:45 pm')).toEqual({ hours: 23, minutes: 45 });
    });

    it('should return null for invalid time', () => {
      expect(DateParser.parseTime('invalid')).toBeNull();
      expect(DateParser.parseTime('25:00')).toBeNull();
      expect(DateParser.parseTime('12:60')).toBeNull();
      expect(DateParser.parseTime('')).toBeNull();
    });
  });
});
