type UpdateArgs = {
  sourceId: Id<Source>;
  containerIdList?: Id<StructureContainer>[];
};
export const buildWokingFlow: WorkingFlow = (arg: UpdateArgs) => {
  const { sourceId, containerIdList } = arg;
  return {
    target: (creep: Creep) => {
      if (creep.store[RESOURCE_ENERGY] === 0) {
        return true;
      }
      const constructionSite = creep.room.find(FIND_CONSTRUCTION_SITES);
      if (constructionSite.length > 0) {
        const target = constructionSite[0];
        if (creep.build(target) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
        }
      } else {
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
