import roles from "Roles";
import { createTask, TaskStatus } from "Tasks";
import { getProvider, type TaskProvider } from "Tasks/providers";

class ExtendCreep extends Creep {
  public work(): void {
    // inital actions
    if (!Memory.creepConfigs) {
      Memory.creepConfigs = {};
    }
    const config = Memory.creepConfigs[this.memory.configName];
    if (!config) {
      console.log(`creep ${this.name} has no config`);
      return;
    }

    // 任务驱动型角色:Provider 决定做什么,Task 负责怎么做(命令模式)
    const provider = getProvider(config.role);
    if (provider) {
      this.runTask(provider, config.args);
      return;
    }

    // 旧的 2 状态 WorkingFlow 路径
    const workingFlow = roles[config.role];
    if (!workingFlow) {
      console.log(`creep ${this.name} has no action`);
      return;
    }
    const action = workingFlow(config.args);

    // prepare for action
    if (action.prepare) {
      if (!this.memory.ready) {
        this.memory.ready = action.prepare(this);
        return;
      }
    }

    let statusChange = false;
    // workings
    if (this.memory.working) {
      statusChange = action.target(this);
    } else {
      statusChange = action.source(this);
    }

    if (statusChange) {
      this.memory.working = !this.memory.working;
    }
  }

  // 读 memory.task → 工厂重建 → run → 按 Done/Invalid 向 Provider 要下一个(任务机制设计 8.2)
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
