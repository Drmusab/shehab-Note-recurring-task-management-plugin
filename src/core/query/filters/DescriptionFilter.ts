import { Filter } from './FilterBase';
import type { Task } from '@/core/models/Task';

export class DescriptionFilter extends Filter {
  constructor(
    private operator: 'includes' | 'does not include' | 'regex',
    private pattern: string,
    private caseSensitive = false
  ) {
    super();
  }

  matches(task: Task): boolean {
    const searchText = task.name || '';
    
    switch (this.operator) {
      case 'includes': {
        const needle = this.caseSensitive ? this.pattern : this.pattern.toLowerCase();
        const haystack = this.caseSensitive ? searchText : searchText.toLowerCase();
        return haystack.includes(needle);
      }
      case 'does not include': {
        const needle = this.caseSensitive ? this.pattern : this.pattern.toLowerCase();
        const haystack = this.caseSensitive ? searchText : searchText.toLowerCase();
        return !haystack.includes(needle);
      }
      case 'regex': {
        try {
          const flags = this.caseSensitive ? '' : 'i';
          const regex = new RegExp(this.pattern, flags);
          return regex.test(searchText);
        } catch {
          return false;
        }
      }
    }
  }
}
