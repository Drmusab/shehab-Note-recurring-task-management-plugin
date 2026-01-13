<script lang="ts">
  import { onMount } from "svelte";
  
  interface Props {
    fallback?: string;
    children: any;
  }
  
  let { fallback = "Something went wrong", children }: Props = $props();
  let hasError = $state(false);
  let errorMessage = $state("");
  
  function handleError(event: ErrorEvent) {
    hasError = true;
    errorMessage = event.message;
  }
  
  function retry() {
    hasError = false;
    errorMessage = "";
  }
</script>

{#if hasError}
  <div class="error-boundary">
    <p class="error-boundary__message">{fallback}</p>
    <p class="error-boundary__details">{errorMessage}</p>
    <button class="error-boundary__retry" onclick={retry}>Retry</button>
  </div>
{:else}
  {@render children()}
{/if}

<style>
  .error-boundary {
    padding: 20px;
    text-align: center;
    background: var(--b3-theme-error-light, #ffebee);
    border-radius: 8px;
    margin: 16px;
  }
  
  .error-boundary__message {
    color: var(--b3-theme-error, #d32f2f);
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .error-boundary__details {
    color: var(--b3-theme-on-surface-light);
    font-size: 12px;
    margin-bottom: 16px;
  }
  
  .error-boundary__retry {
    padding: 8px 16px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
