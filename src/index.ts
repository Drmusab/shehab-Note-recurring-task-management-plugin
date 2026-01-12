import { Plugin } from "siyuan";
import { mount, unmount } from "svelte";
import Dashboard from "./components/Dashboard.svelte";
import { TaskStorage } from "./core/storage/TaskStorage";
import { Scheduler } from "./core/engine/Scheduler";
import { NotificationState } from "./core/engine/NotificationState";
import { MigrationManager } from "./core/storage/MigrationManager";
import { EventService } from "./services/EventService";
import { DOCK_TYPE, NOTIFICATION_STATE_KEY, STORAGE_KEY } from "./utils/constants";
import * as logger from "./utils/logger";
import "./index.scss";

export default class RecurringTasksPlugin extends Plugin {
  private storage!: TaskStorage;
  private scheduler!: Scheduler;
  private eventService!: EventService;
  private notificationState!: NotificationState;
  private migrationManager!: MigrationManager;
  private dashboardComponent: ReturnType<typeof mount> | null = null;
  private dockEl!: HTMLElement;

  async onload() {
    logger.info("Loading Recurring Tasks Plugin");

    // Initialize migration manager
    this.migrationManager = new MigrationManager(this);

    // Run migrations
    try {
      await this.migrationManager.migrate(STORAGE_KEY);
    } catch (err) {
      logger.error("Migration failed, continuing with existing data", err);
    }

    // Initialize storage
    this.storage = new TaskStorage(this);
    await this.storage.init();

    // Initialize notification state
    this.notificationState = new NotificationState(this, NOTIFICATION_STATE_KEY);
    await this.notificationState.load();

    // Initialize event service
    this.eventService = new EventService(this);
    await this.eventService.init();

    // Initialize scheduler with notification state
    this.scheduler = new Scheduler(this.storage, this.notificationState);
    this.scheduler.start(
      async (task) => {
        logger.info(`Task due: ${task.name}`);
        await this.eventService.emitTaskEvent("task.due", task);
      },
      async (task) => {
        logger.warn(`Task missed: ${task.name}`);
        await this.eventService.emitTaskEvent("task.missed", task);
      }
    );

    // Add dock panel
    this.addDock({
      config: {
        position: "RightBottom",
        size: { width: 400, height: 600 },
        icon: "iconCalendar",
        title: "Recurring Tasks",
      },
      data: null,
      type: DOCK_TYPE,
      init: (dock) => {
        this.dockEl = dock.element;
        this.renderDashboard();
      },
      destroy: () => {
        this.destroyDashboard();
      },
    });

    logger.info("Recurring Tasks Plugin loaded successfully");
  }

  async onunload() {
    logger.info("Unloading Recurring Tasks Plugin");
    
    // Stop scheduler
    this.scheduler.stop();
    this.eventService.stopQueueWorker();

    // Save notification state
    await this.notificationState.forceSave();
    
    // Destroy dashboard
    this.destroyDashboard();
  }

  private renderDashboard() {
    if (this.dockEl && !this.dashboardComponent) {
      this.dashboardComponent = mount(Dashboard, {
        target: this.dockEl,
        props: {
          storage: this.storage,
          scheduler: this.scheduler,
          eventService: this.eventService,
        },
      });
    }
  }

  private destroyDashboard() {
    if (this.dashboardComponent) {
      unmount(this.dashboardComponent);
      this.dashboardComponent = null;
    }
  }
}
