import mountCreep from "Creeps/mount";
import { buildStructuresAroundTarget } from "Spawn/buildStructs";
import { MAIN_SPAWN } from "types";
import { containerCheck } from "utils/containerCheck";
import { ErrorMapper } from "utils/ErrorMapper";
import Scanner from "utils/scanner";
import statisticsUtils from "utils/statistics";

import { createHarvesterByNum } from "./Roles/creates/harvest";
import { createUpdaterByNum } from "./Roles/creates/update";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

mountCreep();
// 地形扫描只需在每次 global reset 后跑一次，用标志位控制，放进 loop 里以受 ErrorMapper 保护
let terrainScanned = false;
export const loop = ErrorMapper.wrapLoop(() => {
  // spawn 可能被摧毁，访问前先判空，避免在全局作用域 / 未受保护处崩溃
  const mainSpawn = Game.spawns[MAIN_SPAWN];
  if (!mainSpawn) {
    return;
  }
  const mainRoom = mainSpawn.room;
  if (!terrainScanned) {
    Scanner(mainRoom.name);
    terrainScanned = true;
  }
  const extensionsPosition = new RoomPosition(22, 8, mainRoom.name);
  const sourceList = statisticsUtils.sourceList(mainRoom);
  if (sourceList.length === 0) {
    return;
  }
  // 两个 source 分别供给，单 source 房间则都退回 [0]，不再统一写死成 [1]（原来 sourceList[0] 闲置且单源会越界）
  const sourceForHarvester = sourceList[0];
  const sourceForUpdater = sourceList[1] ?? sourceList[0];
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

  // buildStructuresAroundTarget({
  //   targetPosition: sourceForSuperHarvester.pos,
  //   structureType: STRUCTURE_CONTAINER,
  //   room: mainRoom
  // });

  // buildStructuresAroundTarget({
  //   targetPosition: sourceForBuilder.pos,
  //   structureType: STRUCTURE_CONTAINER,
  //   room: mainRoom
  // });

  buildStructuresAroundTarget({
    targetPosition: extensionsPosition,
    structureType: STRUCTURE_EXTENSION,
    room: mainRoom,
    range: 6,
    distance: 2
  });
  createHarvesterByNum({
    sourceId: sourceForHarvester.id,
    targetTypeList: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION],
    creepConfig: [MOVE, WORK, CARRY],
    containerIdList
  });
  createUpdaterByNum({
    creepConfig: [MOVE, CARRY, WORK],
    containerIdList,
    sourceId: sourceForUpdater.id
  });
  // createBuilderByNum({
  //   sourceId: sourceForSuperHarvester.id,
  //   containerIdList
  // });
  // createRepairerByNum({
  //   sourceId: sourceForBuilder.id,
  //   containerIdList
  // });

  // for (const container of containerList) {
  //   const containerForSuperHarvest = Memory.containerForSuperHarvest.find(z => z.containerId === container.id);
  //   if (containerForSuperHarvest && containerForSuperHarvest.creepName) {
  //     createSuperHarvesterByNum({
  //       sourceId: containerForSuperHarvest.sourceId ?? sourceForSuperHarvester.id,
  //       containerId: container.id as Id<StructureContainer>,
  //       containerNum: containerList.length,
  //       creepConfig: [MOVE, WORK, WORK]
  //     });
  //   }
  // }
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
