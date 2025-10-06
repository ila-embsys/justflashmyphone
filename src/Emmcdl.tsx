// ./emmcdl dir is artifact of building
import * as EmscriptenModuleLoader from "./emmcdl/emmcdl";

function main(options: any) {
  return (EmscriptenModuleLoader as any).default(options);
}

export default main;