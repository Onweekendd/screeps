import { type Task, TaskStatus } from "./Task";

// 把能量转移给指定建筑(spawn / extension):
// 能量耗尽 → Done;目标消失或已满 → Invalid
export class DeliverTask implements Task {
  public constructor(
    private readonly targetId: Id<StructureSpawn | StructureExtension | StructureStorage | StructureTower>
  ) {}

  public run(creep: Creep): TaskStatus {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      return TaskStatus.Done;
    }
    const target = Game.getObjectById(this.targetId);
    if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      return TaskStatus.Invalid;
    }
    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    return TaskStatus.Running;
  }
}
