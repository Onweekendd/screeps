import { BuildTask } from "./BuildTask";
import { HarvestTask } from "./HarvestTask";
import { IdleTask } from "./IdleTask";
import type { Task } from "./Task";
import { WithdrawTask } from "./WithdrawTask";

// 任务工厂:type → 重建具体 Task 的唯一登记表。
// 全工程创建 Task 必须经此处(统一管理),新增任务种类只改这一张表(开闭原则)。
const registry: Record<TaskType, (desc: TaskDescriptor) => Task> = {
  harvest: desc => new HarvestTask(desc.targetId as Id<Source>),
  withdraw: desc => new WithdrawTask(desc.targetId as Id<StructureContainer>),
  build: desc => new BuildTask(desc.targetId as Id<ConstructionSite>),
  idle: () => new IdleTask()
};

// 从可序列化描述符现造一个一次性 Task 对象(命令模式 + 工厂模式,任务机制设计 2.3)
export function createTask(desc: TaskDescriptor): Task {
  return registry[desc.type](desc);
}

export { Task, TaskStatus } from "./Task";
