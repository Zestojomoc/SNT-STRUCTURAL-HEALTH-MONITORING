export function ChannelSelector({
  channels,
  selected,
  onChange,
  disabled,
}: {
  channels: string[];
  selected: string;
  onChange: (channel: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="grid min-h-11 w-full grid-flow-col rounded-xl border border-white/[0.08] bg-black/20 p-1 sm:w-auto"
      role="radiogroup"
      aria-label="Acceleration channel"
    >
      {channels.map((channel) => (
        <button
          key={channel}
          type="button"
          role="radio"
          aria-checked={selected === channel}
          disabled={disabled}
          onClick={() => onChange(channel)}
          className={`min-h-11 min-w-[62px] rounded-lg px-3 text-xs font-semibold tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${
            selected === channel
              ? "bg-sky-400/15 text-sky-200 shadow-sm ring-1 ring-sky-400/25"
              : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
          }`}
        >
          {channel}
        </button>
      ))}
    </div>
  );
}
