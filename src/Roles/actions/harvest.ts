interface HarvestArgs {
  sourceId: Id<Source>;
  targetTypeList: STRUCTURE_STORAGE[];
  containerIdList?: Id<StructureContainer>[];
}
export const harvestWokingFlow: WorkingFlow = (arg: HarvestArgs) => {
  const { sourceId, targetTypeList, containerIdList } = arg;
  return {
    target: (creep: Creep) => {
      if (creep.store[RESOURCE_ENERGY] === 0 || !targetTypeList) {
        return true;
      }
      let structureToBuildNum = 0;
      for (let i = 0; i < targetTypeList.length; i++) {
        const targetType = targetTypeList[i];

        const targetList = creep.room.find(FIND_STRUCTURES, {
          filter: structure =>
            structure.structureType === targetType &&
            structure.store &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        structureToBuildNum += targetList.length;
        if (targetList && !targetList.length) {
        } else {
          if (creep.transfer(targetList[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(targetList[0], { visualizePathStyle: { stroke: "#ffffff" } });
          }
          break;
        }
      }
      if (structureToBuildNum === 0) {
        creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: "#ffffff" } });
      }

      return false;
    },
    source: (creep: Creep) => {
      if (creep.store.getFreeCapacity() === 0) {
        return true;
      }
      if (containerIdList && containerIdList.length > 0) {
        for (const containerId of containerIdList) {
          const container = Game.getObjectById(containerId);
          if (container && container.store[RESOURCE_ENERGY] > 0) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
            return false;
          }
        }
      }
      const source = Game.getObjectById(sourceId);
      if (!source) {
        return true;
      }
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
      }
      return false;
    }
  };
};
