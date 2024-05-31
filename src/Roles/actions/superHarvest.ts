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
        console.log(`Container ${containerId} not found`);
        return true;
      }
      if (!creep.pos.isNearTo(container)) {
        creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
        return true;
      }
      return false;
    },
    target: (creep: Creep) => {
      return true;
    },
    source: (creep: Creep) => {
      const source = Game.getObjectById(sourceId);
      const container = Game.getObjectById(containerId);
      if (!source) {
        console.log(`Source ${sourceId} not found`);
        return true;
      }
      if (!container) {
        console.log(`Container ${containerId} not found`);
        return true;
      }
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
        console.log(`creep ${creep.name} harvest ${source.id} not in range`);
      }
      return false;
    }
  };
};
