import { type Task, TaskStatus } from "./Task";

// 静态矿工的永久任务(任务机制设计 4.2 + 自维修扩展):
// 走到 container 那格 → 持续挖矿 + 按需修 container → 永不 Done。
//
// body 必须含 CARRY:repair() 消耗 carry 里的能量。
// 同一 tick 允许 repair + harvest 并行执行,能量边消耗边补充,效率不受影响。
// container 消失 → Invalid;调用方(mineProvider)回退到 idle,等 planConstruction 重建。
export class MineTask implements Task {
  public constructor(
    private readonly containerId: Id<StructureContainer>,
    private readonly sourceId: Id<Source>
  ) {}

  public run(creep: Creep): TaskStatus {
    const container = Game.getObjectById(this.containerId);
    if (!container) {
      return TaskStatus.Invalid;
    }
    const source = Game.getObjectById(this.sourceId);
    if (!source) {
      return TaskStatus.Invalid;
    }

    if (!creep.pos.isEqualTo(container.pos)) {
      creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
      return TaskStatus.Running;
    }

    // 在岗:repair 和 harvest 是不同 intent,同一 tick 可并行
    const energy = creep.store[RESOURCE_ENERGY];

    // container 受损且手里有能量 → 修(与 harvest 同 tick)
    if (container.hits < container.hitsMax && energy > 0) {
      creep.repair(container);
    }

    // carry 满了就倒进 container(下 tick 再挖),否则继续挖
    if (creep.store.getFreeCapacity() === 0) {
      creep.transfer(container, RESOURCE_ENERGY);
    } else {
      creep.harvest(source);
    }

    return TaskStatus.Running;
  }
}
