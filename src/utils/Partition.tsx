import { FileWithPath } from "react-dropzone/.";

export interface Slot {
  size: number;
  type: string;
  image: FileWithPath[];
  flashProgress: number | undefined;
}

export type Slots = Map<string, Slot>;
export type Partitions = Map<string, Slots>;

export const parsePartitionName = (fullName: string) => {
  const split = fullName.split("_")

  if (split.length > 1) {
    const ext = split[split.length - 1]
    const match = ext.match(/^[a-zA-Z]$/)
    if (match) {
      const base = split.slice(0, -1).join("_");
      const ret = [base, ext];
      return ret;
    }
  }

  return [fullName, undefined];

};
