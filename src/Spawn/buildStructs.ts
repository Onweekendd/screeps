/**
 * 建筑需求扫描层(架构文档 6 / 全景图)。
 *
 * 职责只有「规划 → 放工地」一端:扫描世界,把本 RCL 该有却还缺的工地放下去。
 * 放完即汇入通用建造线,由 builder 自取(消费端早已是需求驱动,无需在此重复)。
 * 工地不需要像 spawn 那样抢能量,所以不套 Request 队列 + 优先级仲裁
 * (架构文档 4:要统一的是「需求→消费者」的模式,不是所有任务都套同一种数据结构)。
 */

// 建筑需求扫描的统一入口。靠「工地是否已存在」自然节流,不按 tick 取模(架构文档 6:规划绝不每 tick 算)。
function planConstruction(data: { room: Room; sources: Source[]; anchor: RoomPosition }) {
  const { room, sources, anchor } = data;

  // source 驱动的 container:每个 source 旁缺一个就补
  planSourceContainers(room, sources);

  // storage / tower:缺了就在 spawn 附近找位置放工地
  planNearAnchor(room, anchor, STRUCTURE_STORAGE, 2, 5);
  planNearAnchor(room, anchor, STRUCTURE_TOWER, 2, 8);

  // extension:当前没有待建的 extension 工地时,才规划下一批
  // —— 工地存在与否本身就是节流器,一批没建完就不重算 BFS
  const pendingExtensions = room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: { structureType: STRUCTURE_EXTENSION }
  }).length;
  if (pendingExtensions === 0) {
    planExtensionsByBFS({ room, anchor });
  }
}

/**
 * 以锚点(通常是 spawn)为中心，用 BFS 由近到远规划 extension。
 *
 * 不建路的前提下，靠「棋盘着色」保证每个 extension 都可达：
 * 只在与锚点同奇偶的格子上建 extension，另一半格子全部留作走道。
 * 正交相邻两格的奇偶必然相反，所以每个 extension 的上下左右都是走道，
 * creep 能贴着填能量；走道格之间靠斜向连通，整张网不建路也连成一片。
 */
function planExtensionsByBFS(data: {
  room: Room;
  anchor: RoomPosition; // 锚点，一般传 spawn.pos
  maxRange?: number; // BFS 最大扩散半径
  maxSites?: number; // 单 tick 最多新建工地数，避免一次铺太多
}) {
  const { room, anchor, maxRange = 10, maxSites = 5 } = data;
  if (!checEnableBuild(room, STRUCTURE_EXTENSION)) {
    return;
  }
  const terrain = Game.map.getRoomTerrain(room.name);
  // 与锚点同奇偶的格子作为「建筑色」，另一半留作走道
  const buildParity = (anchor.x + anchor.y) % 2;

  // 一次性算好需要让位的关键目标(source / controller)，避免在 BFS 里反复 find
  const reserved = room.find(FIND_SOURCES).map(s => s.pos);
  if (room.controller) {
    reserved.push(room.controller.pos);
  }

  const visited = new Set<number>();
  const queue: { x: number; y: number; dist: number }[] = [{ x: anchor.x, y: anchor.y, dist: 0 }];
  visited.add(anchor.y * 50 + anchor.x);

  let placed = 0;
  while (queue.length > 0 && placed < maxSites) {
    const { x, y, dist } = queue.shift()!;

    // 锚点本身跳过；只在建筑色且合法的格子上落工地
    if (dist > 0 && (x + y) % 2 === buildParity && canPlaceExtension(room, terrain, x, y, reserved)) {
      if (room.createConstructionSite(x, y, STRUCTURE_EXTENSION) === OK) {
        placed++;
      }
    }

    if (dist >= maxRange) {
      continue;
    }
    // 向 8 邻接扩散
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) {
          continue;
        }
        const nx = x + dx;
        const ny = y + dy;
        // 留出房间边界(0、49 不可建)
        if (nx < 1 || nx > 48 || ny < 1 || ny > 48) {
          continue;
        }
        const key = ny * 50 + nx;
        if (visited.has(key)) {
          continue;
        }
        visited.add(key);
        queue.push({ x: nx, y: ny, dist: dist + 1 });
      }
    }
  }
}

