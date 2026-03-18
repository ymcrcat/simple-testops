"use client";

interface LoadingSkeletonProps {
  count?: number;
  height?: number;
  gap?: number;
}

export default function LoadingSkeleton({ count = 3, height = 80, gap = 10 }: LoadingSkeletonProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}
