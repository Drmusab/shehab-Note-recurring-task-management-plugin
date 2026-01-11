import { Plugin } from "siyuan";
import { mount, unmount } from "svelte";
import Dashboard from "./components/Dashboard.svelte";
import { TaskStorage } from "./core/storage/TaskStorage";
import { Scheduler } from "./core/engine/Scheduler";
import { NotificationService } from "./services/NotificationService";
import { DOCK_TYPE } from "./utils/constants";
import "./index.scss";

export default class RecurringTasksPlugin extends Plugin {
  private storage!: TaskStorage;
  private scheduler!: Scheduler;
  private notificationService!: NotificationService;
  private dashboardComponent: ReturnType<typeof mount> | null = null;
  private dockEl!: HTMLElement;

  async onload() {
    console.log("Loading Recurring Tasks Plugin");

    // Initialize storage
    this.storage = new TaskStorage(this);
    await this.storage.init();

    // Initialize notification service
    this.notificationService = new NotificationService(this);
    await this.notificationService.init();

    // Initialize scheduler
    this.scheduler = new Scheduler(this.storage);
    this.scheduler.start(async (task) => {
      console.log(`Task due: ${task.name}`);
      await this.notificationService.notifyTask(task);
    });

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

    console.log("Recurring Tasks Plugin loaded successfully");
  }

  async onunload() {
    console.log("Unloading Recurring Tasks Plugin");
    
    // Stop scheduler
    this.scheduler.stop();
    
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
          notificationService: this.notificationService,
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
