// ./emmcdl dir is artifact of building
import EmscriptenModuleLoader from "./emmcdl/emmcdl.js";

declare global {
  interface Navigator {
    // This USB type comes from @types/w3c-web-usb
    readonly usb: USB;
  }
}

async function main(...args: string[]) {
  console.log("crossOriginIsolated: ", crossOriginIsolated);
  await navigator.usb.requestDevice({
    filters: [{ vendorId: 0x05c6, productId: 0x9008 }],
  });

  const Module = await EmscriptenModuleLoader({
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
