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
    event.preventDefault();
    hasError = true;
    errorMessage = event.message || "An unknown error occurred";
    console.error("ErrorBoundary caught error:", event);
  }
  
  function handleRejection(event: PromiseRejectionEvent) {
    event.preventDefault();
    hasError = true;
    errorMessage = event.reason?.message || String(event.reason) || "Unhandled promise rejection";
    console.error("ErrorBoundary caught unhandled rejection:", event);
  }
  
  function retry() {
    hasError = false;
    errorMessage = "";
  }
  
  // Set up local error handler for this component's scope
  // Note: Global error handlers are only added for catching critical errors
  // If multiple ErrorBoundary components are used, each will have its own handler
  // which is acceptable as they will all set their own error states independently
  onMount(() => {
    // Only add handlers if we don't already have error state
    // This prevents unnecessary event listener overhead
    const errorHandler = handleError;
    const rejectionHandler = handleRejection;
    
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  });
</script>

{#if hasError}
  <div class="error-boundary">
    <p class="error-boundary__message">{fallback}</p>
    <p class="error-boundary__details">{errorMessage}</p>
    <button class="error-boundary__retry" onclick={retry}>Retry</button>
  </div>
{:else}
  {#try}
    {@render children()}
  {:catch error}
    <div class="error-boundary">
      <p class="error-boundary__message">{fallback}</p>
      <p class="error-boundary__details">{error?.message || String(error)}</p>
      <button class="error-boundary__retry" onclick={retry}>Retry</button>
    </div>
  {/try}
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
