import { type Task, TaskStatus } from "./Task";

// 空闲:有能量却无工地时去 controller 旁待命。每 tick 都 Done,好让 Provider 立即重挑
// ——一旦出现新工地,下个 tick 就能切到 BuildTask。
export class IdleTask implements Task {
  public run(creep: Creep): TaskStatus {
    const controller = creep.room.controller;
    if (controller) {
      creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    return TaskStatus.Done;
  }
}
