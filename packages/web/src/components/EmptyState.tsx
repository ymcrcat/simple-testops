"use client";

interface EmptyStateProps {
  icon: string;
  message: string;
  className?: string;
}

export default function EmptyState({ icon, message, className = "" }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="icon">{icon}</div>
      <p>{message}</p>
    </div>
  );
}
