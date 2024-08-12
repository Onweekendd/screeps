// 扫描房间地形
function Scanner(roomName: string) {
  const room = Game.rooms[roomName];
  if (!room) {
    return;
  }
  const resulut = new Array<Array<string>>([]);
  const terrain = room.getTerrain();
  const roomWidth = 50;
  const roomHeight = 50;
  for (let y = 0; y < roomHeight; y++) {
    resulut.push([]);
    for (let x = 0; x < roomWidth; x++) {
      const currentTerrain = terrain.get(x, y);
      if (currentTerrain === 0) {
        resulut[y].push("地");
      } else if (currentTerrain === 1) {
        resulut[y].push("墙");
      } else if (currentTerrain === 2) {
        resulut[y].push("沼");
      }
    }
    console.log(JSON.stringify(resulut[y]));
  }
}

export default Scanner;
