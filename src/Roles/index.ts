import { buildWokingFlow } from "./actions/build";
import { harvestWokingFlow } from "./actions/harvest";
import { repairWokingFlow } from "./actions/repair";
import { superHarvestWokingFlow } from "./actions/superHarvest";
import { updateWokingFlow } from "./actions/update";

const roles: RoleType = {
  harvester: harvestWokingFlow,
  updater: updateWokingFlow,
  builder: buildWokingFlow,
  superHarvester: superHarvestWokingFlow,
  repairer: repairWokingFlow
};

export default roles;
