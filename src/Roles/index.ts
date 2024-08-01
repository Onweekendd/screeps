import { buildWokingFlow } from "./actions/build";
import { harvestWokingFlow } from "./actions/harvest";
import { updateWokingFlow } from "./actions/update";
import { superHarvestWokingFlow } from "./actions/superHarvest";
import { repairWokingFlow } from "./actions/repair";

const roles: RoleType = {
  harvester: harvestWokingFlow,
  updater: updateWokingFlow,
  builder: buildWokingFlow,
  superHarvester: superHarvestWokingFlow,
  repairer: repairWokingFlow
};

export default roles;
