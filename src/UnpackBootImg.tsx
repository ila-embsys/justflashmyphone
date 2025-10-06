// ./unpackbootimg dir is artifact of building
import * as EmscriptenModuleLoader from "./unpackbootimg/unpackbootimg";

function main(options: any) {
  return (EmscriptenModuleLoader as any).default(options);
}

export default main;