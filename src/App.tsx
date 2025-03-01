import "./App.css";

import {
  Alignment,
  Button,
  ButtonGroup,
  Callout,
  Card,
  CardList,
  Classes,
  Divider,
  H5,
  Intent,
  Navbar,
} from "@blueprintjs/core";
import { Record } from "@blueprintjs/icons";
import { FC, useCallback, useEffect, useState } from "react";
import {
  fastbootFlash,
  demoFlash,
  getDemoEnvVars,
  getEnvVars,
} from "./utils/FastBoot";
import { Partition } from "./Cards/Partition";

import { FileWithPath, useDropzone } from "react-dropzone";
import { parsePartitionName, Partitions, Slot, Slots } from "./utils/Partition";
import { SlotSelect } from "./Cards/SlotSelector";

import emmcdl from "./Emmcdl";

const App: FC = () => {
  // TODO: Avoid magic
  // Usage of "items: Record<string, any>" type instead of straight "Record<string, any>"
  // is added to have an ability to change outer object with preserving inner one
  // Otherwise, React will not re-render page
  const [envVars, setEnvVars] = useState<{ items: Record<string, any> }>({
    items: {},
  });
  // TODO: Avoid magic
  // Usage of "{ items: Partitions }" type instead of straight "Partitions"
  // is added to have an ability to change outer object with preserving inner one
  // Otherwise, React will not re-render page
  const [partitions, setPartitions] = useState<{ items: Partitions }>({
    items: new Map(),
  });
  const [demoConnect, setDemoConnect] = useState(false);
  const [flashingInProgress, setFlashingInProgress] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      for (const file of acceptedFiles) {
        const splitName = file.name.split(".");
        const ext = splitName[splitName.length - 1];
        const baseName = file.name.slice(0, -(ext.length + 1));

        if (!["img", "bin"].includes(ext)) continue;

        const [name, suffix] = parsePartitionName(baseName);

        const partition =
          name && suffix
            ? partitions.items.get(name)
            : partitions.items.get(baseName);

        if (!partition) continue;

        const slot = suffix ? partition.get(suffix) : partition.get("");

        if (!slot) continue;

        slot.image.push(file);
      }

      setPartitions(partitions);
    },
    [partitions],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    let newPartitions: Partitions = new Map();

    envVars.items["partition-size"]
      ? Object.keys(envVars.items["partition-size"]).forEach((fullName) => {
          const [name, suffix] = parsePartitionName(fullName);

          const updateSlot = (
            partition_name: string,
            slot_name: string,
            slot: Slot,
          ) => {
            const slots = newPartitions.get(partition_name);

            if (slots) {
              slots.set(slot_name, slot);
            } else {
              const slots: Slots = new Map();
              slots.set(slot_name, slot);
              newPartitions.set(partition_name, slots);
            }
          };

          const isSlot = name && suffix;

          const slot: Slot = {
            size: envVars.items["partition-size"][fullName],
            type: envVars.items["partition-type"][fullName],
            image: [],
            flashProgress: undefined,
          };

          if (isSlot) {
            updateSlot(name, suffix, slot);
          } else {
            updateSlot(fullName, "", slot);
          }
        })
      : [];

    console.log(newPartitions);

    setPartitions({ items: newPartitions });
  }, [envVars]);

  const readDeviceInfo = useCallback(() => {
    const fn = async () => {
      const vars = demoConnect ? await getDemoEnvVars() : await getEnvVars();
      console.log(vars);

      if (vars) {
        setEnvVars({ items: vars });
      }
    };

    fn();
  }, [demoConnect]);

  const clearDeviceInfo = useCallback(() => {
    setPartitions({ items: new Map() });
    setEnvVars({ items: {} });
  }, []);

  const partitionCards: JSX.Element[] = [];

  for (const [partition_name, slots] of partitions.items) {
    let params = [];

    for (const [slot_name, slot] of slots) {
      params.push({
        suffix: slot_name,
        slot: slot,
      });
    }

    const card = (
      <Partition key={partition_name} name={partition_name} params={params} />
    );

    partitionCards.push(card);
  }

  const checkImage = () => {
    for (const slots of partitions.items.values()) {
      for (const slot of slots.values()) {
        if (slot.image.length > 0) {
          return true;
        }
      }
    }
    return false;
  };

  const hasImage = checkImage();

  const hasEnvVars = Object.entries(envVars.items).length > 0;

  return (
    <div className={`app ${Classes.DARK}`}>
      <Navbar fixedToTop>
        <Navbar.Group align={Alignment.LEFT}>
          <Button
            disabled={flashingInProgress}
            intent={hasEnvVars ? Intent.NONE : Intent.PRIMARY}
            text={hasEnvVars ? "Clear Device Info" : "Read Device Info"}
            onClick={hasEnvVars ? clearDeviceInfo : readDeviceInfo}
          />
          <Divider />
          Boot slot
          <Divider />
          <SlotSelect
            disabled={flashingInProgress}
            demo={demoConnect}
            envVars={envVars.items}
            setSlotInfo={(newSlot: string) => {
              let newEnvVars = { items: envVars.items };
              newEnvVars.items["current-slot"] = newSlot;
              setEnvVars(newEnvVars);
            }}
          />
          <Divider />
          <ButtonGroup>
            <Button
              disabled={!hasImage || flashingInProgress}
              icon="import"
              text="Flash All"
              loading={flashingInProgress}
              intent={hasImage ? "danger" : "none"}
              onClick={async () => {
                setFlashingInProgress(true);
                if (demoConnect) {
                  await demoFlash(partitions.items, setPartitions);
                } else {
                  await fastbootFlash(partitions.items, setPartitions);
                }
                setFlashingInProgress(false);
              }}
            />
            <Button
              disabled={flashingInProgress || true} // TODO: not implemented
              icon="export"
              text="Read All"
            />
            <Button
              disabled={flashingInProgress || true} // TODO: not implemented
              icon="eraser"
              text="Wipe All"
            />
          </ButtonGroup>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <Button
            disabled={flashingInProgress}
            active={demoConnect}
            onClick={() => {
              setDemoConnect(!demoConnect);
              if (demoConnect) {
                clearDeviceInfo();
              }
            }}
          >
            Use Demo Connection
          </Button>
        </Navbar.Group>
      </Navbar>
      {partitions.items.size > 0 ? (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <Callout
            icon="hand-right"
            intent={isDragActive ? "success" : hasImage ? "none" : "primary"}
          >
            <H5>
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>
                  Drag 'n' drop some files here, or click here to select files
                </p>
              )}
            </H5>
            <p>
              Files with extensions '.img' and '.bin' will be filtered and
              selected for matched partitions
            </p>
          </Callout>
        </div>
      ) : (
        <Callout icon="info-sign">
          <div>
            <H5>
              <p>Connect a device, then read its partitions</p>
            </H5>
            <p>
              After receiving the list of partitions, it will be possible to
              drop image files for them here
            </p>
          </div>
        </Callout>
      )}

      {partitionCards ?? (
        <Card>
          <CardList className="partitions">{partitionCards}</CardList>
        </Card>
      )}
    </div>
  );
};

export default App;
