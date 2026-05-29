import CreepsApi from "CreepsApi";
import ExtendCreep from "../../Creeps/ExtendCreep/ExtendCreep";
import { BUILDER, MAIN_SPAWN } from "types";

interface BuilderOptions {
  creepConfig?: BodyPartConstant[];
  sourceId: Id<Source>;
  containerIdList?: Id<StructureContainer>[];
}
function createBuilderByNum(options: BuilderOptions) {
  const { creepConfig = [WORK, CARRY, MOVE], sourceId, containerIdList = [] } = options;
  if (
    Object.keys(Game.creeps).filter(creepName => {
      return Game.creeps[creepName].memory.configName?.includes(BUILDER);
    }).length <= 2
  ) {
    createBuilder(creepConfig, sourceId, containerIdList);
  }
}

function createBuilder(
  creepConfig: BodyPartConstant[] = [WORK, CARRY, MOVE],
  sourceId: Id<Source>,
  containerIdList: Id<StructureContainer>[] = []
) {
  const workerName = BUILDER + Game.time;
  Game.spawns[MAIN_SPAWN].spawnCreep(creepConfig, workerName, {
    memory: {
      configName: workerName,
      ready: true,
      working: true
    }
  });
  CreepsApi.add(workerName, BUILDER, { sourceId, containerIdList });
}

export { createBuilderByNum };
