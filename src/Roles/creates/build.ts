import CreepsApi from "CreepsApi";
import ExtendCreep from "../../Creeps/ExtendCreep/ExtendCreep";
import { BUILDER } from "types";

type BuilderOptions = {
  creepConfig?: BodyPartConstant[];
  sourceId: Id<Source>;
  containerIdList?: Id<StructureContainer>[];
};
function createBuilderByNum(options: BuilderOptions) {
  const { creepConfig = [WORK, CARRY, MOVE], sourceId, containerIdList = [] } = options;
  if (
    Object.keys(Game.creeps).filter(creepName => {
      return (Game.creeps[creepName] as ExtendCreep).memory.configName?.includes(BUILDER);
    }).length <= 1
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
  Game.spawns["Spawn1"].spawnCreep(creepConfig, workerName, {
    memory: {
      configName: workerName,
      ready: true,
      working: true
    }
  });
  CreepsApi.add(workerName, BUILDER, { sourceId, containerIdList });
}

export { createBuilderByNum };
