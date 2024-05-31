type HARVESTER_TYPE = "harvester";
type UPDATER_TYPE = "updater";
type BUILDER_TYPE = "builder";
type SUPER_HARVESTER_TYPE = "superHarvester";

type WorkingFlow = (workArguments: any) => {
  // 前置准备工作 如到岗
  prepare?: (creep: Creep) => boolean;
  // 正式工作
  target: (creep: Creep) => boolean;
  // 获取资源
  source: (creep: Creep) => boolean;
  // 空闲
  free?: (creep: Creep) => boolean;
};

interface RoleType {
  harvester: WorkingFlow;
  updater: WorkingFlow;
  builder: WorkingFlow;
  superHarvester: WorkingFlow;
}
interface Memory {
  creepConfigs?: {
    [creepName: string]: {
      role: keyof RoleType;
      args: Record<string, any>;
    };
  };
  containerForHarvest?: Map<Id<StructureContainer>, Id<Creep>>;
}

interface CreepMemory {
  configName: string;
  ready: boolean;
  working: boolean;
}

interface Creep {
  work(): void;
}
