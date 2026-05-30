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

// 生产需求:一条请求 = 缺一个 creep。每 tick 重建,不跨 tick(架构文档 2.3)
interface SpawnRequest {
  role: keyof RoleType;
  // 数字越小越优先(架构文档 2.4)
  priority: number;
  body: BodyPartConstant[];
  // 写入 creepConfigs 的角色参数(含目的地);即架构文档里所说的 "memory"
  args: Record<string, any>;
  // 初始 CreepMemory 标志,默认均为 true
  ready?: boolean;
  working?: boolean;
  // creep 命名前缀,默认用 role
  namePrefix?: string;
}

interface Creep {
  work(): void;
}
