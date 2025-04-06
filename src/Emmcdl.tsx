// ./emmcdl dir is artifact of building
import EmscriptenModuleLoader from "./emmcdl/emmcdl";

declare global {
  interface Navigator {
    // This USB type comes from @types/w3c-web-usb
    readonly usb: USB;
  }
}

function main(args: string[]) {
  console.log("crossOriginIsolated: ", crossOriginIsolated);
  // Commented out to not bother the user since
  // this variant of flashing doesn't work
  // await navigator.usb.requestDevice({
  //   filters: [{ vendorId: 0x05c6, productId: 0x9008 }],
  // });

  EmscriptenModuleLoader({
    arguments: args,
    print: (text: string) => {
      console.log("stdout: " + text);
    },
    printErr: (text: string) => {
      console.warn("stderr: " + text);
    },
  });
}

export default main;
