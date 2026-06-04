import { type Task, TaskStatus } from "./Task";

// 从 container 取能量:取满为止。空了 / 没了即 Invalid,creep 自动回退去挖矿。
export class WithdrawTask implements Task {
  public constructor(private readonly containerId: Id<StructureContainer | StructureStorage>) {}

  public run(creep: Creep): TaskStatus {
    const container = Game.getObjectById(this.containerId);
    if (!container || container.store[RESOURCE_ENERGY] === 0) {
      return TaskStatus.Invalid;
    }
    if (creep.store.getFreeCapacity() === 0) {
      return TaskStatus.Done;
    }
    if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
    }
    return TaskStatus.Running;
  }
}
