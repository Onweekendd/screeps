type HarvestArgs = {
  sourceId: Id<Source>;
  targetTypeList: Array<STRUCTURE_STORAGE>;
};
export const harvestWokingFlow: WorkingFlow = (arg: HarvestArgs) => {
  const { sourceId, targetTypeList } = arg;
  return {
    target: (creep: Creep) => {
      if (creep.store[RESOURCE_ENERGY] === 0 || !targetTypeList) {
        return true;
      }
      let structureToBuildNum = 0;
      for (let i = 0; i < targetTypeList.length; i++) {
        const targetType = targetTypeList[i];
        console.log("targetType", targetType);

        const targetList = creep.room.find(FIND_STRUCTURES, {
          filter: structure =>
            structure.structureType === targetType &&
            structure.store &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        structureToBuildNum += targetList.length;
        if (targetList && !targetList.length) {
          console.log(`No Suitable ${targetTypeList} found in room ${creep.room.name}`);
        } else {
          if (creep.transfer(targetList[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(targetList[0], { visualizePathStyle: { stroke: "#ffffff" } });
          }
          break;
        }
      }
      if (structureToBuildNum === 0) {
        console.log(`No Suitable ${targetTypeList} found in room ${creep.room.name}`);
        creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: "#ffffff" } });
      }

      return false;
    },
    source: (creep: Creep) => {
      if (creep.store.getFreeCapacity() === 0) {
        return true;
      }
      const source = Game.getObjectById(sourceId);
      if (!source) {
        console.log(`Source ${sourceId} not found`);
        return true;
      }
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
      }
      return false;
    }
  };
};