/** 判断某格能否放 extension：避开墙、已有建筑/工地，并给 source、controller 让出 2 格 */
function canPlaceExtension(room: Room, terrain: RoomTerrain, x: number, y: number, reserved: RoomPosition[]): boolean {
  if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
    return false;
  }
  if (room.lookForAt(LOOK_STRUCTURES, x, y).length > 0) {
    return false;
  }
  if (room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0) {
    return false;
  }
  // 给 source / controller 周围 2 格让位，避免堵住采集与升级
  return !reserved.some(pos => Math.max(Math.abs(pos.x - x), Math.abs(pos.y - y)) <= 2);
}

/**
 * source 驱动的 container 规划(架构文档 7)。
 * 每个 source 旁若既无 container 也无在建工地,就在邻接空地放一个
 * —— 这正是静态矿工将来要站的位置,边挖边把能量倒进脚下 container。
 */
function planSourceContainers(room: Room, sources: Source[]) {
  if (!checEnableBuild(room, STRUCTURE_CONTAINER)) {
    return;
  }
  const terrain = Game.map.getRoomTerrain(room.name);
  sources.forEach(source => {
    const hasContainer =
      source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      }).length > 0;
    const hasSite =
      source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      }).length > 0;
    if (hasContainer || hasSite) {
      return;
    }
    const spot = findContainerSpot(room, terrain, source.pos);
    if (spot) {
      room.createConstructionSite(spot.x, spot.y, STRUCTURE_CONTAINER);
    }
  });
}

/** 在 source 周围 8 邻接里找一个可站立(非墙、无建筑/工地)的格子放 container */
function findContainerSpot(room: Room, terrain: RoomTerrain, pos: RoomPosition): { x: number; y: number } | undefined {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const x = pos.x + dx;
      const y = pos.y + dy;
      if (x < 1 || x > 48 || y < 1 || y > 48) {
        continue;
      }
      if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
        continue;
      }
      if (room.lookForAt(LOOK_STRUCTURES, x, y).length > 0) {
        continue;
      }
      if (room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0) {
        continue;
      }
      return { x, y };
    }
  }
  return undefined;
}

/** 该结构在本 RCL 是否还有名额(现存 + 在建 < 上限) */
function checEnableBuild(
  room: Room,
  structureType: STRUCTURE_EXTENSION | STRUCTURE_CONTAINER | STRUCTURE_STORAGE | STRUCTURE_TOWER
): boolean {
  if (!room.controller) return false;
  const maxCount = CONTROLLER_STRUCTURES[structureType][room.controller.level];
  if (maxCount === 0) return false;
  const current = room.find(FIND_STRUCTURES, { filter: { structureType } }).length;
  const constructionSites = room.find(FIND_CONSTRUCTION_SITES, { filter: { structureType } }).length;
  return current + constructionSites < maxCount;
}

/** 在 anchor 附近由近到远找第一个空位放工地(用于 storage/tower 等单件建筑) */
function planNearAnchor(
  room: Room,
  anchor: RoomPosition,
  structureType: STRUCTURE_STORAGE | STRUCTURE_TOWER,
  minRange: number,
  maxRange: number
): void {
  if (!checEnableBuild(room, structureType)) return;
  const terrain = Game.map.getRoomTerrain(room.name);
  for (let range = minRange; range <= maxRange; range++) {
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (Math.abs(dx) !== range && Math.abs(dy) !== range) continue; // 只扫当前环
        const x = anchor.x + dx;
        const y = anchor.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;
        if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;
        if (room.lookForAt(LOOK_STRUCTURES, x, y).length > 0) continue;
        if (room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0) continue;
        room.createConstructionSite(x, y, structureType);
        return;
      }
    }
  }
}

export { planConstruction };
