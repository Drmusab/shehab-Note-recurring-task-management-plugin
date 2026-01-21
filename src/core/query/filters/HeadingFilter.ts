import { Filter } from './FilterBase';
import type { Task } from '@/core/models/Task';

/**
 * Filter tasks by document heading/section
 */
export class HeadingFilter extends Filter {
  constructor(
    private operator: 'includes' | 'does not include',
    private pattern: string
  ) {
    super();
  }

  matches(task: Task): boolean {
    const heading = task.heading || '';
    const result = heading.toLowerCase().includes(this.pattern.toLowerCase());
    return this.operator === 'includes' ? result : !result;
  }
}
