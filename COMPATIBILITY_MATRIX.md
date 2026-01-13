# Compatibility Matrix: shehab-Note vs SiYuan

## Overview
This document maps all dependencies the plugin has on the SiYuan/shehab-note environment and assesses compatibility risks.

## SiYuan Plugin API Dependencies

| API / Feature | Usage Location | Purpose | Upstream Behavior | Fork Differences | Risk Level | Status | Fix Approach |
|--------------|----------------|---------|-------------------|------------------|------------|--------|--------------|
| `Plugin` class | index.ts | Main plugin base class | Provides lifecycle hooks (onload, onunload), data persistence (loadData, saveData), UI registration (addDock, addCommand) | **Assumed identical** - shehab-note is a fork, likely maintains API compatibility | **Low** | ✅ Working | Monitor for API changes |
| `Plugin.loadData()` | TaskStorage, EventService, Scheduler, NotificationState, MigrationManager | Persistence layer for tasks, settings, queue, state | Async JSON persistence keyed by string | **Assumed identical** | **Low** | ✅ Working | None needed |
| `Plugin.saveData()` | TaskStorage, EventService, Scheduler, NotificationState, MigrationManager | Persistence layer for tasks, settings, queue, state | Async JSON persistence keyed by string | **Assumed identical** | **Low** | ✅ Working | None needed |
| `Plugin.addDock()` | index.ts | Adds right-side dock panel for dashboard UI | Returns dock element for mounting Svelte component | **Assumed identical** | **Low** | ✅ Working | None needed |
| `Plugin.openDock()` | commands.ts | Programmatically opens dock panel | Shows dock panel | **Assumed identical** | **Low** | ✅ Working | None needed |
| `Plugin.addCommand()` | commands.ts | Register slash commands & hotkeys | Adds global commands with langKey and hotkey | **Assumed identical** | **Low** | ✅ Working | None needed |
| `confirm()` | notifications.ts | Native confirm dialog | Shows SiYuan-styled confirm dialog | **Assumed identical** | **Low** | ✅ Working | Already wrapped in `confirmDialog()` |
| `fetchPost()` | blocks.ts | API call to fetch block info | Calls SiYuan backend API | **Unknown** - May differ if shehab-note has modified backend | **Medium** | ⚠️ Needs testing | Add error handling and fallback |
| `globalThis.setBlockAttrs` | SiYuanApiAdapter.ts | Set custom block attributes | Sets custom attributes on blocks | **Unknown** - May differ or be unavailable | **Medium** | ⚠️ Gracefully degraded | Already has capability checks and fallback |
| `globalThis.siyuan.config.system.dataDir` | SiYuanApiAdapter.ts | Get data directory path | Returns system data directory | **Unknown** | **Low** | ℹ️ Optional | Already has capability checks |

## DOM/CSS Assumptions

| Assumption | Location | Purpose | Risk Level | Status | Fix Approach |
|-----------|----------|---------|------------|--------|--------------|
| `document.body` exists | notifications.ts | Append toast notifications | **Low** | ✅ Safe | Standard browser API |
| `document.createElement()` | notifications.ts | Create toast elements | **Low** | ✅ Safe | Standard browser API |
| CSS custom properties | Multiple .scss files | Theme integration | **Medium** | ⚠️ Needs verification | Use SiYuan CSS variables or provide fallbacks |
| `position: fixed` | notifications.ts | Toast positioning | **Low** | ✅ Safe | Standard CSS |
| DOM animations | notifications.ts | Toast slide-in/out | **Low** | ✅ Safe | Standard CSS animations |
| `.b3-theme-*` classes | Various Svelte components | SiYuan theme integration | **Medium** | ⚠️ Needs verification | Verify shehab-note uses same theme classes |

## Build Tooling & Module Format

| Tool/Format | Location | Purpose | Risk Level | Status | Fix Approach |
|------------|----------|---------|------------|--------|--------------|
| Vite 5.3.3 | vite.config.ts, package.json | Build system | **Low** | ✅ Working | None needed |
| TypeScript 5.5.3 | tsconfig.json, package.json | Type checking and compilation | **Low** | ✅ Working | None needed |
| Svelte 5.1.9 | Multiple .svelte files | UI framework | **Low** | ✅ Working | None needed |
| ESNext modules | tsconfig.json | Module system | **Low** | ✅ Working | None needed |
| SCSS/Sass | index.scss, component styles | Styling | **Low** | ✅ Working | None needed (with deprecation warning) |

## Window/Global Events

