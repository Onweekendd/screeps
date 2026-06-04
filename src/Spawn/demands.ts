import { BUILDER, HARVESTER, REPAIRER, SUPER_HARVESTER, UPDATER } from "types";

// 造队列所需的、本 tick 已扫好的房间状态(架构文档 2.1:扫描世界 → 产生需求)
export interface RoomContext {
  room: Room;
  sources: Source[];
  containerIdList: Id<StructureContainer>[];
}

// 优先级:数字越小越优先(架构文档 2.4)
const PRIORITY = {
  HAUL: 5, // 搬运工:填 spawn/extension/tower/storage,经济命脉,最高优先
  SUPER_HARVEST: 8, // 静态矿工:比搬运略低(依赖 container,bootstrap 阶段还不存在)
  BUILD: 20,
  REPAIR: 25,
  UPGRADE: 30
};

// 各角色目标存活数(静态的;动态计算的角色不在此列)
const DESIRED = {
  builder: 2,
  repairer: 1
};

// 按角色名统计当前存活数(含孵化中)。
// configName 形如 "harvester12345_0",用 startsWith 精确匹配,
// 避免 "superHarvester" 被 includes("harvester") 误计为 harvester。
function countAlive(role: string): number {
  return Object.keys(Game.creeps).filter(name => Game.creeps[name].memory.configName?.startsWith(role)).length;
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

// 查出已被 superHarvester 覆盖的 source id 集合
function coveredSourceIds(): Set<string> {
  const configs = Memory.creepConfigs ?? {};
  const covered = new Set<string>();
  for (const name of Object.keys(Game.creeps)) {
    const cfg = configs[Game.creeps[name].memory.configName];
    if (cfg?.role === SUPER_HARVESTER) {
      const sid = cfg.args?.sourceId as string | undefined;
      if (sid) {
        covered.add(sid);
      }
    }
  }
  return covered;
}

// 搬运工:有 container 时纯搬运(不需要 WORK),无 container 时 bootstrap 临时采矿。
// 全覆盖后固定 2 个搬运工;bootstrap 阶段每个未覆盖 source 配 2 个。
function requireHarvesters(ctx: RoomContext, load: Record<string, number>): SpawnRequest[] {
  const hasContainers = ctx.containerIdList.length > 0;

  if (hasContainers) {
    // 纯搬运模式:固定 2 个,不绑定 source
    const haulerMissing = 2 - countAlive(HARVESTER);
    return Array.from({ length: Math.max(0, haulerMissing) }, () => ({
      role: HARVESTER,
      priority: PRIORITY.HAUL,
      body: haulerBody(),
      args: { containerIdList: ctx.containerIdList }
    }));
  }

  // Bootstrap:还没有 container,需要 WORK 临时采矿填 spawn
  const covered = coveredSourceIds();
  const uncovered = ctx.sources.filter(s => !covered.has(s.id));
  const desired = uncovered.length > 0 ? uncovered.length * 2 : 1;
  const missing = desired - countAlive(HARVESTER);
  const requests: SpawnRequest[] = [];
  for (let i = 0; i < missing; i++) {
    const pool = uncovered.length > 0 ? uncovered : ctx.sources;
    const source = pickLeastLoadedSource(pool, load);
    requests.push({
      role: HARVESTER,
      priority: PRIORITY.HAUL,
      body: [WORK, CARRY, MOVE],
      args: { sourceId: source.id, containerIdList: ctx.containerIdList }
    });
  }
  return requests;
}

// 升级:根据 superHarvester 覆盖数动态调整。
// 每个覆盖的 source 提供能量盈余,可多养一个 updater;上限 3 防止抢光能量。
// 至少 1 个确保 controller 不掉级。
function requireUpdaters(ctx: RoomContext, load: Record<string, number>): SpawnRequest[] {
  const desired = Math.min(3, 1 + coveredSourceIds().size);
  const requests: SpawnRequest[] = [];
  const missing = desired - countAlive(UPDATER);
  for (let i = 0; i < missing; i++) {
    const source = pickLeastLoadedSource(ctx.sources, load);
    requests.push({
      role: UPDATER,
      priority: PRIORITY.UPGRADE,
      body: updaterBody(),
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

// 搬运工:固定 body,纯搬运,不需要 WORK。
// [CARRY×4, MOVE×2] = 300 energy,200 携带量;造价低,快速复造,多开几个比一个大的强。
function haulerBody(): BodyPartConstant[] {
  return [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
}

// 升级工:固定 body,[WORK×3, CARRY, MOVE] = 400 energy。
// container/storage 就在控制器附近,移动距离短,1 MOVE 够用。
function updaterBody(): BodyPartConstant[] {
  return [WORK, WORK, WORK, CARRY, MOVE];
}

// 按当前房间能量上限动态计算静态矿工 body:
// 固定 1 CARRY(repair 用) + 1 MOVE(只走到岗位一次),剩余能量全给 WORK,上限 5 个。
// 5 WORK = 10 能量/tick = source 再生速率(3000/300tick),超过无意义。
// RCL1(300)→2W, RCL2(550)→4W, RCL3+(800+)→5W(封顶)
function minerBody(room: Room): BodyPartConstant[] {
  const capacity = room.energyCapacityAvailable;
  const workCount = Math.min(5, Math.floor((capacity - 100) / 100));
  if (workCount < 1) {
    return [];
  }
  const works: BodyPartConstant[] = Array.from({ length: workCount }, () => WORK);
  return [...works, CARRY, MOVE];
}

// 静态矿工:每个"紧邻 source 的真实 container"最多配一名静态矿工。
// 门槛是 container 已存在(Memory.containerForSuperHarvest 由 main.ts 扫真实建筑写入),
// 而非仅有工地——没有 container 就无法把能量存起来,有 CARRY 也没地方放(decay 照样侵蚀)。
// 通过扫 creepConfigs.args.containerId 而非 slot.creepName 判断槽位是否占用,
// 免去 spawn 时手动更新 slot 的善后负担。
function requireSuperHarvesters(ctx: RoomContext): SpawnRequest[] {
  const body = minerBody(ctx.room);
  if (body.length === 0) {
    return []; // 能量上限不足 1 WORK + 1 CARRY + 1 MOVE
  }

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
      continue; // container 不在 source 旁,无法采矿
    }
    if (occupied.has(slot.containerId)) {
      continue; // 已有存活矿工
    }
    requests.push({
      role: SUPER_HARVESTER,
      priority: PRIORITY.SUPER_HARVEST,
      body,
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
    ...requireSuperHarvesters(ctx),
    ...requireHarvesters(ctx, load),
    ...requireUpdaters(ctx, load),
    ...requireBuilders(ctx, load),
    ...requireRepairers(ctx, load)
  ];
}
