import {
  Button,
  ButtonGroup,
  Callout,
  Card,
  CompoundTag,
  EntityTitle,
  H5,
  Intent,
  ProgressBar,
  Tag,
} from "@blueprintjs/core";
import { FC, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { prettyBytes } from "../utils/Common";

import "./Partition.css";
import { FileWithPath } from "react-dropzone/.";
import { Slot } from "../utils/Partition";

interface PartitionProps {
  name: string;
  params: {
    suffix: string;
    slot: Slot;
  }[];
}

export const Partition: FC<PartitionProps> = ({ name, params }) => {
  const [flashingInProgress, setFlashingInProgress] = useState(false);

  const isAB = params.length > 1;

  const slots = params.map((param) => {
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

    const bestImage = param.slot.image.length > 0 ? param.slot.image[0] : null;
    const progress = param.slot.flashProgress;

    return (
      <Callout key={param.suffix} compact>
        <div style={{ display: "flex", gap: "1em" }}>
          <EntityTitle title={title} tags={tags} />
          <ButtonGroup>
            <Button disabled minimal intent="primary" icon="import"></Button>
            <Button disabled minimal icon="export"></Button>
            <Button disabled minimal intent="danger" icon="eraser"></Button>
          </ButtonGroup>
          {bestImage ? (
            <CompoundTag
              intent="warning"
              icon="import"
              content="img"
              leftContent="img"
              style={{ width: "fit-content", minWidth: "5em" }}
            >
              {bestImage.name}
            </CompoundTag>
          ) : (
            ""
          )}
        </div>
        {progress ? (
          <ProgressBar
            // TODO: Due to full rerender on whole page animations looks bad
            // animate={progress < 1}
            animate={false}
            value={progress}
            intent={progress < 1 ? Intent.PRIMARY : Intent.SUCCESS}
            stripes={progress < 1}
          ></ProgressBar>
        ) : (
          <></>
        )}
      </Callout>
    );
  });

  return (
    <Card className="partition" compact key={name}>
      <EntityTitle title={<H5>{name}</H5>} />
      <div className="slots">{slots}</div>
    </Card>
  );
};
