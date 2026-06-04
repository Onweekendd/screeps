import { BuildTask } from "./BuildTask";
import { DeliverTask } from "./DeliverTask";
import { HarvestTask } from "./HarvestTask";
import { IdleTask } from "./IdleTask";
import { MineTask } from "./MineTask";
import { RepairTask } from "./RepairTask";
import type { Task } from "./Task";
import { UpgradeTask } from "./UpgradeTask";
import { WithdrawTask } from "./WithdrawTask";

// 任务工厂:type → 重建具体 Task 的唯一登记表。
// 全工程创建 Task 必须经此处(统一管理),新增任务种类只改这一张表(开闭原则)。
const registry: Record<TaskType, (desc: TaskDescriptor) => Task> = {
  harvest: desc => new HarvestTask(desc.targetId as Id<Source>),
  withdraw: desc => new WithdrawTask(desc.targetId as Id<StructureContainer | StructureStorage>),
  build: desc => new BuildTask(desc.targetId as Id<ConstructionSite>),
  deliver: desc => new DeliverTask(desc.targetId as Id<StructureSpawn | StructureExtension | StructureStorage | StructureTower>),
  repair: desc => new RepairTask(desc.targetId as Id<AnyStructure>),
  upgrade: () => new UpgradeTask(),
  idle: () => new IdleTask(),
  mine: desc => new MineTask(desc.targetId as Id<StructureContainer>, desc.sourceId as Id<Source>)
};

// 从可序列化描述符现造一个一次性 Task 对象(命令模式 + 工厂模式,任务机制设计 2.3)
export function createTask(desc: TaskDescriptor): Task {
  return registry[desc.type](desc);
}

export { Task, TaskStatus } from "./Task";
