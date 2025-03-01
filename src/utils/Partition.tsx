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
  const re = /(?<name>.+)(?=_(?<suffix>[a-z])$)/;
  const group = { name: 1, suffix: 2 };
  const regex = re.exec(fullName);

  const [, name, suffix] = re.exec(fullName) || [
    undefined,
    undefined,
    undefined,
  ];

  return [name, suffix];
};
