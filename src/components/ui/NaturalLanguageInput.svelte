<script lang="ts">
  import { NaturalLanguageParser, type ParseResult } from '@/core/parsers/NaturalLanguageParser';
  import type { Task } from '@/core/models/Task';
  import type { Frequency } from '@/core/models/Frequency';

  // Maximum length for task titles
  const MAX_TASK_TITLE_LENGTH = 500;

  interface Props {
    onTaskCreated?: (task: Partial<Task>) => void;
    initialValue?: string;
  }

  let { onTaskCreated, initialValue = '' }: Props = $props();

  const parser = new NaturalLanguageParser();
  
  let naturalInput = $state(initialValue);
  let parsedResult = $state<ParseResult | null>(null);
  let parseError = $state<string | null>(null);
  let showPreview = $state(false);
  
  const examplePatterns = [
    'every weekday at 9am',
    'every Monday at 2pm',
    'every 2 weeks on Friday',
    'every 1st Monday',
    'every 15th',
    'every last Friday of the month',
    'every 2 days',
    'every month on the 1st and 15th'
  ];

  function handleInput() {
    if (!naturalInput.trim()) {
      parsedResult = null;
      parseError = null;
      showPreview = false;
      return;
    }

    try {
      const result = parser.parse(naturalInput);
      
      // Validate result structure
      if (!result || typeof result !== 'object') {
        parseError = "Parser returned invalid result";
        parsedResult = null;
        showPreview = false;
        return;
      }
      
      // Check confidence threshold and validate frequency
      if (result.frequency && 
          typeof result.confidence === 'number' && 
          result.confidence > 0.5) {
        parsedResult = result;
        parseError = null;
        showPreview = true;
      } else if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
        parseError = result.errors[0];
        parsedResult = null;
        showPreview = false;
      } else {
        parseError = "I couldn't understand that pattern. Try: 'every weekday at 9am'";
        parsedResult = null;
        showPreview = false;
      }
    } catch (err) {
      parseError = err instanceof Error ? err.message : "Failed to parse input";
      parsedResult = null;
      showPreview = false;
    }
  }

  function createTask() {
    // Validate parsedResult before creating task
    if (!parsedResult || typeof parsedResult !== 'object') {
      parseError = "No valid parse result available";
      return;
    }

    if (!parsedResult.frequency) {
      parseError = "No frequency pattern detected";
      return;
    }

    // Validate task title
    const taskTitle = naturalInput.trim();
    if (!taskTitle || taskTitle.length === 0) {
      parseError = "Task title cannot be empty";
      return;
    }

    if (taskTitle.length > MAX_TASK_TITLE_LENGTH) {
      parseError = `Task title too long (max ${MAX_TASK_TITLE_LENGTH} characters)`;
      return;
    }

    try {
      const partialTask: Partial<Task> = {
        name: taskTitle,
        frequency: parsedResult.frequency,
        recurrenceText: parsedResult.naturalLanguage || naturalInput
      };

      onTaskCreated?.(partialTask);
      
      // Reset form
      naturalInput = '';
      parsedResult = null;
      parseError = null;
      showPreview = false;
    } catch (err) {
      parseError = err instanceof Error ? err.message : "Failed to create task";
    }
  }

  function useExample(example: string) {
    naturalInput = example;
    handleInput();
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return '#4caf50';
    if (confidence >= 0.7) return '#ff9800';
    return '#f44336';
  }

  function formatFrequency(freq: Frequency): string {
    switch (freq.type) {
      case 'daily':
        return freq.interval === 1 ? 'Daily' : `Every ${freq.interval} days`;
      case 'weekly':
        const days = freq.weekdays?.length 
          ? ` on ${freq.weekdays.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d]).join(', ')}`
          : '';
        return freq.interval === 1 ? `Weekly${days}` : `Every ${freq.interval} weeks${days}`;
      case 'monthly':
        return freq.interval === 1 ? 'Monthly' : `Every ${freq.interval} months`;
      case 'yearly':
        return freq.interval === 1 ? 'Yearly' : `Every ${freq.interval} years`;
      default:
        return 'Custom';
    }
  }