| Event Type | Location | Purpose | Risk Level | Status | Fix Approach |
|-----------|----------|---------|------------|--------|--------------|
| `CustomEvent` | commands.ts, plugin/menus.ts | Plugin-internal communication | **Low** | ✅ Working | Already migrated to EventBus in parallel |
| `window.addEventListener` | index.ts | Event listener registration | **Low** | ✅ Working | None needed |
| `window.dispatchEvent` | commands.ts, plugin/menus.ts | Event dispatching | **Low** | ✅ Working | None needed |
| `window.setTimeout` | Scheduler.ts, EventService.ts, notifications.ts | Async scheduling | **Low** | ⚠️ Test environment issue | Use `globalThis.setTimeout` for Node.js compatibility |
| `window.clearTimeout` | Scheduler.ts, EventService.ts, index.ts | Timer cleanup | **Low** | ⚠️ Test environment issue | Use `globalThis.clearTimeout` for Node.js compatibility |
| `window.setInterval` | EventService.ts | Periodic tasks | **Low** | ⚠️ Test environment issue | Use `globalThis.setInterval` for Node.js compatibility |
| `window.clearInterval` | EventService.ts | Timer cleanup | **Low** | ⚠️ Test environment issue | Use `globalThis.clearInterval` for Node.js compatibility |

## Internationalization (i18n)

| Feature | Location | Purpose | Risk Level | Status | Fix Approach |
|---------|----------|---------|------------|--------|--------------|
| `en_US.json` | src/i18n/ | English translations | **Low** | ✅ Working | None needed |
| `zh_CN.json` | src/i18n/ | Chinese translations | **Low** | ✅ Working | None needed |
| Plugin i18n system | plugin.json | Plugin metadata translations | **Low** | ✅ Working | None needed |

## Storage Keys

| Key | Purpose | Collision Risk | Status | Fix Approach |
|-----|---------|----------------|--------|--------------|
| `recurring-tasks-active` | Active tasks storage | **Low** - Plugin-scoped | ✅ Working | None needed |
| `recurring-tasks-archive` | Archived tasks storage | **Low** - Plugin-scoped | ✅ Working | None needed |
| `recurring-tasks` | Legacy tasks storage | **Low** - Migration path | ✅ Working | None needed |
| `n8n-event-settings` | Notification settings | **Low** - Plugin-scoped | ✅ Working | None needed |
| `n8n-event-queue` | Event queue | **Low** - Plugin-scoped | ✅ Working | None needed |
| `notification-state` | Notification tracking | **Low** - Plugin-scoped | ✅ Working | None needed |
| `scheduler-emitted-occurrences` | Scheduler deduplication | **Low** - Plugin-scoped | ✅ Working | None needed |
| `last-run-timestamp` | Missed task recovery | **Low** - Plugin-scoped | ✅ Working | None needed |

## External Dependencies

| Dependency | Version | Purpose | Risk Level | Status | Fix Approach |
|-----------|---------|---------|------------|--------|--------------|
| `siyuan` | 1.1.7 | TypeScript types & utilities | **Low** | ✅ Working | Verify shehab-note package compatibility |
| `svelte` | 5.1.9 | UI framework | **None** | ✅ Working | Independent of SiYuan |
| `vite` | 5.3.3 | Build tool | **None** | ✅ Working | Independent of SiYuan |
| `typescript` | 5.5.3 | Type system | **None** | ✅ Working | Independent of SiYuan |

## Risk Summary

### High Risk (P0)
- None identified

### Medium Risk (P1)
1. **CSS Theme Variables** - Verify shehab-note uses same CSS variable naming as SiYuan
2. **`fetchPost()` API** - May have backend differences in shehab-note fork
3. **Block Attributes API** - Already has graceful degradation, but test in real environment

### Low Risk (P2)
1. **Timer APIs in Tests** - Use `globalThis` instead of `window` for Node.js compatibility
2. **Global SiYuan API** - Monitor for API changes between versions

## Testing Strategy

### Unit Tests
- ✅ 92/101 tests passing
- ⚠️ 9 tests failing due to `window` reference in Node.js test environment

### Integration Tests Needed
1. **In shehab-note environment**:
   - Test dock panel rendering
   - Test block attribute sync
   - Test fetchPost API calls
   - Test CSS theme integration
   - Verify i18n keys match

2. **Cross-version testing**:
   - Test with different shehab-note versions
   - Test migration paths

## Conclusion

**Overall Compatibility: HIGH** ✅

The plugin is well-architected with:
- Strong API abstraction (SiYuanApiAdapter)
- Graceful degradation for optional features
- Minimal assumptions about fork-specific behavior
- Good separation of concerns

**Immediate Actions Required:**
1. Fix `window` → `globalThis` for test compatibility (P1)
2. Test in real shehab-note environment for CSS/API verification (P1)
3. Document any shehab-note specific differences found (P2)

**Long-term Monitoring:**
- Track shehab-note fork divergence from upstream SiYuan
- Monitor breaking changes in plugin API
- Test with each major shehab-note release
