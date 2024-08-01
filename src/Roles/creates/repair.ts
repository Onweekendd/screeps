import CreepsApi from "CreepsApi";
import ExtendCreep from "../../Creeps/ExtendCreep/ExtendCreep";
import { REPAIRER } from "types";

type RepairerOptions = {
  creepConfig?: BodyPartConstant[];
  sourceId: Id<Source>;
  containerIdList?: Id<StructureContainer>[];
};
function createRepairerByNum(options: RepairerOptions) {
  const {
    creepConfig = [WORK, CARRY, MOVE],
    sourceId,
    containerIdList = []
  } = options;
  if (
    Object.keys(Game.creeps).filter(creepName => {
      return (Game.creeps[creepName] as ExtendCreep).memory.configName?.includes(REPAIRER);
    }).length <= 1
  ) {
    createRepairer(creepConfig, sourceId, containerIdList);
  }
}

function createRepairer(
  creepConfig: BodyPartConstant[] = [WORK, CARRY, MOVE],
  sourceId: Id<Source>,
  containerIdList: Id<StructureContainer>[]
) {
  const workerName = REPAIRER + Game.time;
  Game.spawns["Spawn1"].spawnCreep(creepConfig, workerName, {
    memory: {
      configName: workerName,
      ready: true,
      working: true
    }
  });
  CreepsApi.add(workerName, REPAIRER, { sourceId, containerIdList });
}

export { createRepairerByNum };