</script>

<div class="nl-input-container">
  <div class="nl-input-header">
    <h3>Create Task with Natural Language</h3>
    <p class="nl-input-description">
      Describe your recurring task in plain English
    </p>
  </div>

  <div class="nl-input-field">
    <textarea
      bind:value={naturalInput}
      oninput={handleInput}
      placeholder="Example: Review inbox every weekday at 9am"
      rows="3"
      class="nl-input-textarea"
    />
  </div>

  {#if parsedResult && showPreview}
    <div class="nl-preview">
      <div class="nl-preview-header">
        <h4>Understood as:</h4>
        <div class="confidence-badge" style="background-color: {getConfidenceColor(parsedResult.confidence)}">
          {Math.round(parsedResult.confidence * 100)}% confident
        </div>
      </div>
      
      <div class="nl-preview-details">
        <div class="preview-row">
          <span class="preview-label">Pattern:</span>
          <span class="preview-value">{formatFrequency(parsedResult.frequency!)}</span>
        </div>
        
        {#if parsedResult.naturalLanguage}
          <div class="preview-row">
            <span class="preview-label">Interpreted as:</span>
            <span class="preview-value">{parsedResult.naturalLanguage}</span>
          </div>
        {/if}

        {#if parsedResult.alternatives && parsedResult.alternatives.length > 0}
          <div class="preview-row">
            <span class="preview-label">Alternatives:</span>
            <span class="preview-value">
              {parsedResult.alternatives.map(f => formatFrequency(f)).join(', ')}
            </span>
          </div>
        {/if}
      </div>

      <button onclick={createTask} class="nl-create-btn">
        Create Task
      </button>
    </div>
  {/if}

  {#if parseError}
    <div class="nl-error">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 4h2v5H7V4zm0 6h2v2H7v-2z"/>
      </svg>
      <span>{parseError}</span>
    </div>
  {/if}

  <div class="nl-examples">
    <h4>Example patterns:</h4>
    <div class="examples-grid">
      {#each examplePatterns as example}
        <button 
          onclick={() => useExample(example)}
          class="example-btn"
        >
          {example}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .nl-input-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--b3-theme-background);
    border-radius: 8px;
    border: 1px solid var(--b3-border-color);
  }

  .nl-input-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    color: var(--b3-theme-on-background);
  }

  .nl-input-description {
    margin: 0;
    font-size: 0.9rem;
    color: var(--b3-theme-on-surface-light);
  }

  .nl-input-textarea {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    font-family: inherit;
    border: 2px solid var(--b3-border-color);
    border-radius: 4px;
    background-color: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    resize: vertical;
    min-height: 80px;
  }

  .nl-input-textarea:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }

  .nl-preview {
    padding: 1rem;
    background-color: var(--b3-theme-surface);
    border-radius: 4px;
    border: 2px solid var(--b3-theme-primary);
  }

  .nl-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .nl-preview-header h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--b3-theme-on-background);
  }

  .confidence-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
  }

  .nl-preview-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .preview-row {
    display: flex;
    gap: 0.5rem;
  }

  .preview-label {
    font-weight: 600;
    color: var(--b3-theme-on-surface-light);
    min-width: 120px;
  }

  .preview-value {
    color: var(--b3-theme-on-surface);
  }

  .nl-create-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .nl-create-btn:hover {
    background-color: var(--b3-theme-primary-light);
  }

  .nl-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: #ffebee;
    border: 1px solid #f44336;
    border-radius: 4px;
    color: #c62828;
    font-size: 0.9rem;
  }

  .nl-examples {
    margin-top: 0.5rem;
  }

  .nl-examples h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
    color: var(--b3-theme-on-surface-light);
  }

  .examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
  }

  .example-btn {
    padding: 0.5rem 0.75rem;
    background-color: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    font-size: 0.85rem;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .example-btn:hover {
    background-color: var(--b3-theme-surface-light);
    border-color: var(--b3-theme-primary);
  }
</style>
