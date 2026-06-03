import { type Task, TaskStatus } from "./Task";

// 建造工地:能量耗尽即 Done(回去补给),工地建好/消失即 Invalid(重新挑目标)。
export class BuildTask implements Task {
  public constructor(private readonly siteId: Id<ConstructionSite>) {}

  public run(creep: Creep): TaskStatus {
    const site = Game.getObjectById(this.siteId);
    if (!site) {
      return TaskStatus.Invalid;
    }
    if (creep.store[RESOURCE_ENERGY] === 0) {
      return TaskStatus.Done;
    }
    if (creep.build(site) === ERR_NOT_IN_RANGE) {
      creep.moveTo(site, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    return TaskStatus.Running;
  }
}
