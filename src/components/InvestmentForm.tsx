import { X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface InvestmentFormProps {
  currentMonth: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvestmentForm({
  currentMonth,
  onClose,
  onSuccess,
}: InvestmentFormProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("investments").insert({
      user_id: user.id,
      start_month: currentMonth,
      description,
      amount: parseFloat(amount),
      is_active: true,
    });

    setLoading(false);

    if (!error) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed w-full inset-0 bg-black/40 flex items-end backdrop-blur-md sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full   shadow-xl">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-3xl font-semibold text-slate-900">
            Add Investment
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
              Description
            </label>
            <input
              id="description"
              type="text"
              autoFocus={true}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="e.g., SIP, Fixed Deposit, Stocks"
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
              {loading ? "Adding..." : "Add Investment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
