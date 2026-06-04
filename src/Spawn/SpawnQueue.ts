import CreepsApi from "CreepsApi";

// 一条 body 的能量造价
function bodyCost(body: BodyPartConstant[]): number {
  return body.reduce((sum, part) => sum + BODYPART_COST[part], 0);
}

// 把一条请求落成真 creep:写 CreepMemory + creepConfigs。
// 失败(能量不足 / 名字冲突等)返回 false,且不写任何 Memory(修复「返回值未检查」隐患)。
function spawnFromRequest(spawn: StructureSpawn, req: SpawnRequest, suffix: string): boolean {
  const name = `${req.namePrefix ?? req.role}${Game.time}${suffix}`;
  const result = spawn.spawnCreep(req.body, name, {
    memory: {
      configName: name
    }
  });
  if (result !== OK) {
    return false;
  }
  CreepsApi.add(name, req.role, req.args);
  return true;
}

/**
 * 消费生产队列,按优先级仲裁(架构文档 2.4 / 2.5)。
 *
 * 规则:
 *  - 队列按 priority 升序;
 *  - 每个空闲 spawn 取「本 RCL 造得起的、优先级最高的」一条请求;
 *  - body 超过 energyCapacityAvailable(本 RCL 永远造不起)→ 跳过看下一条;
 *  - body ≤ capacity 但 > energyAvailable(钱没攒够)→ 该 spawn 这 tick 停下攒钱,
 *    绝不退而求其次去造低优先级(否则永远攒不够造关键大 creep);
 *  - 成功孵化即 tick 内出队,后续 spawn 不再领同一条(多 spawn 协调)。
 */
function consumeSpawnQueue(spawns: StructureSpawn[], queue: SpawnRequest[]): void {
  const pending = [...queue].sort((a, b) => a.priority - b.priority);

  spawns.forEach((spawn, spawnIndex) => {
    if (spawn.spawning) {
      return;
    }
    const capacity = spawn.room.energyCapacityAvailable;
    const available = spawn.room.energyAvailable;

    let chosenIndex = -1;
    for (let i = 0; i < pending.length; i++) {
      const cost = bodyCost(pending[i].body);
      if (cost > capacity) {
        // 本 RCL 永远造不起这条 → 跳过,看下一条
        continue;
      }
      if (cost > available) {
        // 造得起但钱还没攒够 → 停下攒钱,不降级
        return;
      }
      chosenIndex = i;
      break;
    }
    if (chosenIndex === -1) {
      return;
    }
    if (spawnFromRequest(spawn, pending[chosenIndex], `_${spawnIndex}`)) {
      pending.splice(chosenIndex, 1); // tick 内出队
    }
  });
}

export { bodyCost, consumeSpawnQueue };
