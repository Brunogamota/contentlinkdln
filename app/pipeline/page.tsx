"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lead, PublishedPost } from "@/lib/founder-dna/types";
import { getLeads, saveLead, updateLead, deleteLead } from "@/lib/pipeline/store";
import { getPublishedPosts, getPillars, deletePublishedPost } from "@/lib/founder-dna/store";

const STATUS_COLORS: Record<Lead["status"], string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  contacted: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  qualified: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  converted: "bg-green-500/10 text-green-400 border-green-500/30",
  lost: "bg-red-500/10 text-red-400 border-red-500/30",
};

const STATUS_LABELS: Record<Lead["status"], string> = {
  new: "novo",
  contacted: "contatado",
  qualified: "qualificado",
  converted: "fechou",
  lost: "perdido",
};

const ENGAGEMENT_LABELS: Record<Lead["engagementType"], string> = {
  comment: "comentou",
  like: "curtiu",
  share: "compartilhou",
  dm: "mandou DM",
  follow: "seguiu",
};

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [tab, setTab] = useState<"leads" | "posts">("leads");
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Lead["status"] | "all">("all");
  const pillars = getPillars();

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setLeads(getLeads());
    setPosts(getPublishedPosts());
  };

  const handleAdd = (lead: Omit<Lead, "id" | "createdAt">) => {
    saveLead({
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    });
    setShowAdd(false);
    refresh();
  };

  const handleStatusChange = (id: string, status: Lead["status"]) => {
    updateLead(id, { status });
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("deletar esse lead?")) {
      deleteLead(id);
      refresh();
    }
  };

  const handleDeletePost = (id: string) => {
    if (confirm("remover esse post do pipeline?")) {
      deletePublishedPost(id);
      refresh();
    }
  };

  const filteredLeads = filterStatus === "all" ? leads : leads.filter((l) => l.status === filterStatus);

  const counts = leads.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/5 px-6 py-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/30 hover:text-white/70 transition-colors text-sm">
              ← voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <h1 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span className="text-blue-400">🎯</span> pipeline
              </h1>
              <p className="text-xs text-white/25 mt-0.5">
                {leads.length} lead{leads.length !== 1 ? "s" : ""} · {posts.length} post
                {posts.length !== 1 ? "s" : ""} publicado{posts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("leads")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "leads"
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                : "border border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            🎯 leads
          </button>
          <button
            onClick={() => setTab("posts")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "posts"
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                : "border border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            📝 posts publicados
          </button>
        </div>

        {tab === "leads" && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-wrap gap-2">
                <FilterBtn label="todos" count={leads.length} active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
                {Object.entries(STATUS_LABELS).map(([k, label]) => (
                  <FilterBtn
                    key={k}
                    label={label}
                    count={counts[k] || 0}
                    active={filterStatus === k}
                    onClick={() => setFilterStatus(k as Lead["status"])}
                  />
                ))}
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all font-medium"
              >
                + add lead
              </button>
            </div>

            {showAdd && <LeadForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} posts={posts} />}

            {filteredLeads.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-4xl">🎯</div>
                <p className="text-white/40 text-sm">nenhum lead {filterStatus !== "all" ? STATUS_LABELS[filterStatus] : "ainda"}</p>
                <p className="text-white/20 text-xs max-w-sm mx-auto">
                  Toda vez que alguém engajar com seus posts, adicione aqui. Vira sua lista de prospecção real.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onStatusChange={handleStatusChange}
                    onDelete={() => handleDelete(lead.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "posts" && (
          <>
            {posts.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-4xl">📝</div>
                <p className="text-white/40 text-sm">nenhum post no pipeline</p>
                <p className="text-white/20 text-xs max-w-sm mx-auto">
                  Quando gerar um post, clica em "marcar publicado" pra adicionar aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((p) => {
                  const pillar = pillars.find((pl) => pl.id === p.pillarId);
                  return (
                    <div key={p.id} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          {pillar && (
                            <span>
                              {pillar.emoji} {pillar.name}
                            </span>
                          )}
                          <span>·</span>
                          <span>{new Date(p.publishedAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <button
                          onClick={() => handleDeletePost(p.id)}
                          className="text-xs text-white/30 hover:text-red-400 transition-colors"
                        >
                          remover
                        </button>
                      </div>
                      <p className="text-white font-semibold">{p.hook}</p>
                      <div className="text-white/60 text-sm whitespace-pre-wrap line-clamp-3">{p.post}</div>
                      <p className="text-green-400/70 text-xs italic">→ {p.cta}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function FilterBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
        active ? "bg-white/10 border-white/30 text-white" : "border-white/10 text-white/40 hover:text-white/70"
      }`}
    >
      {label} <span className="ml-1 text-white/40">{count}</span>
    </button>
  );
}

function LeadCard({
  lead,
  onStatusChange,
  onDelete,
}: {
  lead: Lead;
  onStatusChange: (id: string, status: Lead["status"]) => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{lead.name}</p>
          <p className="text-xs text-white/50 mt-0.5">
            {lead.role} {lead.company && `· ${lead.company}`}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {ENGAGEMENT_LABELS[lead.engagementType]} · {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
          </p>
          {lead.notes && <p className="text-xs text-white/60 mt-2 italic">"{lead.notes}"</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(lead.id, e.target.value as Lead["status"])}
            className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer ${STATUS_COLORS[lead.status]}`}
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-[#0a0a0a]">
                {v}
              </option>
            ))}
          </select>
          <button onClick={onDelete} className="text-xs text-white/30 hover:text-red-400 transition-colors">
            deletar
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadForm({
  onSubmit,
  onCancel,
  posts,
}: {
  onSubmit: (lead: Omit<Lead, "id" | "createdAt">) => void;
  onCancel: () => void;
  posts: PublishedPost[];
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [engagementType, setEngagementType] = useState<Lead["engagementType"]>("comment");
  const [postId, setPostId] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ name, role, company, engagementType, postId: postId || undefined, notes, status: "new" });
  };

  return (
    <div className="bg-white/[0.04] border border-blue-500/30 rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-blue-300">novo lead</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className={inputClass} placeholder="nome*" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="cargo (ex: CFO)" value={role} onChange={(e) => setRole(e.target.value)} />
        <input className={inputClass} placeholder="empresa" value={company} onChange={(e) => setCompany(e.target.value)} />
        <select
          className={inputClass}
          value={engagementType}
          onChange={(e) => setEngagementType(e.target.value as Lead["engagementType"])}
        >
          {Object.entries(ENGAGEMENT_LABELS).map(([k, v]) => (
            <option key={k} value={k} className="bg-[#0a0a0a]">
              {v}
            </option>
          ))}
        </select>
      </div>
      {posts.length > 0 && (
        <select className={inputClass} value={postId} onChange={(e) => setPostId(e.target.value)}>
          <option value="" className="bg-[#0a0a0a]">— post relacionado (opcional) —</option>
          {posts.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#0a0a0a]">
              {p.hook.slice(0, 60)}...
            </option>
          ))}
        </select>
      )}
      <textarea
        className={inputClass + " resize-none"}
        placeholder="notas (o que ele comentou, contexto, próximo passo)"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-4 py-2 text-white/50 hover:text-white">
          cancelar
        </button>
        <button onClick={submit} disabled={!name.trim()} className="text-xs px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-40 font-medium">
          salvar lead
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all";
