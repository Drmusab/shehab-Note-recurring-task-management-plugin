<script lang="ts">
  import { onMount } from "svelte";
  import { POSTPONE_PRESETS } from "@/utils/constants";

  interface Props {
    taskName: string;
    onSelect: (minutes: number) => void;
    onClose: () => void;
  }

  let { taskName, onSelect, onClose }: Props = $props();
  let firstOption: HTMLButtonElement | null = $state(null);

  function setFirstOption(node: HTMLElement, shouldSet: boolean) {
    if (shouldSet) {
      firstOption = node as HTMLButtonElement;
    }
  }

  onMount(() => {
    requestAnimationFrame(() => {
      firstOption?.focus();
    });
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }
</script>

<div class="postpone-overlay" onkeydown={handleKeydown} role="dialog" aria-modal="true" aria-labelledby="postpone-title">
  <div class="postpone-card" role="document">
    <div class="postpone-card__header">
      <h2 id="postpone-title">Postpone task</h2>
      <button class="postpone-card__close" type="button" onclick={onClose} aria-label="Close">
        ✕
      </button>
    </div>

    <p class="postpone-card__summary">
      Choose a new due offset for <strong>{taskName}</strong>.
    </p>

    <div class="postpone-card__options" role="list">
      {#each POSTPONE_PRESETS as option, index}
        <button
          use:setFirstOption={index === 0}
          class="postpone-card__option"
          type="button"
          role="listitem"
          onclick={() => onSelect(option.minutes)}
        >
          {option.label}
        </button>
      {/each}
    </div>

    <div class="postpone-card__actions">
      <button class="postpone-card__cancel" type="button" onclick={onClose}>
        Cancel
      </button>
    </div>
  </div>
</div>

<style>
  .postpone-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 20px;
  }

  .postpone-card {
    width: min(360px, 100%);
    background: var(--b3-theme-surface);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  }

  .postpone-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .postpone-card__header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--b3-theme-on-surface);
  }

  .postpone-card__close {
    border: none;
    background: transparent;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    font-size: 16px;
  }

  .postpone-card__summary {
    margin: 0 0 16px 0;
    color: var(--b3-theme-on-surface-light);
  }

  .postpone-card__options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .postpone-card__option {
    background: var(--b3-theme-surface-lighter);
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    text-align: left;
    color: var(--b3-theme-on-surface);
  }

  .postpone-card__option:hover,
  .postpone-card__option:focus-visible {
    border-color: var(--b3-theme-primary);
    outline: none;
  }

  .postpone-card__actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .postpone-card__cancel {
    background: transparent;
    border: none;
    color: var(--b3-theme-on-surface-light);
    cursor: pointer;
  }
</style>
