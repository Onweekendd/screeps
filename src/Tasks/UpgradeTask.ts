import { type Task, TaskStatus } from "./Task";

// 升级 controller:能量耗尽即 Done,controller 消失即 Invalid
export class UpgradeTask implements Task {
  public run(creep: Creep): TaskStatus {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      return TaskStatus.Done;
    }
    const controller = creep.room.controller;
    if (!controller) {
      return TaskStatus.Invalid;
    }
    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    return TaskStatus.Running;
  }
}
