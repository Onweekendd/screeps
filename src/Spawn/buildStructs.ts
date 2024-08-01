function buildStructuresAroundTarget(data: {
  targetPosition: RoomPosition;
  room: Room;
  structureType: STRUCTURE_EXTENSION | STRUCTURE_CONTAINER;
  range?: number;
  distance?: number;
}) {
  const { targetPosition, room, structureType, range = 1, distance = 1 } = data;
  if (!checEnableBuild(room, structureType)) return;
  // 获取目标的位置
  const { x, y } = targetPosition;

  // 遍历范围内的每个位置
  for (let dx = -range; dx <= range; dx += distance) {
    for (let dy = -range; dy <= range; dy += distance) {
      // 计算目标位置
      const targetX = x + dx;
      const targetY = y + dy;

      buildStructures(room, targetX, targetY, structureType);
    }
  }
}

function buildStructures(room: Room, x: number, y: number, structureType: STRUCTURE_EXTENSION | STRUCTURE_CONTAINER) {
  const buildPosition = Game.map.getRoomTerrain(room.name).get(x, y);
  // 检查目标位置是否可建造
  if (buildPosition !== TERRAIN_MASK_WALL) {
    // 尝试在目标位置建造container
    room.createConstructionSite(x, y, structureType);
  }
}

function checEnableBuild(room: Room, structureType: STRUCTURE_EXTENSION | STRUCTURE_CONTAINER): boolean {
  // 获取当前房间控制等级允许的最大extension数量
  const maxExtensions = CONTROLLER_STRUCTURES[structureType][room.controller!.level];
  // 获取当前房间内的extension数量
  const currentExtensions = room.find(FIND_MY_STRUCTURES, {
    filter: { structureType: structureType }
  }).length;
  // 获取当前房间内的extension建造工地数量
  const constructionSites = room.find(FIND_CONSTRUCTION_SITES, {
    filter: { structureType: structureType }
  }).length;

  // 如果当前的extension数量和建造中的extension数量之和已经达到上限，则不再建造
  if (currentExtensions + constructionSites >= maxExtensions) {
    return false;
  }

  return true;
}
export { buildStructuresAroundTarget };
