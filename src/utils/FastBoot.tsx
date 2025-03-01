import { FastbootDevice, setDebugLevel } from "android-fastboot";
import demoVars from "../demo_vars";
import { MergeRecursive } from "./Common";
import { Partitions } from "./Partition";
import { FlashProgressCallback } from "android-fastboot/dist/fastboot";

setDebugLevel(2);

export function parseEnvVar(string: string): Record<string, unknown> | null {
  const splitString = string.split(":");

  if (splitString.length <= 1) {
    // Skip value without key
    console.log(`The line does not look like a key:value '${string}'`);
    return null;
  }

  const keys = splitString.slice(0, -1); // all items except the last
  let val: string | number | boolean;

  val = splitString[splitString.length - 1]; // the last item

  val = val.trimStart(); // remove leading whitespaces

  {
    let num: number;
    if (val.startsWith("0x")) {
      num = parseInt(val, 16);
    } else {
      num = parseInt(val, 10);
    }

    if (!Number.isNaN(num)) {
      val = num;
    }
  }

  if (val === "yes") {
    val = true;
  }
  if (val === "no") {
    val = false;
  }

  let envvar: Record<string, unknown> = {};

  for (const key of keys.reverse()) {
    if (Object.keys(envvar).length === 0) {
      envvar = { [key]: val };
    } else {
      envvar = { [key]: envvar };
    }
  }

  return envvar;
}

const parseEnvVars = (rawEnvVars: string) => {
  const lines = rawEnvVars.split("\n").reverse();

  let newEnvVars: Record<string, unknown> = {};
  for (const line of lines) {
    const newEnvVar = parseEnvVar(line);

    if (newEnvVar === null) continue;

    newEnvVars = MergeRecursive(newEnvVars, newEnvVar);
  }

  return newEnvVars;
};

export const getEnvVars = async () => {
  const dev = new FastbootDevice();
  await dev.connect();
  const resp = await dev.getVariable("all");

  if (!resp) return;

  return parseEnvVars(resp);
};

export const getDemoEnvVars = async () => {
  return parseEnvVars(demoVars);
};

const sleep = (m: number) => new Promise((r) => setTimeout(r, m));

const demoFlashBlob = async (
  partition: string,
  blob: Blob,
  onProgress?: FlashProgressCallback,
) => {
  for (let i = 0; i <= 100; i = i + 20) {
    await sleep(1);
    onProgress ? onProgress(i / 100) : null;
    console.log(`'${partition}': ${i}%`);
  }
};

const commonFlash = async (
  partitions: Partitions,
  setPartitions: CallableFunction,
  dev: FastbootDevice | undefined,
) => {
  const updatePartitions = () => {
    // TODO: Avoid magic
    // Creating here a new object with the old item inside
    // allows react to see a new object without extra copying
    setPartitions({ items: partitions });
  };

  for (const slots of partitions.values()) {
    for (const slot of slots.values()) {
      if (slot.image.length > 0) {
        slot.flashProgress = 0;
      }
    }
  }

  updatePartitions();

  for (const [partName, slots] of partitions) {
    for (const [slotName, slot] of slots) {
      // TODO: Why here is more images than one?
      if (slot.image.length === 0) continue;

      if (slot.image[0].size > 1e9) {
        console.warn(
          `'${slot.image[0].name}}': too big file size (${slot.image[0].size}), skipping`,
        );
        continue;
      }

      const fullPartitionName =
        slotName === "" ? partName : `${partName}_${slotName}`;

      // TODO: What to do with another images?
      const blob: Blob = new Blob([await slot.image[0].arrayBuffer()]);

      console.log(`Flashing ${blob.size} bytes of '${fullPartitionName}'...`);

      const setProgress = (progress: number) => {
        slot.flashProgress = progress < 1 ? progress : 0.99; // 100 will be marked as done
        updatePartitions();
      };

      if (dev) {
        // TODO: ATTENTION: flashBlob expects partition name without slot suffix
        //
        // The method checks if the partition has "has-slot" mark
        // then adds the suffix of current active slot if it has
        //
        // However, since we want to flash slots despite
        // current active slot or implement own logic,
        // we pass here the full partition name with a suffix
        // and hope nothing will be broken.
        //
        // Expected that internal logic of adding suffix will never be triggered
        // since partition names having a tail with a suffix can not have one more suffix

        await dev.flashBlob(fullPartitionName, blob, setProgress);
      } else {
        await demoFlashBlob(fullPartitionName, blob, setProgress);
      }
      slot.flashProgress = 1;
      updatePartitions();
    }
  }
};

export const demoFlash = async (
  partitions: Partitions,
  setPartitions: CallableFunction,
) => {
  await commonFlash(partitions, setPartitions, undefined);
};

export const fastbootFlash = async (
  partitions: Partitions,
  setPartitions: CallableFunction,
) => {
  const dev = new FastbootDevice();
  await dev.connect();

  await commonFlash(partitions, setPartitions, dev);
};

export const setSlot = async (slotName: string): Promise<string | null> => {
  const dev = new FastbootDevice();
  await dev.connect();
  console.log(`Requesting set slot '${slotName}'...`)
  await dev.runCommand(`set_active ${slotName}`);
  const slot = await dev.getVariable("current-slot");
  console.log(`Read back current slot: '${slotName}'`)
  return slot;
};
