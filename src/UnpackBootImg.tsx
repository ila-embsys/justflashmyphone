// ./unpackbootimg dir is artifact of building
import EmscriptenModuleLoader from "./unpackbootimg/unpackbootimg";

function main(args: string[]) {
  EmscriptenModuleLoader({
    arguments: args,
    print: (text: string) => {
      console.log("unpackbootimg stdout:", text);
    },
    printErr: (text: string) => {
      console.log("unpackbootimg stderr:", text);
    },
  });
}

export default main;
