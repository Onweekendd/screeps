import { assignPrototype } from "utils/utils";
import CreepExtension from "./ExtendCreep/ExtendCreep";

/**
 * 挂载 creep 拓展
 */
export default () => {
  assignPrototype(Creep, CreepExtension);
};
