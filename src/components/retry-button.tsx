type RetryButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

export function RetryButton({
  onClick,
  label = "Retry",
  className = ""
}: RetryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-200 ${className}`}
    >
      {label}
    </button>
  );
}
