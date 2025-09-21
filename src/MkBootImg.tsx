// ./mkbootimg dir is artifact of building
import EmscriptenModuleLoader from "./mkbootimg/mkbootimg";

function main(args: string[]) {
  EmscriptenModuleLoader({
    arguments: args,
    print: (text: string) => {
      console.log("mkbootimg stdout:", text);
    },
    printErr: (text: string) => {
      console.log("mkbootimg stderr:", text);
    },
  });
}

export default main;
