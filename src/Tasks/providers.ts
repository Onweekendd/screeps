// Provider:回答"该执行哪个任务"(Task 只回答"怎么执行")。
// 所有角色的 Provider 统一在此注册;新增角色只改这一张表。
export type TaskProvider = (creep: Creep, args: Record<string, any>) => TaskDescriptor;

// ── 工具函数 ──────────────────────────────────────────────────────────────

// 搬运工取能量:container 优先,container 空时退到 storage,都没有才 idle(无 WORK 无法采矿)
function pickHaulerSource(creep: Creep, containerIdList?: Id<StructureContainer>[]): TaskDescriptor {
  if (containerIdList && containerIdList.length > 0) {
    const available = containerIdList
      .map(id => Game.getObjectById(id))
      .filter((c): c is StructureContainer => c !== null && c.store[RESOURCE_ENERGY] > 0);
    if (available.length > 0) {
      const closest = creep.pos.findClosestByPath(available);
      if (closest) return { type: "withdraw", targetId: closest.id };
    }
  }
  const storage = creep.room.storage;
  if (storage && storage.store[RESOURCE_ENERGY] > 0) {
    return { type: "withdraw", targetId: storage.id };
  }
  return { type: "idle" };
}

// 作业工(updater/builder/repairer)取能量:storage 优先 → container → 直接采矿
function pickEnergySource(
  creep: Creep,
  sourceId: Id<Source>,
  containerIdList?: Id<StructureContainer>[]
): TaskDescriptor {
  const storage = creep.room.storage;
  if (storage && storage.store[RESOURCE_ENERGY] > 0) {
    return { type: "withdraw", targetId: storage.id };
  }
  if (containerIdList && containerIdList.length > 0) {
    const available = containerIdList
      .map(id => Game.getObjectById(id))
      .filter((c): c is StructureContainer => c !== null && c.store[RESOURCE_ENERGY] > 0);
    if (available.length > 0) {
      const closest = creep.pos.findClosestByPath(available);
      if (closest) return { type: "withdraw", targetId: closest.id };
    }
  }
  return { type: "harvest", targetId: sourceId };
}

// ── Provider 实现 ─────────────────────────────────────────────────────────

// 静态矿工:container 存在 → mine;container 消失 → idle 等重建
export function mineProvider(_creep: Creep, args: Record<string, any>): TaskDescriptor {
  const { containerId, sourceId } = args as { containerId: Id<StructureContainer>; sourceId: Id<Source> };
  const container = Game.getObjectById(containerId);
  if (!container) {
    return { type: "idle" };
  }
  return { type: "mine", targetId: containerId, sourceId };
}

// 建造工:有能量 → 就近找工地建;没工地 → idle;没能量 → 取能量
export function builderProvider(creep: Creep, args: Record<string, any>): TaskDescriptor {
  const { sourceId, containerIdList } = args as {
    sourceId: Id<Source>;
    containerIdList?: Id<StructureContainer>[];
  };
  if (creep.store[RESOURCE_ENERGY] > 0) {
    const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (site) {
      return { type: "build", targetId: site.id };
    }
    return { type: "idle" };
  }
  return pickEnergySource(creep, sourceId, containerIdList);
}

// 升级工:有能量 → 升级;没能量 → 取能量
export function updaterProvider(creep: Creep, args: Record<string, any>): TaskDescriptor {
  const { sourceId, containerIdList } = args as {
    sourceId: Id<Source>;
    containerIdList?: Id<StructureContainer>[];
  };
  if (creep.store[RESOURCE_ENERGY] > 0) {
    return { type: "upgrade" };
  }
  return pickEnergySource(creep, sourceId, containerIdList);
}

// 搬运工:有能量 → spawn/extension → tower → storage → 兜底升级;没能量 → container/storage
export function harvesterProvider(creep: Creep, args: Record<string, any>): TaskDescriptor {
  const { sourceId, containerIdList } = args as {
    sourceId?: Id<Source>;
    containerIdList?: Id<StructureContainer>[];
  };
  if (creep.store[RESOURCE_ENERGY] > 0) {
    const spawnOrExt = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (s: AnyOwnedStructure) =>
        (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
        (s as StructureSpawn | StructureExtension).store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (spawnOrExt) return { type: "deliver", targetId: spawnOrExt.id };

    const tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (s: AnyOwnedStructure) =>
        s.structureType === STRUCTURE_TOWER &&
        (s as StructureTower).store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (tower) return { type: "deliver", targetId: tower.id };

    const storage = creep.room.storage;
    if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      return { type: "deliver", targetId: storage.id };
    }
    return { type: "upgrade" };
  }
  // 纯搬运:无 WORK;有 sourceId 是 bootstrap 模式保留字段,正常不走
  if (sourceId) return pickEnergySource(creep, sourceId, containerIdList);
  return pickHaulerSource(creep, containerIdList);
}

// 修理工:有能量 → 修最受损的非墙结构;没活干 → idle;没能量 → 取能量
export function repairerProvider(creep: Creep, args: Record<string, any>): TaskDescriptor {
  const { sourceId, containerIdList } = args as {
    sourceId: Id<Source>;
    containerIdList?: Id<StructureContainer>[];
  };
  if (creep.store[RESOURCE_ENERGY] > 0) {
    const damaged = creep.room
      .find(FIND_STRUCTURES, {
        filter: (s: AnyStructure) =>
          s.structureType !== STRUCTURE_WALL &&
          s.structureType !== STRUCTURE_RAMPART &&
          s.hits < s.hitsMax
      })
      .sort((a, b) => a.hits - b.hits);
    if (damaged.length > 0) {
      return { type: "repair", targetId: damaged[0].id };
    }
    return { type: "idle" };
  }
  return pickEnergySource(creep, sourceId, containerIdList);
}

// ── 注册表 ───────────────────────────────────────────────────────────────

const providers: Partial<Record<keyof RoleType, TaskProvider>> = {
  superHarvester: mineProvider,
  builder: builderProvider,
  updater: updaterProvider,
  harvester: harvesterProvider,
  repairer: repairerProvider
};

export function getProvider(role: keyof RoleType): TaskProvider | undefined {
  return providers[role];
}
