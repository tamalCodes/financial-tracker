import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface ExpenseFormProps {
  currentMonth: string;
  onClose: () => void;
  onSuccess: () => void;
  expense?: {
    id: string;
    description: string;
    amount: number;
    carry_forward?: boolean;
  };
}

export default function ExpenseForm({
  currentMonth,
  onClose,
  onSuccess,
  expense,
}: ExpenseFormProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState(
    expense ? expense.description : ""
  );
  const [amount, setAmount] = useState(
    expense ? expense.amount.toString() : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [carryForward, setCarryForward] = useState(
    expense?.carry_forward ?? false
  );

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setCarryForward(expense.carry_forward ?? false);
    } else {
      setDescription("");
      setAmount("");
      setCarryForward(false);
    }
    setError("");
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount)) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    let submitError = null;

    if (expense) {
      const { error: updateError } = await supabase
        .from("expenses")
        .update({
          description,
          amount: parsedAmount,
          carry_forward: carryForward,
        })
        .eq("id", expense.id)
        .eq("user_id", user.id);
      submitError = updateError;
    } else {
      const { error: insertError } = await supabase.from("expenses").insert({
        user_id: user.id,
        month: currentMonth,
        description,
        amount: parsedAmount,
        carry_forward: carryForward,
      });
      submitError = insertError;
    }

    setLoading(false);

    if (!submitError) {
      onSuccess();
      onClose();
    } else {
      setError(submitError.message ?? "Unable to save expense.");
    }
  };

  const isEditing = Boolean(expense);

  return (
    <div className="fixed w-full inset-0 bg-black/40 flex items-end backdrop-blur-md sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full   shadow-xl">
        <div className="flex items-center justify-between p-6 ">
          <h2 className="text-3xl font-semibold text-slate-900">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 h-full flex flex-col gap-10"
        >
          <div>
            <label
              htmlFor="description"
              className="block text-xl font-sans font-medium text-slate-700 mb-2"
            >
              Title
            </label>
            <input
              id="description"
              type="text"
              autoFocus={true}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="e.g., Groceries, Fuel, Rent"
              className="w-full text-xl font-sans px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none ring-0"
            />
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-xl font-sans font-medium text-slate-700 mb-2"
            >
              Amount
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full text-xl font-sans px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none ring-0"
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              id="carry-forward"
              type="checkbox"
              checked={carryForward}
              onChange={(e) => setCarryForward(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="carry-forward" className="text-md text-slate-600">
              Carry this payment forward to future months automatically.
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex  items-end gap-3 pt-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 text-base"
            >
              {loading
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                ? "Save Changes"
                : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
