import { remove } from "lodash";

const CreepsApi = {
  add: (configName: string, role: keyof RoleType, args: Record<string, any>) => {
    if (!Memory.creepConfigs) {
      Memory.creepConfigs = {};
    }
    Memory.creepConfigs[configName] = { role, args };

    console.log(`Creep config ${configName} added for role ${role} with args ${args}`);
  },

  remove: (configName: string) => {
    if (Memory.creepConfigs && Memory.creepConfigs[configName]) {
      delete Memory.creepConfigs[configName];
      console.log(`Creep config ${configName} removed`);
    }
  },

  get: (configName: string) => {
    if (Memory.creepConfigs && Memory.creepConfigs[configName]) {
      return Memory.creepConfigs[configName];
    }
    return null;
  }
};

export default CreepsApi;
