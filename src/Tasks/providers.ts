import { builderProvideTask } from "Roles/actions/build";

// Provider:回答"该执行哪个任务"(Task 只回答"怎么执行")。
// 自取型角色登记于此;未登记的角色仍走旧的 2 状态 WorkingFlow。
export type TaskProvider = (creep: Creep, args: Record<string, any>) => TaskDescriptor;

// 静态矿工:出生绑定模式(任务机制设计 6 节)。
// container 存在 → mine;container 消失(被摧毁或 hits 归零)→ idle 等重建。
export function mineProvider(_creep: Creep, args: Record<string, any>): TaskDescriptor {
  const { containerId, sourceId } = args as { containerId: Id<StructureContainer>; sourceId: Id<Source> };
  const container = Game.getObjectById(containerId);
  if (!container) {
    return { type: "idle" };
  }
  return { type: "mine", targetId: containerId, sourceId };
}

const providers: Partial<Record<keyof RoleType, TaskProvider>> = {
  builder: builderProvideTask,
  superHarvester: mineProvider
};

export function getProvider(role: keyof RoleType): TaskProvider | undefined {
  return providers[role];
}
