import { buildWokingFlow } from "./actions/build";
import { harvestWokingFlow } from "./actions/harvest";
import { updateWokingFlow } from "./actions/update";
import { superHarvestWokingFlow } from "./actions/superHarvest";

const roles: RoleType = {
  harvester: harvestWokingFlow,
  updater: updateWokingFlow,
  builder: buildWokingFlow,
  superHarvester: superHarvestWokingFlow
};

export default roles;
