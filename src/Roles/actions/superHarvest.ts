type UpdateArgs = {
  containerId: Id<StructureContainer>;
  sourceId: Id<Source>;
};

// 超级采集者 只有采集功能 没有携带功能
export const superHarvestWokingFlow: WorkingFlow = (arg: UpdateArgs) => {
  const { sourceId, containerId } = arg;
  return {
    prepare: (creep: Creep) => {
      const container = Game.getObjectById(containerId);
      if (!container) {
        return false;
      }
      if (!creep.pos.isEqualTo(container.pos)) {
        creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
        return false;
      }
      return true;
    },
    target: (creep: Creep) => {
      return true;
    },
    source: (creep: Creep) => {
      const source = Game.getObjectById(sourceId);
      const container = Game.getObjectById(containerId);
      if (!source) {
        return true;
      }
      if (!container) {
        return true;
      }
      if (!creep.pos.isEqualTo(container.pos)) {
        creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
      } else {
        if (container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
          creep.harvest(source);
        }
      }

      return false;
    }
  };
};
