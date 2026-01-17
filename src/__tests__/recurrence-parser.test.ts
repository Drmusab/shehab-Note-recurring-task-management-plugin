import { describe, it, expect } from "vitest";
import { RecurrenceParser } from "../core/parsers/RecurrenceParser";

describe("RecurrenceParser", () => {
  describe("parse", () => {
    describe("daily patterns", () => {
      it("should parse 'every day'", () => {
        const result = RecurrenceParser.parse("every day");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("daily");
        expect(result.frequency.interval).toBe(1);
      });

      it("should parse 'every 3 days'", () => {
        const result = RecurrenceParser.parse("every 3 days");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("daily");
        expect(result.frequency.interval).toBe(3);
      });

      it("should handle case insensitivity", () => {
        const result = RecurrenceParser.parse("Every Day");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("daily");
      });

      it("should handle extra spaces", () => {
        const result = RecurrenceParser.parse("  every   day  ");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("daily");
      });
    });

    describe("weekly patterns", () => {
      it("should parse 'every week'", () => {
        const result = RecurrenceParser.parse("every week");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("weekly");
        expect(result.frequency.interval).toBe(1);
      });

      it("should parse 'every week on Monday'", () => {
        const result = RecurrenceParser.parse("every week on Monday");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("weekly");
        expect(result.frequency.interval).toBe(1);
        expect(result.frequency.weekdays).toEqual([0]);
      });

      it("should parse 'every 2 weeks on Monday, Friday'", () => {
        const result = RecurrenceParser.parse("every 2 weeks on Monday, Friday");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("weekly");
        expect(result.frequency.interval).toBe(2);
        expect(result.frequency.weekdays).toEqual([0, 4]);
      });

      it("should handle lowercase day names", () => {
        const result = RecurrenceParser.parse("every week on monday");
        expect(result.isValid).toBe(true);
        expect(result.frequency.weekdays).toEqual([0]);
      });

      it("should handle abbreviated day names", () => {
        const result = RecurrenceParser.parse("every week on Mon, Fri");
        expect(result.isValid).toBe(true);
        expect(result.frequency.weekdays).toEqual([0, 4]);
      });
    });

    describe("monthly patterns", () => {
      it("should parse 'every month'", () => {
        const result = RecurrenceParser.parse("every month");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("monthly");
        expect(result.frequency.interval).toBe(1);
        expect(result.frequency.dayOfMonth).toBe(1);
      });

      it("should parse 'every month on the 15th'", () => {
        const result = RecurrenceParser.parse("every month on the 15th");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("monthly");
        expect(result.frequency.interval).toBe(1);
        expect(result.frequency.dayOfMonth).toBe(15);
      });

      it("should parse 'every 2 months on the 1st'", () => {
        const result = RecurrenceParser.parse("every 2 months on the 1st");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("monthly");
        expect(result.frequency.interval).toBe(2);
        expect(result.frequency.dayOfMonth).toBe(1);
      });

      it("should handle different ordinal suffixes", () => {
        const tests = [
          { input: "every month on the 1st", day: 1 },
          { input: "every month on the 2nd", day: 2 },
          { input: "every month on the 3rd", day: 3 },
          { input: "every month on the 4th", day: 4 },
          { input: "every month on the 21st", day: 21 },
          { input: "every month on the 22nd", day: 22 },
          { input: "every month on the 23rd", day: 23 },
        ];

        tests.forEach(({ input, day }) => {
          const result = RecurrenceParser.parse(input);
          expect(result.isValid).toBe(true);
          expect(result.frequency.dayOfMonth).toBe(day);
        });
      });

      it("should reject invalid day of month", () => {
        const result = RecurrenceParser.parse("every month on the 32nd");
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("between 1 and 31");
      });
    });

    describe("yearly patterns", () => {
      it("should parse 'every year'", () => {
        const result = RecurrenceParser.parse("every year");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("yearly");
        expect(result.frequency.interval).toBe(1);
      });

      it("should parse 'every 2 years'", () => {
        const result = RecurrenceParser.parse("every 2 years");
        expect(result.isValid).toBe(true);
        expect(result.frequency.type).toBe("yearly");
        expect(result.frequency.interval).toBe(2);
      });
    });

    describe("error handling", () => {
      it("should reject empty string", () => {
        const result = RecurrenceParser.parse("");
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("cannot be empty");
      });

      it("should reject missing 'every'", () => {
        const result = RecurrenceParser.parse("day");
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("must start with 'every'");
      });

      it("should reject unrecognized pattern", () => {
        const result = RecurrenceParser.parse("every something");
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Unrecognized");
      });

      it("should handle invalid day names", () => {
        const result = RecurrenceParser.parse("every week on InvalidDay");
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Invalid day names");
      });
    });
  });

  describe("stringify", () => {
    it("should stringify daily frequency", () => {
      const str = RecurrenceParser.stringify({ type: "daily", interval: 1 });
      expect(str).toBe("every day");
    });

    it("should stringify daily frequency with interval", () => {
      const str = RecurrenceParser.stringify({ type: "daily", interval: 3 });
      expect(str).toBe("every 3 days");
    });

    it("should stringify weekly frequency", () => {
      const str = RecurrenceParser.stringify({ 
        type: "weekly", 
        interval: 1, 
        weekdays: [0] 
      });
      expect(str).toBe("every week on Monday");
    });

    it("should stringify weekly frequency with multiple days", () => {
      const str = RecurrenceParser.stringify({ 
        type: "weekly", 
        interval: 2, 
        weekdays: [0, 4] 
      });
      expect(str).toBe("every 2 weeks on Monday, Friday");
    });

    it("should stringify monthly frequency", () => {
      const str = RecurrenceParser.stringify({ 
        type: "monthly", 
        interval: 1, 
        dayOfMonth: 15 
      });
      expect(str).toBe("every month on the 15th");
    });

    it("should stringify monthly frequency with ordinal suffixes", () => {
      const tests = [
        { day: 1, expected: "every month on the 1st" },
        { day: 2, expected: "every month on the 2nd" },
        { day: 3, expected: "every month on the 3rd" },
        { day: 4, expected: "every month on the 4th" },
        { day: 11, expected: "every month on the 11th" },
        { day: 21, expected: "every month on the 21st" },
        { day: 22, expected: "every month on the 22nd" },
        { day: 23, expected: "every month on the 23rd" },
      ];

      tests.forEach(({ day, expected }) => {
        const str = RecurrenceParser.stringify({ 
          type: "monthly", 
          interval: 1, 
          dayOfMonth: day 
        });
        expect(str).toBe(expected);
      });
    });

    it("should stringify yearly frequency", () => {
      const str = RecurrenceParser.stringify({ 
        type: "yearly", 
        interval: 1, 
        month: 0, 
        dayOfMonth: 1 
      });
      expect(str).toBe("every year");
    });

    it("should stringify yearly frequency with interval", () => {
      const str = RecurrenceParser.stringify({ 
        type: "yearly", 
        interval: 2, 
        month: 0, 
        dayOfMonth: 1 
      });
      expect(str).toBe("every 2 years");
    });
  });

  describe("round-trip", () => {
    it("should parse and stringify consistently", () => {
      const inputs = [
        "every day",
        "every 3 days",
        "every week on Monday",
        "every 2 weeks on Monday, Friday",
        "every month on the 15th",
        "every year",
      ];

      inputs.forEach((input) => {
        const parsed = RecurrenceParser.parse(input);
        expect(parsed.isValid).toBe(true);
        const stringified = RecurrenceParser.stringify(parsed.frequency);
        
        // Parse again to ensure consistency
        const reparsed = RecurrenceParser.parse(stringified);
        expect(reparsed.isValid).toBe(true);
        expect(reparsed.frequency).toEqual(parsed.frequency);
      });
    });
  });
});
