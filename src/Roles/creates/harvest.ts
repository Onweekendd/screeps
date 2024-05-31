import CreepsApi from "CreepsApi";
import ExtendCreep from "../../Creeps/ExtendCreep/ExtendCreep";
import { HARVESTER } from "types";

type HarvesterOptions = {
  creepConfig?: BodyPartConstant[];
  sourceId: Id<Source>;
  targetTypeList?: Array<STRUCTURE_SPAWN | STRUCTURE_EXTENSION | STRUCTURE_CONTAINER>;
};
function createHarvesterByNum(options: HarvesterOptions) {
  const { creepConfig = [WORK, CARRY, MOVE], sourceId, targetTypeList = [STRUCTURE_SPAWN] } = options;
  if (
    Object.keys(Game.creeps).filter(creepName => {
      return (Game.creeps[creepName] as ExtendCreep).memory.configName?.includes(HARVESTER);
    }).length <= 1
  ) {
    createHarvester(creepConfig, sourceId, targetTypeList);
  }
}

function createHarvester(
  creepConfig: BodyPartConstant[] = [WORK, CARRY, MOVE],
  sourceId: Id<Source>,
  targetTypeList: Array<STRUCTURE_SPAWN | STRUCTURE_EXTENSION | STRUCTURE_CONTAINER>
) {
  const workerName = HARVESTER + Game.time;
  Game.spawns["Spawn1"].spawnCreep(creepConfig, workerName, {
    memory: {
      configName: workerName,
      ready: true,
      working: true
    }
  });
  CreepsApi.add(workerName, HARVESTER, { sourceId, targetTypeList });
}

export { createHarvesterByNum };
