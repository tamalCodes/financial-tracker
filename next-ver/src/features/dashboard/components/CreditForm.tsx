"use client";

import { Credit, MonthlyBalance } from "@/features/dashboard/types/types";
import { Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import AmountInput from "@/features/dashboard/components/AmountInput";
import { evaluateExpression } from "@/features/dashboard/utils/expression";
import Modal from "@/features/shared/ui/Modal";
import { Field, TextField } from "@/features/shared/ui/Field";
import Button, { ButtonRow } from "@/features/shared/ui/Button";
import ToggleCard from "@/features/shared/ui/ToggleCard";

interface CreditFormProps {
  currentMonth: string;
  onClose: () => void;
  onSuccess: (payload: {
    item: Credit;
    balance: MonthlyBalance | null;
  }) => void;
  credit?: {
    id: string;
    description: string;
    amount: number;
    carry_forward?: boolean;
  };
}

export default function CreditForm({
  currentMonth,
  onClose,
  onSuccess,
  credit,
}: CreditFormProps) {
  const [description, setDescription] = useState(
    credit ? credit.description : ""
  );
  const [amount, setAmount] = useState(credit ? credit.amount.toString() : "");
  const [carryForward, setCarryForward] = useState(
    credit?.carry_forward ?? false
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (credit) {
      setDescription(credit.description);
      setAmount(credit.amount.toString());
      setCarryForward(credit.carry_forward ?? false);
    } else {
      setDescription("");
      setAmount("");
      setCarryForward(false);
    }
    setError("");
  }, [credit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsedAmount = evaluateExpression(amount);
    if (parsedAmount === null) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    const payload = {
      currentMonth,
      description,
      amount: parsedAmount,
      carry_forward: carryForward,
    };

    const res = await fetch("/api/credits", {
      method: credit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credit ? { ...payload, id: credit.id } : payload),
    });

    setLoading(false);

    const data = await res.json();
    if (res.ok) {
      onSuccess(data);
      onClose();
      return;
    }
    setError(data.error ?? "Unable to save credit.");
  };

  const isEditing = Boolean(credit);

  return (
    <Modal
      title={isEditing ? "Edit credit" : "Add credit"}
      subtitle="Record money coming in this month."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field id="credit-amount" label="Amount">
          <AmountInput
            id="credit-amount"
            autoFocus
            value={amount}
            onChange={setAmount}
          />
        </Field>

        <Field id="credit-description" label="Title">
          <TextField
            id="credit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="e.g. Salary, Bonus, Refund"
          />
        </Field>

        <ToggleCard
          icon={Repeat}
          title="Repeat every month"
          description="Carry this credit forward automatically."
          checked={carryForward}
          onChange={setCarryForward}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <ButtonRow>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? isEditing
                ? "Saving…"
                : "Adding…"
              : isEditing
              ? "Save changes"
              : "Add credit"}
          </Button>
        </ButtonRow>
      </form>
    </Modal>
  );
}
