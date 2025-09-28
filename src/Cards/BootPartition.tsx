
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
} from "@blueprintjs/core";
import { Fragment, useEffect, useState } from "react";

import { FileWithPath } from "react-dropzone";
import { Slot } from "../utils/Partition";
import unpackbootimg from "../UnpackBootImg";
import { runEmscripten } from "../utils/Emscripten";

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
  { value: 2048, label: "2K" },
  { value: 4096, label: "4K" },
  { value: 8192, label: "8K" },
  { value: 16384, label: "16K" },
  { value: 32768, label: "32K" },
  { value: 65536, label: "64K" },
  { value: 131072, label: "128K" },
];

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
    <Card style={{ marginTop: "10px" }}>
      <H5>{name.charAt(0).toUpperCase() + name.slice(1)}</H5>
      <FormGroup label="Offset" inline>
        <EditableText value={offset} disabled />
      </FormGroup>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <FileInput
          text={file ? file.name : `Drop or select ${name}...`}
          onInputChange={handleFileChange}
          fill
        />
        <Button icon="download" onClick={downloadFile} disabled={!file} />
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
    <Card style={{ marginTop: "10px" }}>
      <H5>Command Line</H5>
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
    <Fragment>
      <Card>
        <H5>Image Header</H5>
        {headerVersion !== "2" && (
          <Callout intent="warning" title="Unsupported Header Version">
            <p>
              The header version of this image is <b>{headerVersion}</b>. Only
              version 2 is fully supported. Proceed with caution.
            </p>
          </Callout>
        )}
        <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
          <FormGroup label="Header Version">
            <Tag large>{unpacked.params["BOARD_HEADER_VERSION"]}</Tag>
          </FormGroup>
          <FormGroup label="Header Size">
            <Tag large>{unpacked.params["BOARD_HEADER_SIZE"]} bytes</Tag>
          </FormGroup>
          <FormGroup label="Hash Type">
            <Tag large>{unpacked.params["BOARD_HASH_TYPE"]}</Tag>
          </FormGroup>
        </div>
      </Card>

      <Card style={{ marginTop: "10px" }}>
        <H5>Board Information</H5>
        <FormGroup label="Board Name" inline>
          <EditableText
            value={unpacked.params["BOARD_NAME"]}
            onConfirm={(val) => onParamChange("BOARD_NAME", val)}
            onChange={(val) => onParamChange("BOARD_NAME", val)}
            placeholder="N/A"
          />
        </FormGroup>
        <FormGroup label="OS Version" inline>
          <EditableText
            value={unpacked.params["BOARD_OS_VERSION"]}
            onConfirm={(val) => onParamChange("BOARD_OS_VERSION", val)}
            onChange={(val) => onParamChange("BOARD_OS_VERSION", val)}
          />
        </FormGroup>
        <FormGroup label="OS Patch Level" inline>
          <EditableText
            value={unpacked.params["BOARD_OS_PATCH_LEVEL"]}
            onConfirm={(val) => onParamChange("BOARD_OS_PATCH_LEVEL", val)}
            onChange={(val) => onParamChange("BOARD_OS_PATCH_LEVEL", val)}
          />
        </FormGroup>
      </Card>

      <Card style={{ marginTop: "10px" }}>
        <H5>Memory Layout</H5>
        <FormGroup label="Kernel Base Address" inline>
          <EditableText value={unpacked.params["BOARD_KERNEL_BASE"]} disabled />
        </FormGroup>
        <FormGroup label="Page Size" inline>
          <HTMLSelect
            value={unpacked.params["BOARD_PAGE_SIZE"]}
            onChange={(e) =>
              onParamChange("BOARD_PAGE_SIZE", e.currentTarget.value)
            }
            options={PAGE_SIZES}
          />
        </FormGroup>
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

      <div style={{ marginTop: "10px" }}>
        <Button
          alignText="left"
          fill
          icon={isAdvancedOpen ? "caret-down" : "caret-right"}
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        >
          Advanced Offsets
        </Button>
        <Collapse isOpen={isAdvancedOpen}>
          <Card>
            <FormGroup label="Second Bootloader Offset" inline>
              <EditableText
                value={unpacked.params["BOARD_SECOND_OFFSET"]}
                disabled
              />
            </FormGroup>
            <FormGroup label="Tags Offset" inline>
              <EditableText
                value={unpacked.params["BOARD_TAGS_OFFSET"]}
                disabled
              />
            </FormGroup>
          </Card>
        </Collapse>
      </div>
    </Fragment>
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
      param.suffix.length > 0 ? <H5>{param.suffix.toUpperCase()}</H5> : null;

    return (
      <Callout key={param.suffix} compact>
        {title}
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
