<script lang="ts">
  import type { Task } from '@/core/models/Task';
  import { SmartRecurrenceEngine, type CompletionInsight, type ScheduleSuggestion, type Anomaly } from '@/core/ml/PatternLearner';

  interface Props {
    tasks: Task[];
    onApplySuggestion?: (task: Task, suggestion: ScheduleSuggestion) => void;
  }

  let { tasks, onApplySuggestion }: Props = $props();

  const engine = new SmartRecurrenceEngine();
  
  // Filter tasks that have smart recurrence enabled
  const smartTasks = $derived(tasks.filter(t => 
    t.smartRecurrence?.enabled && 
    t.completionHistory && 
    t.completionHistory.length >= 5
  ));

  // Generate insights for each task
  const taskInsights = $derived(smartTasks.map(task => ({
    task,
    insight: engine.analyzeCompletionPatterns(task),
    suggestion: engine.suggestScheduleOptimization(task),
    anomalies: engine.detectAnomalies(task)
  })));

  // Sort by confidence (highest first)
  const sortedInsights = $derived(
    taskInsights.sort((a, b) => b.insight.confidence - a.insight.confidence)
  );

  function applySuggestion(task: Task, suggestion: ScheduleSuggestion) {
    onApplySuggestion?.(task, suggestion);
  }

  function formatDelay(minutes: number): string {
    if (Math.abs(minutes) < 60) {
      return `${Math.abs(minutes)} minutes`;
    }
    const hours = Math.abs(Math.round(minutes / 60));
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  function formatTime(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  function getConsistencyLabel(score: number): string {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Inconsistent';
  }

  function getConsistencyColor(score: number): string {
    if (score >= 0.8) return '#4caf50';
    if (score >= 0.6) return '#2196f3';
    if (score >= 0.4) return '#ff9800';
    return '#f44336';
  }

  function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
    switch (severity) {
      case 'low': return '#ff9800';
      case 'medium': return '#ff5722';
      case 'high': return '#f44336';
    }
  }
</script>

<div class="insights-tab">
  <div class="insights-header">
    <h2>Smart Insights</h2>
    <p>Learn from your task completion patterns to optimize your schedule</p>
  </div>

  {#if smartTasks.length === 0}
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3>No Smart Tasks Yet</h3>
      <p>Enable smart recurrence on your tasks and complete them at least 5 times to see insights.</p>
    </div>
  {:else}
    <div class="insights-list">
      {#each sortedInsights as { task, insight, suggestion, anomalies }}
        <div class="insight-card">
          <div class="insight-header">
            <h3>{task.name}</h3>
            <div class="confidence-badge" style="background-color: {getConsistencyColor(insight.confidence)}">
              {Math.round(insight.confidence * 100)}% confidence
            </div>
          </div>

          <div class="insight-stats">
            <div class="stat-item">
              <span class="stat-label">Consistency</span>
              <span class="stat-value" style="color: {getConsistencyColor(insight.completionConsistency)}">
                {getConsistencyLabel(insight.completionConsistency)}
              </span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Avg Delay</span>
              <span class="stat-value">
                {insight.averageCompletionDelay > 0 ? '+' : ''}{formatDelay(insight.averageCompletionDelay)}
              </span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Preferred Time</span>
              <span class="stat-value">{formatTime(insight.preferredTimeOfDay)}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Completion Rate</span>
              <span class="stat-value">
                {Math.round(100 - insight.missedTaskFrequency)}%
              </span>
            </div>
          </div>

          {#if insight.suggestedAdjustment}
            <div class="suggestion-box">
              <div class="suggestion-icon">💡</div>
              <p>{insight.suggestedAdjustment}</p>
            </div>
          {/if}

          {#if suggestion}
            <div class="schedule-suggestion">
              <h4>Suggested Schedule Adjustment</h4>
              <div class="schedule-comparison">
                <div class="schedule-column">
                  <span class="schedule-label">Current</span>
                  <span class="schedule-value">
                    {suggestion.currentSchedule.time || 'Not set'}
                  </span>
                </div>
                <div class="schedule-arrow">→</div>
                <div class="schedule-column">
                  <span class="schedule-label">Suggested</span>
                  <span class="schedule-value">
                    {suggestion.suggestedSchedule.time || 'Not set'}
                  </span>
                </div>
              </div>
              <p class="suggestion-reason">{suggestion.reason}</p>
              <p class="suggestion-improvement">Expected: {suggestion.expectedImprovement}</p>
              <button 
                onclick={() => applySuggestion(task, suggestion)}
                class="apply-btn"
              >
                Apply Suggestion
              </button>
            </div>
          {/if}

          {#if anomalies.length > 0}
            <div class="anomalies-section">
              <h4>⚠️ Detected Issues</h4>
              {#each anomalies as anomaly}
                <div class="anomaly-card" style="border-left-color: {getSeverityColor(anomaly.severity)}">
                  <div class="anomaly-header">
                    <span class="anomaly-type">{anomaly.type.replace(/_/g, ' ')}</span>
                    <span class="anomaly-severity" style="background-color: {getSeverityColor(anomaly.severity)}">
                      {anomaly.severity}
                    </span>
                  </div>
                  <p class="anomaly-description">{anomaly.description}</p>
                  <p class="anomaly-suggestion">💡 {anomaly.suggestion}</p>
                </div>
              {/each}
            </div>
          {/if}

          {#if task.completionHistory && task.completionHistory.length > 0}
            <div class="history-summary">
              <span class="history-label">
                📊 {task.completionHistory.length} completions tracked
              </span>
              {#if task.learningMetrics}
                <span class="history-label">
                  Last updated: {new Date(task.learningMetrics.lastLearningUpdate).toLocaleDateString()}
                </span>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .insights-tab {
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .insights-header {
    margin-bottom: 2rem;
  }

  .insights-header h2 {
    margin: 0 0 0.5rem 0;
    color: var(--b3-theme-on-background);
  }

  .insights-header p {
    margin: 0;
    color: var(--b3-theme-on-surface-light);
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--b3-theme-on-surface-light);
  }

  .empty-state svg {
    opacity: 0.5;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: var(--b3-theme-on-background);
  }

  .insights-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .insight-card {
    background-color: var(--b3-theme-surface);
    border-radius: 8px;
    border: 1px solid var(--b3-border-color);
    padding: 1.5rem;
  }

  .insight-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .insight-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--b3-theme-on-background);
  }

  .confidence-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
  }

  .insight-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--b3-theme-on-surface-light);
  }

  .stat-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .suggestion-box {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background-color: var(--b3-theme-background);
    border-radius: 4px;
    margin: 1rem 0;
  }

  .suggestion-icon {
    font-size: 1.5rem;
  }

  .suggestion-box p {
    margin: 0;
    color: var(--b3-theme-on-surface);
  }

  .schedule-suggestion {
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--b3-theme-background);
    border-radius: 4px;
    border: 2px solid var(--b3-theme-primary);
  }

  .schedule-suggestion h4 {
    margin: 0 0 1rem 0;
    color: var(--b3-theme-on-background);
  }

  .schedule-comparison {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .schedule-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .schedule-label {
    font-size: 0.85rem;
    color: var(--b3-theme-on-surface-light);
  }

  .schedule-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .schedule-arrow {
    font-size: 1.5rem;
    color: var(--b3-theme-primary);
  }

  .suggestion-reason,
  .suggestion-improvement {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: var(--b3-theme-on-surface);
  }

  .suggestion-improvement {
    font-style: italic;
    color: var(--b3-theme-on-surface-light);
  }

  .apply-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
  }

  .apply-btn:hover {
    opacity: 0.9;
  }

  .anomalies-section {
    margin-top: 1rem;
  }

  .anomalies-section h4 {
    margin: 0 0 0.75rem 0;
    color: var(--b3-theme-on-background);
  }

  .anomaly-card {
    padding: 1rem;
    background-color: var(--b3-theme-background);
    border-left: 4px solid;
    border-radius: 4px;
    margin-bottom: 0.75rem;
  }

  .anomaly-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .anomaly-type {
    font-weight: 600;
    text-transform: capitalize;
    color: var(--b3-theme-on-surface);
  }

  .anomaly-severity {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
  }

  .anomaly-description {
    margin: 0 0 0.5rem 0;
    color: var(--b3-theme-on-surface);
  }

  .anomaly-suggestion {
    margin: 0;
    font-size: 0.9rem;
    color: var(--b3-theme-on-surface-light);
  }

  .history-summary {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--b3-border-color);
  }

  .history-label {
    font-size: 0.85rem;
    color: var(--b3-theme-on-surface-light);
  }
</style>
