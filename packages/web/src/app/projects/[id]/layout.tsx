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
    <div className="page-shell">
      <Sidebar projectId={projectId} projectName={projectName} />
      <main className="page-content">
        <div className="animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
