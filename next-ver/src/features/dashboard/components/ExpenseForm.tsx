"use client";

import { Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { Expense, MonthlyBalance } from "@/features/dashboard/types/types";
import AmountInput from "@/features/dashboard/components/AmountInput";
import TagInput from "@/features/dashboard/components/TagInput";
import { evaluateExpression } from "@/features/dashboard/utils/expression";
import Modal from "@/features/shared/ui/Modal";
import { Field, TextField } from "@/features/shared/ui/Field";
import Button, { ButtonRow } from "@/features/shared/ui/Button";
import ToggleCard from "@/features/shared/ui/ToggleCard";

interface ExpenseFormProps {
  currentMonth: string;
  onClose: () => void;
  onSuccess: (payload: { item: Expense; balance: MonthlyBalance | null }) => void;
  expense?: {
    id: string;
    description: string;
    amount: number;
    carry_forward?: boolean;
    tags?: string[];
  };
}

export default function ExpenseForm({
  currentMonth,
  onClose,
  onSuccess,
  expense,
}: ExpenseFormProps) {
  const [description, setDescription] = useState(
    expense ? expense.description : ""
  );
  const [amount, setAmount] = useState(
    expense ? expense.amount.toString() : ""
  );
  const [tags, setTags] = useState<string[]>(expense?.tags ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [carryForward, setCarryForward] = useState(
    expense?.carry_forward ?? false
  );

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setTags(expense.tags ?? []);
      setCarryForward(expense.carry_forward ?? false);
    } else {
      setDescription("");
      setAmount("");
      setTags([]);
      setCarryForward(false);
    }
    setError("");
  }, [expense]);

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
      tags,
    };

    const res = await fetch("/api/expenses", {
      method: expense ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense ? { ...payload, id: expense.id } : payload),
    });

    setLoading(false);

    const data = await res.json();
    if (res.ok) {
      onSuccess(data);
      onClose();
      return;
    }
    setError(data.error ?? "Unable to save expense.");
  };

  const isEditing = Boolean(expense);

  return (
    <Modal
      title={isEditing ? "Edit expense" : "Add expense"}
      subtitle="Record what you spent this month."
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

        <Field id="description" label="Title">
          <TextField
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="e.g. Groceries, Fuel, Rent"
          />
        </Field>

        <Field id="tags" label="Tags" hint="(optional)">
          <TagInput id="tags" value={tags} onChange={setTags} />
        </Field>

        <ToggleCard
          icon={Repeat}
          title="Repeat every month"
          description="Carry this expense forward automatically."
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
              : "Add expense"}
          </Button>
        </ButtonRow>
      </form>
    </Modal>
  );
}
