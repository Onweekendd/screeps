import { builderProvideTask } from "Roles/actions/build";

// Provider:回答"该执行哪个任务"(Task 只回答"怎么执行")。
// 自取型角色登记于此;未登记的角色仍走旧的 2 状态 WorkingFlow。
export type TaskProvider = (creep: Creep, args: Record<string, any>) => TaskDescriptor;

const providers: Partial<Record<keyof RoleType, TaskProvider>> = {
  builder: builderProvideTask
};

export function getProvider(role: keyof RoleType): TaskProvider | undefined {
  return providers[role];
}
