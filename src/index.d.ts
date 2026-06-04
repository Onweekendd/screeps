type HARVESTER_TYPE = "harvester";
type UPDATER_TYPE = "updater";
type BUILDER_TYPE = "builder";
type SUPER_HARVESTER_TYPE = "superHarvester";
type REPAIRER_TYPE = "repairer";

interface RoleType {
  harvester: unknown;
  updater: unknown;
  builder: unknown;
  superHarvester: unknown;
  repairer: unknown;
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
    sourceId?: Id<Source>;
  }[];
}

// 任务种类:对应任务工厂(src/Tasks)里登记的具体命令
type TaskType = "harvest" | "withdraw" | "build" | "deliver" | "repair" | "upgrade" | "idle" | "mine";

// 可序列化的任务描述符:存进 creep.memory,每 tick 由工厂重建成 Task 对象(架构文档 2.3)
interface TaskDescriptor {
  type: TaskType;
  // 世界目标的 id;每 tick run() 第一步拿它回世界核对(免善后)
  targetId?: string;
  // 辅助目标(MineTask 专用:targetId = containerId,sourceId = 要采的矿)
  sourceId?: string;
}

interface CreepMemory {
  configName: string;
  // 当前持有的任务描述符;命令模式的"可序列化部分"
  task?: TaskDescriptor;
}

// 生产需求:一条请求 = 缺一个 creep。每 tick 重建,不跨 tick(架构文档 2.3)
interface SpawnRequest {
  role: keyof RoleType;
  // 数字越小越优先(架构文档 2.4)
  priority: number;
  body: BodyPartConstant[];
  // 写入 creepConfigs 的角色参数(含目的地);即架构文档里所说的 "memory"
  args: Record<string, any>;
  // creep 命名前缀,默认用 role
  namePrefix?: string;
}

interface Creep {
  work(): void;
}
