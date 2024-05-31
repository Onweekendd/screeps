type UpdateArgs = {
  sourceId: Id<Source>;
  containerIdList?: Id<StructureContainer>[];
};
export const updateWokingFlow: WorkingFlow = (arg: UpdateArgs) => {
  const { sourceId, containerIdList } = arg;
  return {
    target: (creep: Creep) => {
      if (creep.store[RESOURCE_ENERGY] === 0) {
        return true;
      }
      const controller = creep.room.controller;
      if (!controller) {
        console.log("Controller not found");
        return true;
      }
      if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
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
              console.log(`Container ${containerId} found, withdrawing energy`);
              creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
            return false;
          }
        }
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
