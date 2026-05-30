import { BUILDER, HARVESTER, REPAIRER, UPDATER } from "types";

// 造队列所需的、本 tick 已扫好的房间状态(架构文档 2.1:扫描世界 → 产生需求)
export interface RoomContext {
  room: Room;
  sources: Source[];
  containerIdList: Id<StructureContainer>[];
}

// 优先级:数字越小越优先(架构文档 2.4)
const PRIORITY = {
  HARVEST: 5, // 基础采集兼填 spawn/extension,经济命脉,最高优先
  BUILD: 20,
  REPAIR: 25,
  UPGRADE: 30
};

// 各角色目标存活数
const DESIRED = {
  harvester: 3,
  updater: 1,
  builder: 2,
  repairer: 1
};

// 按角色名统计当前存活数(含孵化中);configName 形如 "harvester12345"
function countAlive(role: string): number {
  return Object.keys(Game.creeps).filter(name => Game.creeps[name].memory.configName?.includes(role)).length;
}

// 基础采集:多 source 房间按下标轮流分配
function requireHarvesters(ctx: RoomContext): SpawnRequest[] {
  const requests: SpawnRequest[] = [];
  const missing = DESIRED.harvester - countAlive(HARVESTER);
  for (let i = 0; i < missing; i++) {
    const source = ctx.sources[i % ctx.sources.length];
    requests.push({
      role: HARVESTER,
      priority: PRIORITY.HARVEST,
      body: [WORK, CARRY, MOVE],
      args: {
        sourceId: source.id,
        targetTypeList: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION],
        containerIdList: ctx.containerIdList
      }
    });
  }
  return requests;
}

// 升级:优先用第二个 source,避免和 harvester 抢同一个矿
function requireUpdaters(ctx: RoomContext): SpawnRequest[] {
  const requests: SpawnRequest[] = [];
  const missing = DESIRED.updater - countAlive(UPDATER);
  const source = ctx.sources.length > 1 ? ctx.sources[1] : ctx.sources[0];
  for (let i = 0; i < missing; i++) {
    requests.push({
      role: UPDATER,
      priority: PRIORITY.UPGRADE,
      body: [WORK, CARRY, MOVE],
      args: { sourceId: source.id, containerIdList: ctx.containerIdList }
    });
  }
  return requests;
}

// 建造:任务驱动——没有工地就不需要 builder(架构文档 2.2 任务需求)
function requireBuilders(ctx: RoomContext): SpawnRequest[] {
  if (ctx.room.find(FIND_CONSTRUCTION_SITES).length === 0) {
    return [];
  }
  const requests: SpawnRequest[] = [];
  const missing = DESIRED.builder - countAlive(BUILDER);
  for (let i = 0; i < missing; i++) {
    requests.push({
      role: BUILDER,
      priority: PRIORITY.BUILD,
      body: [WORK, CARRY, MOVE],
      args: { sourceId: ctx.sources[0].id, containerIdList: ctx.containerIdList }
    });
  }
  return requests;
}

// 修理:只有存在会衰减且受损的结构(road / container)时才需要(架构文档 5.0)
function requireRepairers(ctx: RoomContext): SpawnRequest[] {
  const damaged = ctx.room.find(FIND_STRUCTURES, {
    filter: s => (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) && s.hits < s.hitsMax
  });
  if (damaged.length === 0) {
    return [];
  }
  const requests: SpawnRequest[] = [];
  const missing = DESIRED.repairer - countAlive(REPAIRER);
  for (let i = 0; i < missing; i++) {
    requests.push({
      role: REPAIRER,
      priority: PRIORITY.REPAIR,
      body: [WORK, CARRY, MOVE],
      args: { sourceId: ctx.sources[0].id, containerIdList: ctx.containerIdList }
    });
  }
  return requests;
}

// 汇总所有需求源 → 本 tick 的生产队列(每 tick 重建,用完即弃,绝不持久化)
export function buildSpawnQueue(ctx: RoomContext): SpawnRequest[] {
  return [...requireHarvesters(ctx), ...requireUpdaters(ctx), ...requireBuilders(ctx), ...requireRepairers(ctx)];
}
