"use client";

import AmountInput from "@/features/dashboard/components/AmountInput";
import Modal from "@/features/shared/ui/Modal";
import { Field } from "@/features/shared/ui/Field";
import Button, { ButtonRow } from "@/features/shared/ui/Button";

interface StartingBalanceModalProps {
  isOpen: boolean;
  monthLabel: string;
  startingBalanceInput: string;
  startingBalanceError: string;
  updatingStartingBalance: boolean;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function StartingBalanceModal({
  isOpen,
  monthLabel,
  startingBalanceInput,
  startingBalanceError,
  updatingStartingBalance,
  onClose,
  onInputChange,
  onSubmit,
}: StartingBalanceModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      title="Edit starting balance"
      subtitle={monthLabel}
      onClose={onClose}
      closeLabel="Close starting balance editor"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field id="starting-balance" label="Starting balance">
          <AmountInput
            id="starting-balance"
            autoFocus
            value={startingBalanceInput}
            onChange={onInputChange}
          />
        </Field>

        {startingBalanceError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {startingBalanceError}
          </p>
        )}

        <ButtonRow>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updatingStartingBalance}>
            {updatingStartingBalance ? "Saving…" : "Save changes"}
          </Button>
        </ButtonRow>
      </form>
    </Modal>
  );
}
