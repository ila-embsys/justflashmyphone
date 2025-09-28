// ./mkbootimg dir is artifact of building
import EmscriptenModuleLoader from "./mkbootimg/mkbootimg";

function main(options: any): Promise<ReturnType<typeof EmscriptenModuleLoader>> {
  return EmscriptenModuleLoader(options);
}

export default main;
