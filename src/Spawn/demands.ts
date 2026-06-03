import { BUILDER, HARVESTER, REPAIRER, SUPER_HARVESTER, UPDATER } from "types";

// 造队列所需的、本 tick 已扫好的房间状态(架构文档 2.1:扫描世界 → 产生需求)
export interface RoomContext {
  room: Room;
  sources: Source[];
  containerIdList: Id<StructureContainer>[];
}

// 优先级:数字越小越优先(架构文档 2.4)
const PRIORITY = {
  HARVEST: 5, // 基础采集兼填 spawn/extension,经济命脉,最高优先
  SUPER_HARVEST: 8, // 静态矿工:比普通采集略低(依赖 container,bootstrap 阶段还不存在)
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

// 统计每个 source 当前已分配的存活 creep 数:从 creepConfigs.args.sourceId 反查。
// 这是"按真实负载分矿"的依据,取代原来按缺口下标 i%len 的错误分配
// (i 是本 tick 缺口下标,稳态下恒为 0,导致补员全挤到 sources[0])。
function sourceLoad(): Record<string, number> {
  const load: Record<string, number> = {};
  const configs = Memory.creepConfigs ?? {};
  Object.keys(Game.creeps).forEach(name => {
    const cfgName = Game.creeps[name].memory.configName;
    const sid = configs[cfgName]?.args?.sourceId as string | undefined;
    if (sid) {
      load[sid] = (load[sid] ?? 0) + 1;
    }
  });
  return load;
}

// 挑当前分配最少的 source,并就地 +1 占位(让同一 tick 后续请求看到本次分配,避免一窝蜂)
function pickLeastLoadedSource(sources: Source[], load: Record<string, number>): Source {
  let best = sources[0];
  for (const s of sources) {
    if ((load[s.id] ?? 0) < (load[best.id] ?? 0)) {
      best = s;
    }
  }
  load[best.id] = (load[best.id] ?? 0) + 1;
  return best;
}

// 基础采集:按各 source 真实负载均衡分配
function requireHarvesters(ctx: RoomContext, load: Record<string, number>): SpawnRequest[] {
  const requests: SpawnRequest[] = [];
  const missing = DESIRED.harvester - countAlive(HARVESTER);
  for (let i = 0; i < missing; i++) {
    const source = pickLeastLoadedSource(ctx.sources, load);
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

// 升级:同样走负载均衡——人少的矿优先,自然就和 harvester 错开,不必再写死第二个矿
function requireUpdaters(ctx: RoomContext, load: Record<string, number>): SpawnRequest[] {
  const requests: SpawnRequest[] = [];
  const missing = DESIRED.updater - countAlive(UPDATER);
  for (let i = 0; i < missing; i++) {
    const source = pickLeastLoadedSource(ctx.sources, load);
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
function requireBuilders(ctx: RoomContext, load: Record<string, number>): SpawnRequest[] {
  if (ctx.room.find(FIND_CONSTRUCTION_SITES).length === 0) {
    return [];
  }
  const requests: SpawnRequest[] = [];
  const missing = DESIRED.builder - countAlive(BUILDER);
  for (let i = 0; i < missing; i++) {
    const source = pickLeastLoadedSource(ctx.sources, load);
    requests.push({
      role: BUILDER,
      priority: PRIORITY.BUILD,
      body: [WORK, CARRY, MOVE],
      args: { sourceId: source.id, containerIdList: ctx.containerIdList }
    });
  }
  return requests;
}

// 修理:只有存在会衰减且受损的结构(road / container)时才需要(架构文档 5.0)
function requireRepairers(ctx: RoomContext, load: Record<string, number>): SpawnRequest[] {
  const damaged = ctx.room.find(FIND_STRUCTURES, {
    filter: s => (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) && s.hits < s.hitsMax
  });
  if (damaged.length === 0) {
    return [];
  }
  const requests: SpawnRequest[] = [];
  const missing = DESIRED.repairer - countAlive(REPAIRER);
  for (let i = 0; i < missing; i++) {
    const source = pickLeastLoadedSource(ctx.sources, load);
    requests.push({
      role: REPAIRER,
      priority: PRIORITY.REPAIR,
      body: [WORK, CARRY, MOVE],
      args: { sourceId: source.id, containerIdList: ctx.containerIdList }
    });
  }
  return requests;
}

// 静态矿工:每个"紧邻 source 的真实 container"最多配一名静态矿工。
// 门槛是 container 已存在(Memory.containerForSuperHarvest 由 main.ts 扫真实建筑写入),
// 而非仅有工地——没有 container 就无法把能量存起来,有 CARRY 也没地方放(decay 照样侵蚀)。
// 通过扫 creepConfigs.args.containerId 而非 slot.creepName 判断槽位是否占用,
// 免去 spawn 时手动更新 slot 的善后负担。
function requireSuperHarvesters(): SpawnRequest[] {
  const slots = Memory.containerForSuperHarvest ?? [];
  const configs = Memory.creepConfigs ?? {};

  // 已被占用的 containerId 集合
  const occupied = new Set<string>();
  for (const name of Object.keys(Game.creeps)) {
    const cid = configs[Game.creeps[name].memory.configName]?.args?.containerId as string | undefined;
    if (cid) {
      occupied.add(cid);
    }
  }

  const requests: SpawnRequest[] = [];
  for (const slot of slots) {
    if (!slot.sourceId) {
      continue;
    } // container 不在 source 旁,无法采矿
    if (occupied.has(slot.containerId)) {
      continue;
    } // 已有存活矿工
    requests.push({
      role: SUPER_HARVESTER,
      priority: PRIORITY.SUPER_HARVEST,
      // 5×WORK = 10 能量/tick,恰好耗尽一个 source(3000能量/300tick再生)
      // 1×CARRY 供 repair() 消耗;1×MOVE 够用(只走一次到岗位,之后静止)
      // 总造价 600 能量,需 RCL3(容量800);低于此 SpawnQueue 会跳过等能量
      body: [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE],
      args: { containerId: slot.containerId, sourceId: slot.sourceId }
    });
  }
  return requests;
}

// 汇总所有需求源 → 本 tick 的生产队列(每 tick 重建,用完即弃,绝不持久化)。
// 各角色共享同一份 source 负载快照,保证同 tick 内的多个请求也会彼此错开,均衡到各矿。
export function buildSpawnQueue(ctx: RoomContext): SpawnRequest[] {
  const load = sourceLoad();
  return [
    ...requireSuperHarvesters(),
    ...requireHarvesters(ctx, load),
    ...requireUpdaters(ctx, load),
    ...requireBuilders(ctx, load),
    ...requireRepairers(ctx, load)
  ];
}
