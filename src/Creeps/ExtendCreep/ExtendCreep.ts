import roles from "Roles";

class ExtendCreep extends Creep {
  public work(): void {
    // inital actions
    if (!Memory.creepConfigs) Memory.creepConfigs = {};
    const config = Memory.creepConfigs[this.memory.configName];
    if (!config) {
      console.log(`creep ${this.name} has no config`);
      return;
    }
    const action = roles[config.role](config.args);
    if (!action) {
      console.log(`creep ${this.name} has no action`);
      return;
    }

    // prepare for action
    if (action.prepare) {
      if (!this.memory.ready) {
        this.memory.ready = action.prepare(this);
      }
    }

    let statusChange = false;
    // workings
    if (this.memory.working) {
      statusChange = action.target(this);
    } else {
      statusChange = action.source(this);
    }

    if (statusChange) this.memory.working = !this.memory.working;
  }
}

export default ExtendCreep;
