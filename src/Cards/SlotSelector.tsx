import {
  Button,
  CompoundTag,
  Divider,
  Intent,
  MenuItem,
} from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";
import { FC, useState } from "react";
import { setSlot } from "../utils/FastBoot";

export interface Slot {
  name: string;
  isSuccessful: boolean | undefined;
  isUnbootable: boolean | undefined;
  retryCount: number | undefined;
}

export interface SlotSelectProps {
  disabled: boolean;
  demo: boolean;
  envVars: Record<string, any>;
  setSlotInfo: CallableFunction;
}

export const SlotSelect: FC<SlotSelectProps> = ({
  disabled,
  demo,
  envVars,
  setSlotInfo,
}) => {
  const slots: Slot[] = envVars["slot-retry-count"]
    ? Object.keys(envVars["slot-retry-count"]).map((key: string) => {
        const slot: Slot = {
          name: key,
          isSuccessful: envVars["slot-successful"]?.[key],
          isUnbootable: envVars["slot-unbootable"]?.[key],
          retryCount: Number(envVars["slot-retry-count"]?.[key]),
        };
        return slot;
      })
    : [];

  const selectedSlot: Slot | undefined = slots.filter((slot) => {
    return slot.name == envVars["current-slot"];
  })[0];

  const unbootableIntent = (val: boolean | undefined) => {
    if (val === true) {
      return Intent.DANGER;
    }

    if (val === false) {
      return Intent.SUCCESS;
    }

    return Intent.NONE;
  };

  const successfulIntent = (val: boolean | undefined) => {
    if (val === true) {
      return Intent.SUCCESS;
    }

    if (val === false) {
      return Intent.WARNING;
    }

    return Intent.NONE;
  };

  const getSlotIntent = (
    unbootable: boolean | undefined,
    successful: boolean | undefined,
  ) => {
    if (successful === true && unbootable === false) {
      return Intent.SUCCESS;
    }

    if (successful === false && unbootable === false) {
      return Intent.WARNING;
    }

    if (unbootable === true) {
      return Intent.DANGER;
    }

    return Intent.NONE;
  };

  const renderSlot: ItemRenderer<Slot> = (
    slot,
    { handleClick, handleFocus, modifiers, query },
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }

    const slotIntent = getSlotIntent(slot.isUnbootable, slot.isSuccessful);
    return (
      <MenuItem
        active={modifiers.active}
        selected={slot.name === selectedSlot.name}
        disabled={modifiers.disabled}
        intent={slotIntent}
        key={slot.name}
        labelElement={
          <div style={{ display: "flex", flexDirection: "row", gap: "0.5em" }}>
            <CompoundTag
              intent={unbootableIntent(slot.isUnbootable)}
              leftContent="unbootable"
            >
              {`${slot.isUnbootable}`}
            </CompoundTag>
            <CompoundTag
              intent={successfulIntent(slot.isSuccessful)}
              leftContent="successfull"
            >
              {`${slot.isSuccessful}`}
            </CompoundTag>
            <CompoundTag leftContent="retry-count">
              {`${slot.retryCount}`}
            </CompoundTag>
          </div>
        }
        onClick={handleClick}
        onFocus={handleFocus}
        roleStructure="listoption"
        text={slot.name.toLocaleUpperCase()}
      />
    );
  };

  return (
    <Select<Slot>
      filterable={false}
      disabled={disabled || !slots.length}
      items={slots}
      itemRenderer={renderSlot}
      noResults={
        <MenuItem disabled={true} text="No Slots" roleStructure="listoption" />
      }
      onItemSelect={async (slot) => {
        if (!demo) {
          const newSlot = await setSlot(slot.name);
          setSlotInfo(newSlot);
        } else {
          setSlotInfo(slot.name);
        }
      }}
    >
      <Button
        minimal
        disabled={disabled || slots.length === 0}
        intent={
          slots.length > 0 && !selectedSlot
            ? Intent.WARNING
            : getSlotIntent(
                selectedSlot?.isUnbootable,
                selectedSlot?.isSuccessful,
              )
        }
        text={selectedSlot?.name.toUpperCase() ?? ""}
        rightIcon="caret-down"
      />
    </Select>
  );
};
