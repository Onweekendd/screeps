import CreepsApi from "CreepsApi";
import ExtendCreep from "../../Creeps/ExtendCreep/ExtendCreep";
import { SUPER_HARVESTER, MAIN_SPAWN } from "types";

type SuperHarvesterOptions = {
  creepConfig?: BodyPartConstant[];
  containerId: Id<StructureContainer>;
  sourceId: Id<Source>;
  containerNum?: number;
};
function createSuperHarvesterByNum(options: SuperHarvesterOptions) {
  const { creepConfig = [WORK, CARRY, MOVE], sourceId, containerId, containerNum = 1 } = options;
  const creepList = Object.keys(Game.creeps);
  if (
    creepList.filter(creepName => {
      return (Game.creeps[creepName] as ExtendCreep).memory.configName?.includes(SUPER_HARVESTER);
    }).length < containerNum
  ) {
    createSuperHarvester(creepConfig, sourceId, containerId);
  }
}

function createSuperHarvester(
  creepConfig: BodyPartConstant[] = [WORK, CARRY, MOVE],
  sourceId: Id<Source>,
  containerId: Id<StructureContainer>
) {
  const creepName = SUPER_HARVESTER + Game.time + Math.floor(Math.random() * 1000);
  Game.spawns[MAIN_SPAWN].spawnCreep(creepConfig, creepName, {
    memory: {
      configName: creepName,
      ready: false,
      working: false
    }
  });
  if (Memory.containerForSuperHarvest) {
    const containerForSuperHarvest = Memory.containerForSuperHarvest.find(z => z.containerId === containerId);
    if (containerForSuperHarvest) {
      containerForSuperHarvest.creepName = creepName;
    } else {
      Memory.containerForSuperHarvest.push({ containerId, creepName });
    }
  }
  CreepsApi.add(creepName, SUPER_HARVESTER, { sourceId, containerId });
}

export { createSuperHarvesterByNum };
