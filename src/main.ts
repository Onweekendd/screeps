import { ErrorMapper } from "utils/ErrorMapper";
import { createHarvesterByNum } from "./Roles/creates/harvest";
import { createUpdaterByNum } from "./Roles/creates/update";
import { createBuilderByNum } from "Roles/creates/build";
import { buildStructuresAroundTarget } from "Spawn/buildStructs";
import mountCreep from "Creeps/mount";
import statisticsUtils from "utils/statistics";
import { createSuperHarvesterByNum } from "Roles/creates/superHarvest";
import CreepsApi from "CreepsApi";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

mountCreep();
const mainRoom = Game.spawns["Spawn1"].room;
const extensionsPosition = new RoomPosition(24, 10, mainRoom.name);
export const loop = ErrorMapper.wrapLoop(() => {
  const room = Game.spawns["Spawn1"].room;
  const sourceList = statisticsUtils.sourceList(room);
  const sourceForSuperHarvester = sourceList[0];
  const sourceForBuilder = sourceList[1];
  const sourceForUpdater = sourceList[1];
  const sourceForHarvester = sourceList[1];
  const containerList = statisticsUtils.containerList(room);
  const containerIdList = containerList.map(container => container.id) as Id<StructureContainer>[];
  buildStructuresAroundTarget({
    targetPosition: sourceForSuperHarvester.pos,
    structureType: STRUCTURE_CONTAINER,
    room: Game.spawns["Spawn1"].room
  });

  buildStructuresAroundTarget({
    targetPosition: extensionsPosition,
    structureType: STRUCTURE_EXTENSION,
    room: Game.spawns["Spawn1"].room,
    range: 2
  });
  createUpdaterByNum({
    sourceId: sourceForUpdater.id,
    containerIdList
  });
  createBuilderByNum({
    sourceId: sourceForSuperHarvester.id,
    containerIdList
  });
  createHarvesterByNum({
    sourceId: sourceForHarvester.id,
    targetTypeList: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION]
  });
  // containerList.forEach(container => {
  //   createSuperHarvesterByNum({
  //     sourceId: sourceForSuperHarvester.id,
  //     containerId: container.id as Id<StructureContainer>,
  //     creepConfig: [MOVE, WORK, WORK, WORK]
  //   });
  // });
  Object.values(Game.creeps).forEach(creep => {
    creep.work();
  }); // Automatically delete memory of missing creeps
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
