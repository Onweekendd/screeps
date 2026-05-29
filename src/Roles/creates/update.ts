import CreepsApi from "CreepsApi";
import ExtendCreep from "../../Creeps/ExtendCreep/ExtendCreep";
import { UPDATER, MAIN_SPAWN } from "types";

type UpdaterOptions = {
  creepConfig?: BodyPartConstant[];
  sourceId: Id<Source>;
  containerIdList?: Id<StructureContainer>[];
};
function createUpdaterByNum(options: UpdaterOptions) {
  const { creepConfig = [WORK, CARRY, MOVE], sourceId, containerIdList = [] } = options;
  if (
    Object.keys(Game.creeps).filter(creepName => {
      return (Game.creeps[creepName] as ExtendCreep).memory.configName?.includes(UPDATER);
    }).length <= 1
  ) {
    createUpdater(creepConfig, sourceId, containerIdList);
  }
}

function createUpdater(
  creepConfig: BodyPartConstant[] = [WORK, CARRY, MOVE],
  sourceId: Id<Source>,
  containerIdList: Id<StructureContainer>[] = []
) {
  const workerName = UPDATER + Game.time;
  Game.spawns[MAIN_SPAWN].spawnCreep(creepConfig, workerName, {
    memory: {
      configName: workerName,
      ready: true,
      working: true
    }
  });
  CreepsApi.add(workerName, UPDATER, { sourceId, containerIdList });
}

export { createUpdaterByNum };
