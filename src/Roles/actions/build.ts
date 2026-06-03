interface BuildArgs {
  sourceId: Id<Source>;
  containerIdList?: Id<StructureContainer>[];
}

// builder 的"自取" Provider(任务机制设计 6 节):按 creep 当前状态挑下一个任务描述符。
// 原来的 source/target 2 状态机在这里溶解成一条规则——空了取能量,满了去建造。
export function builderProvideTask(creep: Creep, arg: Record<string, any>): TaskDescriptor {
  const { sourceId, containerIdList } = arg as BuildArgs;

  // 有能量 → 就近找工地建;没工地 → 待命
  if (creep.store[RESOURCE_ENERGY] > 0) {
    const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (site) {
      return { type: "build", targetId: site.id };
    }
    return { type: "idle" };
  }

  // 没能量 → 优先从有货的 container 取,否则回 source 自挖
  if (containerIdList) {
    for (const containerId of containerIdList) {
      const container = Game.getObjectById(containerId);
      if (container && container.store[RESOURCE_ENERGY] > 0) {
        return { type: "withdraw", targetId: containerId };
      }
    }
  }
  return { type: "harvest", targetId: sourceId };
}
