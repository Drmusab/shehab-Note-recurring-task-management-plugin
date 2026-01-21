# Query Language Reference

## Overview
The query language allows you to filter, sort, and group tasks using a text-based syntax.

## Core Filters

### 1. Status Filters
```
done                          # Completed tasks
not done                      # Incomplete tasks
status.type is TODO           # Tasks with TODO status
status.type is IN_PROGRESS    # Tasks in progress
status.type is DONE           # Completed tasks
status.type is CANCELLED      # Cancelled tasks
```

### 2. Priority Filters
```
priority is high              # High priority tasks
priority is medium            # Medium priority tasks
priority is low               # Low priority tasks
priority is lowest            # Lowest priority tasks
priority is highest           # Highest priority tasks
priority above low            # Tasks with priority > low
priority below high           # Tasks with priority < high
```

Supported priority levels:
- `lowest` (weight: 0)
- `low` (weight: 1)
- `none` / `normal` / `medium` (weight: 2)
- `high` (weight: 3)
- `highest` / `urgent` (weight: 4)

### 3. Date Filters
```
due today                     # Due today
due before tomorrow           # Due before tomorrow
due after 2025-01-15          # Due after specific date
due on 2025-01-20             # Due on specific date
due on or before today        # Due on or before today
due on or after tomorrow      # Due on or after tomorrow
has due date                  # Has a due date set
no due date                   # No due date
scheduled before next week    # Scheduled before next week
scheduled after yesterday     # Scheduled after yesterday
start after yesterday         # Starts after yesterday
start before next Monday      # Starts before next Monday
```

Supported date fields:
- `due` - Due date
- `scheduled` - Scheduled date
- `start` - Start date
- `created` - Creation date
- `done` - Completion date
- `cancelled` - Cancellation date

### 4. Tag Filters
```
tag includes #work            # Has #work tag
tag does not include #personal # Does not have #personal tag
tags include #important       # Alternative syntax
has tags                      # Has any tags
no tags                       # Has no tags
```

### 5. Path Filters
```
path includes projects        # Path contains "projects"
path does not include archive # Path does not contain "archive"
```

### 6. Description Filters
```
description includes meeting  # Name/description contains "meeting"
description does not include urgent # Does not contain "urgent"
description regex urgent|asap # Matches regex pattern (case-insensitive)
```

The description filter searches both the task name and description fields.

### 7. Recurrence Filters
```
is recurring                  # Recurring tasks
is not recurring              # Non-recurring tasks
```

### 8. Dependency Filters
```
is blocked                    # Blocked by other tasks
is not blocked                # Not blocked
is blocking                   # Blocking other tasks
```

## Boolean Operators

Combine filters using boolean operators:

```
not done AND priority high
due today OR due tomorrow
NOT is blocked
(priority high OR priority urgent) AND not done
```

Supported operators:
- `AND` - Both conditions must be true
- `OR` - At least one condition must be true
- `NOT` - Negates the condition

## Sorting

Sort results by various fields:

```
sort by due                   # Sort by due date
sort by priority              # Sort by priority
sort by priority reverse      # Reverse sort
sort by created               # Sort by creation date
sort by path                  # Sort by file path
sort by description           # Sort by description
```

## Grouping

Group results by various fields:

```
group by priority             # Group by priority level
group by due                  # Group by due date
group by status.type          # Group by status type
group by folder               # Group by folder
group by tags                 # Group by tags
group by path                 # Group by full path
```

## Limiting Results

Limit the number of results returned:

```
limit 10                      # Limit to 10 results
limit to 25 tasks             # Limit to 25 results
```

## Date Values

The query language supports various date formats:

### Relative Dates
- `today`, `tomorrow`, `yesterday`
- `next week`, `last week`
- `in 3 days`, `3 days ago`
- `next Monday`, `last Friday`

### Absolute Dates
- `2025-01-20` (ISO format: YYYY-MM-DD)

## Query Examples

### Basic Filtering
```
# Show incomplete tasks
not done

# Show high priority tasks
priority high

# Show tasks due today
due today

# Show recurring tasks
is recurring
```

### Advanced Filtering
```
# Incomplete high priority tasks
not done AND priority high

# Tasks due today or tomorrow
due today OR due tomorrow

# Incomplete tasks with a due date
not done AND has due date

# Tasks with "meeting" in description
description includes meeting

# High priority or urgent tasks that are not done
(priority high OR priority urgent) AND not done
```

### Sorting and Grouping
```
# Show all incomplete tasks, sorted by priority
not done
sort by priority

# Group incomplete tasks by priority
not done
group by priority

# Show next 10 tasks due
not done
sort by due
limit 10
```

### Complex Queries
```
# High priority incomplete tasks due this week
not done
priority high
due after today
due before next week
sort by due

# Recurring tasks with tags
is recurring
has tags
group by tags

# Blocked tasks that are not done
is blocked
not done
sort by priority reverse
```

## Tips and Best practices

1. **Use multiple lines**: Each filter, sort, group, or limit instruction should be on its own line.

2. **Case sensitivity**: Keywords and operators are case-insensitive, but values (like tags and paths) are case-sensitive.

3. **Quotes**: Use quotes around values with spaces: `tag includes "my tag"`

4. **Date formats**: Prefer ISO format (YYYY-MM-DD) for absolute dates for consistency.

5. **Combining filters**: Multiple filters on separate lines are combined with AND logic by default.

6. **Performance**: More specific filters first can improve query performance.

## Error Handling

If a query fails to parse or execute, you'll receive an error message indicating:
- The line and column where the error occurred
- A description of the problem
- Suggestions for fixing the error

Example error:
```
QuerySyntaxError: Unknown filter instruction: "priority is super-high"
  at line 1, column 1
  Hint: Check the query syntax documentation for valid filter instructions
```

## Validation

You can validate a query without executing it using the `validateQuery` API:

```typescript
const engine = new QueryEngine(taskIndex);
const result = engine.validateQuery("not done AND priority high");

if (result.valid) {
  console.log("Query is valid");
  console.log("Parsed filters:", result.parsedFilters);
} else {
  console.error("Query error:", result.error);
}
```
