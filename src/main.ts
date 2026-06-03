import mountCreep from "Creeps/mount";
import { planConstruction } from "Spawn/buildStructs";
import { buildSpawnQueue } from "Spawn/demands";
import { consumeSpawnQueue } from "Spawn/SpawnQueue";
import { MAIN_SPAWN } from "types";
import { containerCheck } from "utils/containerCheck";
import { ErrorMapper } from "utils/ErrorMapper";
import Scanner from "utils/scanner";
import statisticsUtils from "utils/statistics";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

mountCreep();
// 地形扫描只需在每次 global reset 后跑一次，用标志位控制，放进 loop 里以受 ErrorMapper 保护
let terrainScanned = false;
export const loop = ErrorMapper.wrapLoop(() => {
  // spawn 可能被摧毁，访问前先判空，避免在全局作用域 / 未受保护处崩溃。
  // 优先用约定名 MAIN_SPAWN；找不到时回退到当前任意一个 spawn，
  // 这样重生后即便没沿用原名，主循环也能照常 bootstrap，不会因名字不符而空转。
  const mainSpawn = Game.spawns[MAIN_SPAWN] ?? Object.values(Game.spawns)[0];
  if (!mainSpawn) {
    return;
  }
  const mainRoom = mainSpawn.room;
  if (!terrainScanned) {
    Scanner(mainRoom.name);
    terrainScanned = true;
  }
  const sourceList = statisticsUtils.sourceList(mainRoom);
  if (sourceList.length === 0) {
    return;
  }
  const containerList = statisticsUtils.containerList(mainRoom);
  const containerIdList = containerList.map(container => container.id);
  if (!Memory.containerForSuperHarvest || !(Memory.containerForSuperHarvest instanceof Array)) {
    Memory.containerForSuperHarvest = [];
  }
  containerIdList.forEach(containerId => {
    let nearSourceId: Id<Source> | undefined;
    const container = Game.getObjectById(containerId) as StructureContainer;
    sourceList.forEach(source => {
      if (source.pos.inRangeTo(container, 1)) {
        nearSourceId = source.id;
      }
    });
    if (Memory.containerForSuperHarvest && !Memory.containerForSuperHarvest.find(z => z.containerId === containerId)) {
      Memory.containerForSuperHarvest.push({
        containerId,
        creepName: undefined,
        sourceId: nearSourceId
      });
    }
  });

  // 需求驱动的建筑规划:扫描世界 → 把缺的 container/extension 工地放下去 → 汇入建造线
  planConstruction({ room: mainRoom, sources: sourceList, anchor: mainSpawn.pos });
  // 需求驱动:扫描世界 → 生成生产队列(每 tick 重建)→ spawn 按优先级消费
  const spawnQueue = buildSpawnQueue({ room: mainRoom, sources: sourceList, containerIdList });
  consumeSpawnQueue([mainSpawn], spawnQueue);

  Object.values(Game.creeps).forEach(creep => {
    creep.work();
  });

  if (Memory.containerForSuperHarvest) {
    Memory.containerForSuperHarvest.forEach(z => {
      const { creepName } = z;
      if (creepName && !Game.creeps[creepName]) {
        z.creepName = undefined;
      }
    });
    Memory.containerForSuperHarvest = Memory.containerForSuperHarvest.filter(z => containerCheck(z.containerId));
  }
  if (Memory.creepConfigs) {
    Object.keys(Memory.creepConfigs).forEach(name => {
      if (!Game.creeps[name] && Memory.creepConfigs) {
        delete Memory.creepConfigs[name];
      }
    });
  }
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
