type Props = {
  value: "month" | "list";
  onChange: (v: "month" | "list") => void;
};

export default function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-xl border p-1 shadow-sm">
      <button
        className={`rounded-lg px-3 py-1 text-sm ${
          value === "month" ? "bg-black text-white" : "text-gray-700"
        }`}
        onClick={() => onChange("month")}
      >
        Month
      </button>
      <button
        className={`rounded-lg px-3 py-1 text-sm ${
          value === "list" ? "bg-black text-white" : "text-gray-700"
        }`}
        onClick={() => onChange("list")}
      >
        List
      </button>
    </div>
  );
}


