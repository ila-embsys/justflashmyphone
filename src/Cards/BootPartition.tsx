/**
 * @file BootPartition.tsx
 * @description Component for managing and displaying the contents of a boot.img partition.
 *
 * Requirements:
 * - Shows the internals of `boot.img` partition
 * - Allows to download the components: kernel, ramdisk and dtb
 * - Allows to edit `cmdline`
 * - Allows to repack the internals of `boot.img` partition if they were changed
 * - Provides visual feedback (warning intent) for fields that have been modified.
*/

import {
  Button,
  Card,
  Callout,
  EditableText,
  FileInput,
  FormGroup,
  H5,
  ProgressBar,
  HTMLSelect,
  Collapse,
  Icon,
  Tag,
  CompoundTag,
  H6,
  CardList,
  Elevation,
  EntityTitle,
  ButtonGroup,
  Intent,
} from "@blueprintjs/core";
import { Fragment, useEffect, useState } from "react";

import { FileWithPath } from "react-dropzone";
import { Slot } from "../utils/Partition";
import unpackbootimg from "../UnpackBootImg";
import { runEmscripten } from "../utils/Emscripten";
import { prettyBytes } from "../utils/Common";

import "./BootPartition.css";
export interface BootImageContents {
  params: Record<string, string>;
  files: Record<string, File>;
}

export interface BootSlot extends Slot {
  image: FileWithPath[];
  unpacked?: BootImageContents;
  isDirty?: boolean;
  dirtyFields?: Set<string>;
}

interface BootPartitionParams {
  suffix: string;
  slot: BootSlot;
}

interface BootPartitionProps {
  name: string;
  params: BootPartitionParams[];
}

const PAGE_SIZES = [
  { value: "2048", label: "2K" },
  { value: "4096", label: "4K" },
  { value: "8192", label: "8K" },
  { value: "16384", label: "16K" },
  { value: "32768", label: "32K" },
  { value: "65536", label: "64K" },
  { value: "131072", label: "128K" },
];

const EditableCompoundTag = ({
  label,
  value,
  onConfirm,
  placeholder,
  intent,
}: {
  label: string;
  value: string;
  onConfirm: (value: string) => void;
  placeholder?: string;
  intent?: Intent;
}) => {
  return (
    <CompoundTag minimal leftContent={label} intent={intent}>
      <EditableText
        value={value}
        onConfirm={onConfirm}
        onChange={onConfirm}
        placeholder={placeholder}
        minWidth={0}
      />
    </CompoundTag>
  );
};

const SelectableCompoundTag = ({
  label,
  value,
  options,
  onChange,
  intent,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  intent?: Intent;
}) => {
  return (
    <CompoundTag minimal leftContent={label} className="selectable-compound-tag" intent={intent}>
      <HTMLSelect
        minimal
        className="selectable-compound-tag-select"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        options={options}
        iconProps={{ style: { top: "0px" } }} // This ensures vertical alignment
        style={{ height: "unset", fontSize: "12px" }}
      />
    </CompoundTag>
  );
}

const BinaryPart = ({
  name,
  file,
  offset,
  onFileChange,
  onOffsetChange,
  intent,
  offsetIntent,
}: {
  name: string;
  file: File | undefined;
  offset: string;
  onFileChange: (partName: string, newFile: File) => void;
  onOffsetChange: (value: string) => void;
  intent?: Intent;
  offsetIntent?: Intent;
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (newFile) {
      onFileChange(name, newFile);
    }
  };

  const downloadFile = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="binary-part-card">
      <div className="binary-part-header">
        <div className="binary-part-header-content">
          <H6>{name.charAt(0).toUpperCase() + name.slice(1)}</H6>
          <EditableCompoundTag
            label="Offset"
            value={offset}
            onConfirm={onOffsetChange}
            intent={offsetIntent}
          />
        </div>
        <Button icon="download" onClick={downloadFile} disabled={!file} />
      </div>
      <Callout icon={null} intent={intent} style={{ padding: "0px" }}>
        <FileInput
          fill
          className="file-input-rtl"
          text={file ? file.name : `Select ${name}...`}
          onInputChange={handleFileChange}
        />
      </Callout>
    </Card>
  );
};

