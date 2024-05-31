import CreepsApi from "CreepsApi";
import ExtendCreep from "../../Creeps/ExtendCreep/ExtendCreep";
import { SUPER_HARVESTER } from "types";

type SuperHarvesterOptions = {
  creepConfig?: BodyPartConstant[];
  containerId: Id<StructureContainer>;
  sourceId: Id<Source>;
  containerNum?: number;
};
function createSuperHarvesterByNum(options: SuperHarvesterOptions) {
  const { creepConfig = [WORK, CARRY, MOVE], sourceId, containerId, containerNum = 1 } = options;
  if (
    Object.keys(Game.creeps).filter(creepName => {
      return (Game.creeps[creepName] as ExtendCreep).memory.configName?.includes(SUPER_HARVESTER);
    }).length <= containerNum
  ) {
    createSuperHarvester(creepConfig, sourceId, containerId);
  }
}

function createSuperHarvester(
  creepConfig: BodyPartConstant[] = [WORK, CARRY, MOVE],
  sourceId: Id<Source>,
  containerId: Id<StructureContainer>
) {
  const workerName = SUPER_HARVESTER + Game.time;
  Game.spawns["Spawn1"].spawnCreep(creepConfig, workerName, {
    memory: {
      configName: workerName,
      ready: true,
      working: true
    }
  });
  CreepsApi.add(workerName, SUPER_HARVESTER, { sourceId, containerId });
}

export { createSuperHarvesterByNum };
