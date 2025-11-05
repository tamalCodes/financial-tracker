import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface CreditFormProps {
  currentMonth: string;
  onClose: () => void;
  onSuccess: () => void;
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
  const { user } = useAuth();
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
    if (!user) return;

    setError("");
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount)) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    let submitError = null;

    if (credit) {
      const { error: updateError } = await supabase
        .from("credits")
        .update({
          description,
          amount: parsedAmount,
          carry_forward: carryForward,
        })
        .eq("id", credit.id)
        .eq("user_id", user.id);
      submitError = updateError;
    } else {
      const { error: insertError } = await supabase.from("credits").insert({
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
      setError(submitError.message ?? "Unable to save credit.");
    }
  };

  const isEditing = Boolean(credit);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {isEditing ? "Edit Credit" : "Add Credit"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="credit-description"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Title
            </label>
            <input
              id="credit-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="e.g., Salary, Bonus, Refund"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-base"
            />
          </div>

          <div>
            <label
              htmlFor="credit-amount"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Amount
            </label>
            <input
              id="credit-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-base"
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              id="credit-carry-forward"
              type="checkbox"
              checked={carryForward}
              onChange={(e) => setCarryForward(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label
              htmlFor="credit-carry-forward"
              className="text-sm text-slate-600"
            >
              Carry this credit forward to future months automatically.
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
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
                : "Add Credit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
