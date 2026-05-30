import CreepsApi from "CreepsApi";
import { HARVESTER, MAIN_SPAWN } from "types";

import ExtendCreep from "../../Creeps/ExtendCreep/ExtendCreep";

interface HarvesterOptions {
  creepConfig?: BodyPartConstant[];
  sourceId: Id<Source>;
  targetTypeList?: (STRUCTURE_SPAWN | STRUCTURE_EXTENSION | STRUCTURE_CONTAINER)[];
  containerIdList?: Id<StructureContainer>[];
}
function createHarvesterByNum(options: HarvesterOptions) {
  const {
    creepConfig = [WORK, CARRY, MOVE],
    sourceId,
    targetTypeList = [STRUCTURE_SPAWN],
    containerIdList = []
  } = options;
  if (
    Object.keys(Game.creeps).filter(creepName => {
      return Game.creeps[creepName].memory.configName?.includes(HARVESTER);
    }).length <= 3
  ) {
    createHarvester(creepConfig, sourceId, targetTypeList, containerIdList);
  }
}

function createHarvester(
  creepConfig: BodyPartConstant[] = [WORK, CARRY, MOVE],
  sourceId: Id<Source>,
  targetTypeList: (STRUCTURE_SPAWN | STRUCTURE_EXTENSION | STRUCTURE_CONTAINER)[],
  containerIdList: Id<StructureContainer>[]
) {
  const workerName = HARVESTER + Game.time;
  Game.spawns[MAIN_SPAWN].spawnCreep(creepConfig, workerName, {
    memory: {
      configName: workerName,
      ready: true,
      working: true
    }
  });
  CreepsApi.add(workerName, HARVESTER, { sourceId, targetTypeList, containerIdList });
}

export { createHarvesterByNum };
