function containerCheck(containerId: Id<StructureContainer>): boolean {
  const container = Game.getObjectById(containerId);
  return container ? true : false;
}

export { containerCheck };
