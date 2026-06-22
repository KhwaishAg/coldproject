"use client";

import { changeApplicationStatus } from "@/app/actions";
import type { Application, ApplicationStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: "discovered", label: "Discovered", color: "bg-gray-100" },
  { id: "draft_ready", label: "Draft Ready", color: "bg-blue-50" },
  { id: "sent", label: "Sent", color: "bg-yellow-50" },
  { id: "replied", label: "Replied", color: "bg-green-50" },
  { id: "interview", label: "Interview", color: "bg-purple-50" },
  { id: "offer", label: "Offer", color: "bg-emerald-50" },
  { id: "rejected", label: "Rejected", color: "bg-red-50" },
];

type Props = {
  applications: Application[];
  onRefresh: () => void;
};

export function KanbanBoard({ applications, onRefresh }: Props) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function moveCard(appId: string, status: ApplicationStatus) {
    await changeApplicationStatus(appId, status);
    startTransition(() => {
      router.refresh();
      onRefresh();
    });
  }

  function handleDragStart(appId: string) {
    setDragging(appId);
  }

  function handleDrop(status: ApplicationStatus) {
    if (dragging) {
      moveCard(dragging, status);
      setDragging(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Application Status</h2>
        <p className="text-sm text-gray-500 mt-1">Drag cards between columns or click to view details.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
        {COLUMNS.map((col) => {
          const cards = applications.filter((a) => a.status === col.id);
          return (
            <div
              key={col.id}
              className={`shrink-0 w-44 rounded-lg p-3 ${col.color}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">
                {col.label} ({cards.length})
              </h3>
              <div className="space-y-2">
                {cards.map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={() => handleDragStart(app.id)}
                    onClick={() => setSelected(app)}
                    className="bg-white rounded shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{app.company_name}</p>
                    {app.alignment_score != null && (
                      <p className="text-xs text-gray-500 mt-1">{app.alignment_score}% fit</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{selected.company_name}</h3>
            <p className="text-sm text-gray-500 capitalize">Status: {selected.status.replace("_", " ")}</p>
            {selected.website_url && (
              <a href={selected.website_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 block truncate">
                {selected.website_url}
              </a>
            )}
            {selected.alignment_notes && (
              <p className="text-sm text-gray-600">{selected.alignment_notes.suggestedFocus}</p>
            )}
            {selected.notes && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selected.notes}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {COLUMNS.filter((c) => c.id !== selected.status).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    moveCard(selected.id, c.id);
                    setSelected(null);
                  }}
                  className="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50"
                >
                  Move to {c.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-sm text-gray-500">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
