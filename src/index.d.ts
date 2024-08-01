type HARVESTER_TYPE = "harvester";
type UPDATER_TYPE = "updater";
type BUILDER_TYPE = "builder";
type SUPER_HARVESTER_TYPE = "superHarvester";
type REPAIRER_TYPE = "repairer";

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
  repairer: WorkingFlow;
}
interface Memory {
  creepConfigs?: {
    [creepName: string]: {
      role: keyof RoleType;
      args: Record<string, any>;
    };
  };
  containerForSuperHarvest?: {
    containerId: Id<StructureContainer>;
    creepName?: string;
    sourceId?: Id<Source>;
  }[];
}

interface CreepMemory {
  configName: string;
  ready: boolean;
  working: boolean;
}

interface Creep {
  work(): void;
}
