interface HarvestArgs {
  sourceId: Id<Source>;
  containerIdList?: Id<StructureContainer>[];
}
export const repairWokingFlow: WorkingFlow = (arg: HarvestArgs) => {
  const { sourceId, containerIdList } = arg;
  return {
    target: (creep: Creep) => {
      if (creep.store[RESOURCE_ENERGY] === 0) {
        return true;
      }
      let structureToRepairNum = 0;
      // 墙 / rampart 的 hitsMax 高达数亿且初始 hits=1，纳入会让修理工把能量无限砸进墙体，先排除
      const structureList = creep.room
        .find(FIND_STRUCTURES)
        .filter(s => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART);
      // 升序：受损最重（hits 最小）的优先修，原来是降序，等于先修最完好的
      structureList.sort((a, b) => a.hits - b.hits);
      for (const structure of structureList) {
        if (structure.hits < structure.hitsMax) {
          structureToRepairNum += 1;
          if (creep.repair(structure) === ERR_NOT_IN_RANGE) {
            creep.moveTo(structure, { visualizePathStyle: { stroke: "#ffffff" } });
            break;
          }
        }
      }
      if (structureToRepairNum === 0) {
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
