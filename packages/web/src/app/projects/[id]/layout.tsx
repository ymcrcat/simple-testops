"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { apiFetch } from "@/lib/api";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = params.id as string;
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    apiFetch<{ name: string }>(`/projects/${projectId}`).then((p) => setProjectName(p.name));
  }, [projectId]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar projectId={projectId} projectName={projectName} />
      <main style={{ flex: 1, padding: "32px 40px", maxWidth: "calc(100vw - 240px)" }}>
        <div className="animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
