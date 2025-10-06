// ./mkbootimg dir is artifact of building
import * as EmscriptenModuleLoader from "./mkbootimg/mkbootimg";

function main(options: any) {
  return (EmscriptenModuleLoader as any).default(options);
}

export default main;