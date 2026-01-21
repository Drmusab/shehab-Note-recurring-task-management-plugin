import type { Task } from "@/core/models/Task";
import type { UrgencySettings } from "@/core/urgency/UrgencySettings";
import { calculateUrgencyScore } from "@/core/urgency/UrgencyScoreCalculator";
import { Filter } from "./FilterBase";

export type UrgencyComparator = "is" | "above" | "below";

export class UrgencyFilter extends Filter {
  constructor(
    private comparator: UrgencyComparator,
    private threshold: number,
    private referenceDate: Date,
    private settings: UrgencySettings
  ) {
    super();
  }

  matches(task: Task): boolean {
    const score = calculateUrgencyScore(task, {
      now: this.referenceDate,
      settings: this.settings,
    });

    switch (this.comparator) {
      case "above":
        return score > this.threshold;
      case "below":
        return score < this.threshold;
      case "is":
        return score === this.threshold;
      default:
        return false;
    }
  }
}