const CmdlineCard = ({
  cmdline,
  onCmdlineChange,
  intent,
}: {
  cmdline: string;
  onCmdlineChange: (value: string) => void;
  intent?: Intent;
}) => {
  return (
    <Card className="cmdline-card">
      <H5>Command Line</H5>
      <Callout className="cmdline-container" icon={null} intent={intent} >
        <div className="cmdline-card-content">
          <EditableText
            value={cmdline}
            onConfirm={onCmdlineChange}
            onChange={onCmdlineChange}
            multiline
            minLines={3}
            maxLines={10}
            className="cmdline-editable-text"
          />
        </div>
      </Callout>
    </Card>

  );
};

const UnpackedBootImageView = ({
  unpacked,
  onParamChange,
  onFileChange,
  dirtyFields,
}: {
  unpacked: BootImageContents;
  onParamChange: (key: string, value: string) => void;
  onFileChange: (partName: string, newFile: File) => void;
  dirtyFields?: Set<string>;
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const headerVersion = unpacked.params["BOARD_HEADER_VERSION"];

  return (
    <div className="unpacked-boot-image-view">
      <div className="card-row">
        <Card className="info-card">
          <div className="info-card-header">
            <H6>Image Header</H6>
            {headerVersion !== "2" && (
              <Callout intent="warning" title="Unsupported Header Version">
                <p>
                  The header version of this image is <b>{headerVersion}</b>. Only
                  version 2 is fully supported. Proceed with caution.
                </p>
              </Callout>
            )}
            <CompoundTag minimal leftContent="Version">{unpacked.params["BOARD_HEADER_VERSION"]}</CompoundTag>
          </div>

          <CompoundTag minimal leftContent="Size">{unpacked.params["BOARD_HEADER_SIZE"]} bytes</CompoundTag>
          <CompoundTag minimal leftContent="Hash Type">{unpacked.params["BOARD_HASH_TYPE"]}</CompoundTag>
        </Card>

        <Card className="info-card">
          <div className="info-card-header">
            <H6>Board Information</H6>
            <EditableCompoundTag
              label="Name"
              value={unpacked.params["BOARD_NAME"]}
              onConfirm={(val) => onParamChange("BOARD_NAME", val)}
              placeholder="N/A"
              intent={dirtyFields?.has("BOARD_NAME") ? "warning" : undefined}
            />
          </div>

          <EditableCompoundTag
            label="OS Version"
            value={unpacked.params["BOARD_OS_VERSION"]}
            onConfirm={(val) => onParamChange("BOARD_OS_VERSION", val)}
            intent={dirtyFields?.has("BOARD_OS_VERSION") ? "warning" : undefined}
          />
          <EditableCompoundTag
            label="OS Patch Level"
            value={unpacked.params["BOARD_OS_PATCH_LEVEL"]}
            onConfirm={(val) => onParamChange("BOARD_OS_PATCH_LEVEL", val)}
            intent={dirtyFields?.has("BOARD_OS_PATCH_LEVEL") ? "warning" : undefined}
          />
        </Card>

        <Card className="info-card">
          <H6>Memory Layout</H6>
          <EditableCompoundTag
            label="Base"
            value={unpacked.params["BOARD_KERNEL_BASE"]}
            onConfirm={(val) => onParamChange("BOARD_KERNEL_BASE", val)}
            placeholder="0x00000000"
            intent={dirtyFields?.has("BOARD_KERNEL_BASE") ? "warning" : undefined}
          />
          <SelectableCompoundTag
            label="Page Size"
            value={unpacked.params["BOARD_PAGE_SIZE"]}
            options={PAGE_SIZES}
            onChange={(val) => onParamChange("BOARD_PAGE_SIZE", val)}
            intent={dirtyFields?.has("BOARD_PAGE_SIZE") ? "warning" : undefined}
          >
          </SelectableCompoundTag>
          <div className="info-card-spacer" />
        </Card>
      </div>

      <div className="card-row">
        <BinaryPart
          name="kernel"
          file={unpacked.files["boot.img-kernel"]}
          offset={unpacked.params["BOARD_KERNEL_OFFSET"]}
          onFileChange={(_, newFile) => onFileChange("boot.img-kernel", newFile)}
          onOffsetChange={(val) => onParamChange("BOARD_KERNEL_OFFSET", val)}
          intent={dirtyFields?.has("boot.img-kernel") ? "warning" : undefined}
          offsetIntent={dirtyFields?.has("BOARD_KERNEL_OFFSET") ? "warning" : undefined}
        />
        <BinaryPart
          name="ramdisk"
          file={unpacked.files["boot.img-ramdisk"]}
          offset={unpacked.params["BOARD_RAMDISK_OFFSET"]}
          onFileChange={(_, newFile) => onFileChange("boot.img-ramdisk", newFile)}
          onOffsetChange={(val) => onParamChange("BOARD_RAMDISK_OFFSET", val)}
          intent={dirtyFields?.has("boot.img-ramdisk") ? "warning" : undefined}
          offsetIntent={dirtyFields?.has("BOARD_RAMDISK_OFFSET") ? "warning" : undefined}
        />
        <BinaryPart
          name="dtb"
          file={unpacked.files["boot.img-dtb"]}
          offset={unpacked.params["BOARD_DTB_OFFSET"]}
          onFileChange={(_, newFile) => onFileChange("boot.img-dtb", newFile)}
          onOffsetChange={(val) => onParamChange("BOARD_DTB_OFFSET", val)}
          intent={dirtyFields?.has("boot.img-dtb") ? "warning" : undefined}
          offsetIntent={dirtyFields?.has("BOARD_DTB_OFFSET") ? "warning" : undefined}
        />
      </div>

      <CmdlineCard
        cmdline={unpacked.params["BOARD_KERNEL_CMDLINE"]}
        onCmdlineChange={(val) => onParamChange("BOARD_KERNEL_CMDLINE", val)}
        intent={dirtyFields?.has("BOARD_KERNEL_CMDLINE") ? "warning" : undefined}
      />

      <div className="advanced-offsets-container">
        <Button
          size="small"
          variant="minimal"
          alignText="left"
          fill
          icon={isAdvancedOpen ? "caret-down" : "caret-right"}
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        >
          Advanced Offsets
        </Button>
        <Collapse isOpen={isAdvancedOpen}>
          <div className="card-row">
            <EditableCompoundTag
              label="Second Bootloader Offset"
              value={unpacked.params["BOARD_SECOND_OFFSET"]}
              onConfirm={(val) => onParamChange("BOARD_SECOND_OFFSET", val)}
              intent={dirtyFields?.has("BOARD_SECOND_OFFSET") ? "warning" : undefined}
            />
            <EditableCompoundTag
              label="Tags Offset"
              value={unpacked.params["BOARD_TAGS_OFFSET"]}
              onConfirm={(val) => onParamChange("BOARD_TAGS_OFFSET", val)}
              intent={dirtyFields?.has("BOARD_TAGS_OFFSET") ? "warning" : undefined}
            />
          </div>
        </Collapse>
      </div>
    </div>
  );
};

export const BootPartition = ({ name, params }: BootPartitionProps) => {
  const [localParams, setLocalParams] = useState(params);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  const handleParamChange = (
    slotIndex: number,
    key: string,
    value: string,
  ) => {
    setLocalParams((prevParams) => {
      const newParams = [...prevParams];
      const oldSlot = newParams[slotIndex].slot as BootSlot;
      if (oldSlot.unpacked) {
        const newDirtyFields = new Set(oldSlot.dirtyFields || []);
        newDirtyFields.add(key);

        const newUnpacked = {
          ...oldSlot.unpacked,
          params: {
            ...oldSlot.unpacked.params,
            [key]: value,
          },
        };

        const newSlot = {
          ...oldSlot,
          unpacked: newUnpacked,
          isDirty: true,
          dirtyFields: newDirtyFields,
        };

        newParams[slotIndex] = {
          ...newParams[slotIndex],
          slot: newSlot,
        };
      }
      return newParams;
    });
  };

  const handleFileChange = (
    slotIndex: number,
    partName: string,
    newFile: File,
  ) => {
    setLocalParams((prevParams) => {
      const newParams = [...prevParams];
      const oldSlot = newParams[slotIndex].slot as BootSlot;
      if (oldSlot.unpacked) {
        const newDirtyFields = new Set(oldSlot.dirtyFields || []);
        newDirtyFields.add(partName);

        const newUnpacked = {
          ...oldSlot.unpacked,
          files: {
            ...oldSlot.unpacked.files,
            [partName]: newFile,
          },
        };

        const newSlot = {
          ...oldSlot,
          unpacked: newUnpacked,
          isDirty: true,
          dirtyFields: newDirtyFields,
        };

        newParams[slotIndex] = {
          ...newParams[slotIndex],
          slot: newSlot,
        };
      }
      return newParams;
    });
  };

  useEffect(() => {
    const unpackImage = async (param: BootPartitionParams, index: number) => {
      const slot = param.slot as BootSlot;
      const tags = (
        <Fragment>
          <CompoundTag leftContent="Size">
            {prettyBytes(param.slot.size)}
          </CompoundTag>
          <CompoundTag leftContent="Type">{param.slot.type}</CompoundTag>
        </Fragment>
      );

      if (slot.image.length > 0 && !slot.unpacked) {
        const file = slot.image[0];
        const fileData = await file.arrayBuffer();

        const result = await runEmscripten(
          unpackbootimg,
          [{ path: "/boot.img", data: fileData }],
          ["-i", "/boot.img"],
          ["boot.img-kernel", "boot.img-ramdisk", "boot.img-dtb"],
        );

        const parsedParams: Record<string, string> = {};
        result.stdout.forEach((line) => {
          if (!line.startsWith("BOARD_")) return;
          const [firstPart, restOfString] = line.split(/ (.*)/s);
          parsedParams[firstPart] = restOfString || "";
        });

        const newUnpacked: BootImageContents = {
          params: parsedParams,
          files: result.files,
        };

        setLocalParams((prevParams) => {
          const newParams = [...prevParams];
          (newParams[index].slot as BootSlot).unpacked = newUnpacked;
          return newParams;
        });
      }
    };

    localParams.forEach(unpackImage);
  }, [localParams]);

  const slots = localParams.map((param, index) => {
    const slot = param.slot as BootSlot;
    const bestImage = slot.image.length > 0 ? slot.image[0] : null;
    const title =
      param.suffix.length > 0 ? <H5>{param.suffix.toUpperCase()}</H5> : <></>;
    const tags = (
      <Fragment>
        <CompoundTag leftContent="Size">
          {prettyBytes(param.slot.size)}
        </CompoundTag>
        <CompoundTag leftContent="Type">{param.slot.type}</CompoundTag>
        <ButtonGroup>
          <Button disabled minimal intent="primary" icon="import"></Button>
          <Button disabled minimal icon="export"></Button>
          <Button disabled minimal intent="danger" icon="eraser"></Button>
        </ButtonGroup>
        {bestImage && (
          <Fragment>
            <CompoundTag
              intent="primary"
              icon="import"
              content="img"
              leftContent="img"
              style={{ width: "fit-content", minWidth: "5em" }}
            >
              {bestImage.name}
            </CompoundTag>
            <CompoundTag
              intent={slot.isDirty ? "warning" : "success"}
              icon={slot.isDirty ? "wrench" : "shield"}
              leftContent={"content"}
            >
              {slot.isDirty
                ? "repacked"
                : "original"}
            </CompoundTag>
          </Fragment>
        )}

      </Fragment>
    );

    return (
      <Callout key={param.suffix} compact>
        <EntityTitle title={title} tags={tags} />
        <div style={{ marginTop: "10px" }}>

          {slot.unpacked ? (
            <Fragment>
              <UnpackedBootImageView
                unpacked={slot.unpacked}
                onParamChange={(key, value) =>
                  handleParamChange(index, key, value)
                }
                onFileChange={(partName, newFile) =>
                  handleFileChange(index, partName, newFile)
                }
                dirtyFields={slot.dirtyFields}
              />
            </Fragment>
          ) : (
            <p>{bestImage ? `Unpacking...` : null}</p>
          )}
          {slot.flashProgress !== undefined && (
            <ProgressBar value={slot.flashProgress} />
          )}
        </div>
      </Callout>
    );
  });

  return (
    <Card className="partitions" compact key={name}>
      <H5 className="partition-title">{name}</H5>
      <div className="slots">{slots}</div>
    </Card>
  );
};