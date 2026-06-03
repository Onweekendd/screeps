import { type Task, TaskStatus } from "./Task";

// 去 source 挖矿:装满为止(任务机制设计 4.1)
export class HarvestTask implements Task {
  public constructor(private readonly sourceId: Id<Source>) {}

  public run(creep: Creep): TaskStatus {
    const source = Game.getObjectById(this.sourceId);
    if (!source) {
      return TaskStatus.Invalid;
    }
    if (creep.store.getFreeCapacity() === 0) {
      return TaskStatus.Done;
    }
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
    }
    return TaskStatus.Running;
  }
}
