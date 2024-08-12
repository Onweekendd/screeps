import { ErrorMapper } from "utils/ErrorMapper";
import { createHarvesterByNum } from "./Roles/creates/harvest";
import { createUpdaterByNum } from "./Roles/creates/update";
import { createBuilderByNum } from "Roles/creates/build";
import { buildStructuresAroundTarget } from "Spawn/buildStructs";
import mountCreep from "Creeps/mount";
import statisticsUtils from "utils/statistics";
import { createSuperHarvesterByNum } from "Roles/creates/superHarvest";
import CreepsApi from "CreepsApi";
import { SUPER_HARVESTER } from "types";
import { containerCheck } from "utils/containerCheck";
import { createRepairerByNum } from "Roles/creates/repair";
import Scanner from "utils/scanner";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

mountCreep();
const mainRoom = Game.spawns["Spawn1"].room;
Scanner(mainRoom.name);
const extensionsPosition = new RoomPosition(22, 8, mainRoom.name);
export const loop = ErrorMapper.wrapLoop(() => {
  const sourceList = statisticsUtils.sourceList(mainRoom);
  const sourceForSuperHarvester = sourceList[0];
  const sourceForBuilder = sourceList[1];
  const sourceForUpdater = sourceList[1];
  const sourceForHarvester = sourceList[1];
  const containerList = statisticsUtils.containerList(mainRoom);
  const containerIdList = containerList.map(container => container.id) as Id<StructureContainer>[];
  if (!Memory.containerForSuperHarvest || !(Memory.containerForSuperHarvest instanceof Array)) {
    Memory.containerForSuperHarvest = [];
  }
  containerIdList.forEach(containerId => {
    let nearSourceId: Id<Source> | undefined = undefined;
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
