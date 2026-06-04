import { createTask, TaskStatus } from "Tasks";
import { getProvider, type TaskProvider } from "Tasks/providers";

class ExtendCreep extends Creep {
  public work(): void {
    if (!Memory.creepConfigs) {
      Memory.creepConfigs = {};
    }
    const config = Memory.creepConfigs[this.memory.configName];
    if (!config) {
      console.log(`creep ${this.name} has no config`);
      return;
    }
    const provider = getProvider(config.role);
    if (!provider) {
      console.log(`creep ${this.name} has no provider`);
      return;
    }
    this.runTask(provider, config.args);
  }

  // 读 memory.task → 工厂重建 → run → 按 Done/Invalid 向 Provider 要下一个
  private runTask(provider: TaskProvider, args: Record<string, any>): void {
    if (!this.memory.task) {
      this.memory.task = provider(this, args);
    }
    const status = createTask(this.memory.task).run(this);
    if (status !== TaskStatus.Running) {
      this.memory.task = provider(this, args);
    }
  }
}

export default ExtendCreep;
