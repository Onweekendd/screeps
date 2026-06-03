import { harvestWokingFlow } from "./actions/harvest";
import { repairWokingFlow } from "./actions/repair";
import { updateWokingFlow } from "./actions/update";

// 仍走旧 2 状态 WorkingFlow 的角色。
// builder 和 superHarvester 已迁移到 Task 体系(见 Tasks/providers),不在此表。
const roles: Partial<RoleType> = {
  harvester: harvestWokingFlow,
  updater: updateWokingFlow,
  repairer: repairWokingFlow
};

export default roles;
