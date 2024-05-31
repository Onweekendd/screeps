export default {
  containerStatistics: (room: Room) => {
    return room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER).length;
  },
  containerList: (room: Room) => {
    return room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER);
  },
  sourceStatistics: (room: Room) => {
    return room.find(FIND_SOURCES).length;
  },
  sourceList: (room: Room) => {
    return room.find(FIND_SOURCES);
  }
};
