"use client";

import { Repeat } from "lucide-react";
import { useState } from "react";
import { Investment, MonthlyBalance } from "@/features/dashboard/types/types";
import AmountInput from "@/features/dashboard/components/AmountInput";
import { evaluateExpression } from "@/features/dashboard/utils/expression";
import Modal from "@/features/shared/ui/Modal";
import { Field, TextField } from "@/features/shared/ui/Field";
import Button, { ButtonRow } from "@/features/shared/ui/Button";
import ToggleCard from "@/features/shared/ui/ToggleCard";

interface InvestmentFormProps {
  currentMonth: string;
  onClose: () => void;
  onSuccess: (payload: {
    item: Investment;
    balance: MonthlyBalance | null;
  }) => void;
}

export default function InvestmentForm({
  currentMonth,
  onClose,
  onSuccess,
}: InvestmentFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [carryForward, setCarryForward] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const parsedAmount = evaluateExpression(amount);
    if (parsedAmount === null) {
      setLoading(false);
      setError("Please enter a valid amount.");
      return;
    }

    const payload = {
      currentMonth,
      description,
      amount: parsedAmount,
      carry_forward: carryForward,
    };

    const res = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Unable to save investment.");
      return;
    }

    onSuccess(data);
    onClose();
  };

  return (
    <Modal
      title="Add investment"
      subtitle="Track money you put to work this month."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field id="amount" label="Amount">
          <AmountInput
            id="amount"
            autoFocus
            value={amount}
            onChange={setAmount}
          />
        </Field>

        <Field id="description" label="Description">
          <TextField
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="e.g. SIP, Fixed Deposit, Stocks"
          />
        </Field>

        <ToggleCard
          icon={Repeat}
          title="Repeat every month"
          description="Carry this payment forward automatically."
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
            {loading ? "Adding…" : "Add investment"}
          </Button>
        </ButtonRow>
      </form>
    </Modal>
  );
}
