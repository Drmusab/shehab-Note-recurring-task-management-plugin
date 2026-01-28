<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { extractKeys, formatKeyCombo } from '@/utils/keyboardHandler';
  
  export let currentKeys: string[] = [];
  export let conflictMessage: string = '';
  
  const dispatch = createEventDispatcher<{ recorded: string[] }>();
  
  let recording = false;
  let recordedKeys: string[] = [];
  
  function startRecording() {
    recording = true;
    recordedKeys = [];
    conflictMessage = '';
    window.addEventListener('keydown', handleRecordKeydown);
    window.addEventListener('keyup', handleRecordKeyup);
  }
  
  function stopRecording() {
    recording = false;
    window.removeEventListener('keydown', handleRecordKeydown);
    window.removeEventListener('keyup', handleRecordKeyup);
  }
  
  // Clean up on component destroy
  onDestroy(() => {
    if (recording) {
      stopRecording();
    }
  });
  
  function handleRecordKeydown(e: KeyboardEvent) {
    if (!recording) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const keys = extractKeys(e);
    
    // If Enter is pressed, finalize recording
    if (e.key === 'Enter' && recordedKeys.length > 0) {
      dispatch('recorded', recordedKeys);
      stopRecording();
      return;
    }
    
    // If Escape, cancel recording
    if (e.key === 'Escape') {
      recordedKeys = [];
      stopRecording();
      return;
    }
    
    // Update recorded keys
    recordedKeys = keys;
  }
  
  function handleRecordKeyup(e: KeyboardEvent) {
    if (!recording) return;
    
    // If all keys released and we have a recording, finalize
    if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && recordedKeys.length > 0) {
      dispatch('recorded', recordedKeys);
      stopRecording();
    }
  }
  
  function handleCancel() {
    recordedKeys = [];
    stopRecording();
  }
</script>

<div class="shortcut-recorder">
  {#if recording}
    <div class="recording-state">
      <span class="recording-indicator">⏺️ Recording...</span>
      {#if recordedKeys.length > 0}
        <span class="recorded-keys">{formatKeyCombo(recordedKeys)}</span>
      {/if}
      <button type="button" on:click={handleCancel} class="cancel-btn">
        Cancel
      </button>
    </div>
  {:else}
    <button type="button" on:click={startRecording} class="record-btn">
      Record
    </button>
    {#if currentKeys.length > 0}
      <span class="current-keys">{formatKeyCombo(currentKeys)}</span>
    {/if}
  {/if}
  
  {#if conflictMessage}
    <span class="conflict-message">{conflictMessage}</span>
  {/if}
</div>

<style>
  .shortcut-recorder {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .recording-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: pulse 1s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  .recording-indicator {
    color: var(--text-error);
    font-weight: 500;
    font-size: 0.85rem;
  }
  
  .recorded-keys {
    padding: 0.25rem 0.5rem;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .current-keys {
    padding: 0.25rem 0.5rem;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.85rem;
  }
  
  .record-btn,
  .cancel-btn {
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--background-modifier-border);
    border-radius: 3px;
    background: var(--interactive-normal);
    color: var(--text-normal);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .record-btn:hover,
  .cancel-btn:hover {
    background: var(--interactive-hover);
    border-color: var(--interactive-accent);
  }
  
  .record-btn:focus,
  .cancel-btn:focus {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }
  
  .conflict-message {
    color: var(--text-error);
    font-size: 0.8rem;
    font-style: italic;
  }
</style>
