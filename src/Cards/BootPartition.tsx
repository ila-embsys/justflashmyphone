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
} from "@blueprintjs/core";
import { Fragment, useEffect, useState } from "react";

import { FileWithPath } from "react-dropzone";
import { Slot } from "../utils/Partition";
import unpackbootimg from "../UnpackBootImg";
import { runEmscripten } from "../utils/Emscripten";
import { prettyBytes } from "../utils/Common";

export interface BootImageContents {
  params: Record<string, string>;
  files: Record<string, File>;
}

export interface BootSlot extends Slot {
  image: FileWithPath[];
  unpacked?: BootImageContents;
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
}: {
  label: string;
  value: string;
  onConfirm: (value: string) => void;
  placeholder?: string;
}) => {
  return (
    <CompoundTag minimal leftContent={label}>
      <EditableText
        value={value}
        onConfirm={onConfirm}
        placeholder={placeholder}
      />
    </CompoundTag>
  );
};

const SelectableCompoundTag = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) => {
  return (
    <CompoundTag minimal leftContent={label}>
      <HTMLSelect
        minimal
        style={{ height: "unset", fontSize: "12px" }}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        options={options}
        iconProps={{ style: { top: "0px" } }}
      />
    </CompoundTag>
  );
}

const BinaryPart = ({
  name,
  file,
  offset,
  onFileChange,
}: {
  name: string;
  file: File | undefined;
  offset: string;
  onFileChange: (partName: string, newFile: File) => void;
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (newFile) {
      const renamedFile = new File([newFile], name, { type: newFile.type });
      onFileChange(name, renamedFile);
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
    <Card style={{ display: "flex", gap: "10px", padding: "10px" }}>
      <H6>{name.charAt(0).toUpperCase() + name.slice(1)}</H6>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <EditableCompoundTag
          label="Offset"
          value={offset}
          onConfirm={(val) => { /* TODO: Implement offset change logic */ }}
        />
        <FileInput
          size="small"
          text={file ? file.name : `Drop or select ${name}...`}
          onInputChange={handleFileChange}
        />
        <Button size="small" icon="download" onClick={downloadFile} disabled={!file} />
      </div>
    </Card>
  );
};

const CmdlineCard = ({
  cmdline,
  onCmdlineChange,
}: {
  cmdline: string;
  onCmdlineChange: (value: string) => void;
}) => {
  return (
    <Card style={{ marginTop: "10px", gap: "10px", padding: "10px" }}>
      <H5>Command Line</H5>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <p>
          <Icon icon="info-sign" /> Editing the command line will be available in a
          future update.
        </p>
        <EditableText
          value={cmdline}
          onConfirm={onCmdlineChange}
          onChange={onCmdlineChange}
          multiline
          minLines={3}
          maxLines={10}
          disabled // To be enabled later
        />
      </div>
    </Card>
  );
};

const UnpackedBootImageView = ({
  unpacked,
  onParamChange,
  onFileChange,
}: {
  unpacked: BootImageContents;
  onParamChange: (key: string, value: string) => void;
  onFileChange: (partName: string, newFile: File) => void;
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const headerVersion = unpacked.params["BOARD_HEADER_VERSION"];

  return (
    <CardList bordered={false} compact>
      <Card style={{ display: "flex", gap: "10px", padding: "10px" }}>
        <H6>Image Header</H6>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {headerVersion !== "2" && (
            <Callout intent="warning" title="Unsupported Header Version">
              <p>
                The header version of this image is <b>{headerVersion}</b>. Only
                version 2 is fully supported. Proceed with caution.
              </p>
            </Callout>
          )}
          <Tag minimal>Version: {unpacked.params["BOARD_HEADER_VERSION"]}</Tag>
          <Tag minimal>Size: {unpacked.params["BOARD_HEADER_SIZE"]} bytes</Tag>
          <Tag minimal>Hash Type: {unpacked.params["BOARD_HASH_TYPE"]}</Tag>
        </div>
      </Card>

      <Card style={{ display: "flex", gap: "10px", padding: "10px" }}>
        <H6>Board Information</H6>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <EditableCompoundTag
            label="Name"
            value={unpacked.params["BOARD_NAME"]}
            onConfirm={(val) => onParamChange("BOARD_NAME", val)}
            placeholder="N/A"
          />
          <EditableCompoundTag
            label="OS Version"
            value={unpacked.params["BOARD_OS_VERSION"]}
            onConfirm={(val) => onParamChange("BOARD_OS_VERSION", val)}
          />
          <EditableCompoundTag
            label="OS Patch Level"
            value={unpacked.params["BOARD_OS_PATCH_LEVEL"]}
            onConfirm={(val) => onParamChange("BOARD_OS_PATCH_LEVEL", val)}
          />
        </div>
      </Card>

      <Card style={{ display: "flex", gap: "10px", padding: "10px" }}>
        <H6>Memory Layout</H6>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <EditableCompoundTag
            label="Base"
            value={unpacked.params["BOARD_KERNEL_BASE"]}
            onConfirm={(val) => onParamChange("BOARD_KERNEL_BASE", val)}
            placeholder="0x00000000"
          />
          <SelectableCompoundTag
            label="Page Size"
            value={unpacked.params["BOARD_PAGE_SIZE"]}
            options={PAGE_SIZES}
            onChange={(val) => onParamChange("BOARD_PAGE_SIZE", val)}
          >
          </SelectableCompoundTag>
        </div>
      </Card>

      <BinaryPart
        name="kernel"
        file={unpacked.files["kernel"]}
        offset={unpacked.params["BOARD_KERNEL_OFFSET"]}
        onFileChange={onFileChange}
      />
      <BinaryPart
        name="ramdisk"
        file={unpacked.files["ramdisk"]}
        offset={unpacked.params["BOARD_RAMDISK_OFFSET"]}
        onFileChange={onFileChange}
      />
      <BinaryPart
        name="dtb"
        file={unpacked.files["dtb"]}
        offset={unpacked.params["BOARD_DTB_OFFSET"]}
        onFileChange={onFileChange}
      />

      <CmdlineCard
        cmdline={unpacked.params["BOARD_KERNEL_CMDLINE"]}
        onCmdlineChange={(val) => onParamChange("BOARD_KERNEL_CMDLINE", val)}
      />

      <div style={{ margin: "10px" }}>
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
          <div style={{ display: "flex", gap: "10px", padding: "10px" }}>
            <EditableCompoundTag
              label="Second Bootloader Offset"
              value={unpacked.params["BOARD_SECOND_OFFSET"]}
              onConfirm={(val) => onParamChange("BOARD_SECOND_OFFSET", val)}
            />
            <EditableCompoundTag
              label="Tags Offset"
              value={unpacked.params["BOARD_TAGS_OFFSET"]}
              onConfirm={(val) => onParamChange("BOARD_TAGS_OFFSET", val)}
            />
          </div>
        </Collapse>
      </div>
    </CardList >
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
      const unpacked = (newParams[slotIndex].slot as BootSlot).unpacked;
      if (unpacked) {
        unpacked.params[key] = value;
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
      const unpacked = (newParams[slotIndex].slot as BootSlot).unpacked;
      if (unpacked) {
        unpacked.files[partName] = newFile;
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
          [{ path: "/input.img", data: fileData }],
          ["-i", "/input.img"],
          ["kernel", "ramdisk", "dtb"],
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
    const title =
      param.suffix.length > 0 ? <H5>{param.suffix.toUpperCase()}</H5> : <></>;
    const tags = (
      <Fragment>
        <CompoundTag leftContent="Size">
          {prettyBytes(param.slot.size)}
        </CompoundTag>
        <CompoundTag leftContent="Type">{param.slot.type}</CompoundTag>
      </Fragment>
    );

    return (
      <Callout key={param.suffix} compact>
        <EntityTitle title={title} tags={tags} />
        <div style={{ marginTop: "10px" }}>
          {slot.flashProgress !== undefined && (
            <ProgressBar value={slot.flashProgress} />
          )}
          {slot.unpacked ? (
            <UnpackedBootImageView
              unpacked={slot.unpacked}
              onParamChange={(key, value) => handleParamChange(index, key, value)}
              onFileChange={(partName, newFile) =>
                handleFileChange(index, partName, newFile)
              }
            />
          ) : (
            <p>
              {slot.image.length > 0
                ? `Image selected: ${slot.image[0].name}. Unpacking...`
                : "Drop a boot.img file here to see its contents."}
            </p>
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