import Lottie from "react-lottie-player";
import type { ReactNode } from "react";

type EmptyStateProps = {
  lottieUrl: string;
  message: string | ReactNode;
  action?: ReactNode;
};

export function EmptyState({ lottieUrl, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <Lottie
        play
        loop
        path={lottieUrl}
        style={{ height: 80, width: 80 }}
      />
      <p className="text-xs text-slate-300">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
