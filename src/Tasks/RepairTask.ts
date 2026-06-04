import { type Task, TaskStatus } from "./Task";

// 修理指定建筑:能量耗尽 → Done;目标消失或已满血 → Invalid
export class RepairTask implements Task {
  public constructor(private readonly structureId: Id<AnyStructure>) {}

  public run(creep: Creep): TaskStatus {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      return TaskStatus.Done;
    }
    const structure = Game.getObjectById(this.structureId);
    if (!structure || structure.hits >= structure.hitsMax) {
      return TaskStatus.Invalid;
    }
    if (creep.repair(structure) === ERR_NOT_IN_RANGE) {
      creep.moveTo(structure, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    return TaskStatus.Running;
  }
}
