"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FounderDNA } from "@/lib/founder-dna/types";
import { getDNA, saveDNA } from "@/lib/founder-dna/store";

const EMPTY_DNA: FounderDNA = {
  companyName: "",
  companyDescription: "",
  whatYouSell: "",
  icpRole: "",
  icpPain: "",
  icpDecisionMaker: "",
  founderStory: "",
  uniqueDifferentiator: "",
  publicEnemies: [],
  voiceTone: "",
  updatedAt: "",
};

export default function FounderDNAPage() {
  const router = useRouter();
  const [dna, setDNA] = useState<FounderDNA>(EMPTY_DNA);
  const [enemyInput, setEnemyInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = getDNA();
    if (existing) setDNA(existing);
  }, []);

  const update = <K extends keyof FounderDNA>(key: K, value: FounderDNA[K]) => {
    setDNA((prev) => ({ ...prev, [key]: value }));
  };

  const addEnemy = () => {
    if (!enemyInput.trim()) return;
    update("publicEnemies", [...dna.publicEnemies, enemyInput.trim()]);
    setEnemyInput("");
  };

  const removeEnemy = (i: number) => {
    update(
      "publicEnemies",
      dna.publicEnemies.filter((_, idx) => idx !== i)
    );
  };

  const save = () => {
    saveDNA(dna);
    setSaved(true);
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const isComplete = dna.companyName && dna.whatYouSell && dna.icpRole && dna.icpPain && dna.founderStory;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/5 px-6 py-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/30 hover:text-white/70 transition-colors text-sm">
              ← voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <h1 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span className="text-amber-400">🧬</span> founder DNA
              </h1>
              <p className="text-xs text-white/25 mt-0.5">configure uma vez, gera com inteligência sempre</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quem você é, o que vende, pra quem.</h2>
          <p className="text-sm text-white/40 mt-2">
            Quanto mais específico, mais cirúrgico o conteúdo. Toda geração depois é calibrada pra atrair{" "}
            <span className="text-white/70">quem realmente paga você</span>, não viewer aleatório.
          </p>
        </div>

        {/* Empresa */}
        <Section title="Empresa" emoji="🏢">
          <Field label="Nome da empresa">
            <input
              type="text"
              value={dna.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              placeholder="ex: Contentlink"
              className={inputClass}
            />
          </Field>
          <Field label="Descrição em 1 frase" hint="o que sua empresa faz, sem firula">
            <input
              type="text"
              value={dna.companyDescription}
              onChange={(e) => update("companyDescription", e.target.value)}
              placeholder="ex: SaaS de geração de conteúdo viral pra founders B2B"
              className={inputClass}
            />
          </Field>
          <Field label="O que você vende" hint="produto/serviço específico, ticket, modelo">
            <textarea
              rows={2}
              value={dna.whatYouSell}
              onChange={(e) => update("whatYouSell", e.target.value)}
              placeholder="ex: assinatura mensal R$ 297, founders e times de marketing usam pra criar 3-5 posts virais por semana sem contratar agência"
              className={textareaClass}
            />
          </Field>
        </Section>

        {/* ICP */}
        <Section title="ICP — quem compra de você" emoji="🎯">
          <Field label="Cargo + tamanho da empresa">
            <input
              type="text"
              value={dna.icpRole}
              onChange={(e) => update("icpRole", e.target.value)}
              placeholder="ex: Founder ou Head de Marketing de SaaS B2B com 10-50 funcionários"
              className={inputClass}
            />
          </Field>
          <Field label="Dor principal" hint="o problema que faz ele acordar de noite">
            <textarea
              rows={2}
              value={dna.icpPain}
              onChange={(e) => update("icpPain", e.target.value)}
              placeholder="ex: sabe que precisa postar no LinkedIn pra gerar lead, mas trava na hora de escrever — fica horas e o post sai genérico"
              className={textareaClass}
            />
          </Field>
          <Field label="Quem decide a compra" hint="se diferente do cargo acima">
            <input
              type="text"
              value={dna.icpDecisionMaker}
              onChange={(e) => update("icpDecisionMaker", e.target.value)}
              placeholder="ex: o próprio founder, sem comitê"
              className={inputClass}
            />
          </Field>
        </Section>

        {/* Você */}
        <Section title="Você (founder)" emoji="🧠">
          <Field label="Sua história" hint="3-5 linhas, sem ego, com a virada que define você">
            <textarea
              rows={4}
              value={dna.founderStory}
              onChange={(e) => update("founderStory", e.target.value)}
              placeholder="ex: founder de 23 anos, comecei vendendo serviço, errei feio com cliente errado, perdi 6 meses e R$ 50k. Hoje só atendo quem cabe no perfil. Construí o Contentlink porque eu mesmo precisava."
              className={textareaClass}
            />
          </Field>
          <Field label="Diferencial real" hint="o que você faz que ninguém faz igual">
            <textarea
              rows={2}
              value={dna.uniqueDifferentiator}
              onChange={(e) => update("uniqueDifferentiator", e.target.value)}
              placeholder="ex: opero o produto que vendo. Não sou estrategista que nunca executou — uso o próprio Contentlink pra crescer minha empresa"
              className={textareaClass}
            />
          </Field>
          <Field label="Tom de voz" hint="como você fala, em 1 frase">
            <input
              type="text"
              value={dna.voiceTone}
              onChange={(e) => update("voiceTone", e.target.value)}
              placeholder="ex: direto, cru, frases curtas, sem coach, sem motivacional"
              className={inputClass}
            />
          </Field>
        </Section>

        {/* Inimigos */}
        <Section title="Inimigos públicos" emoji="⚔️" subtitle="Quem ou o que você critica. Material puro pra polêmica.">
          <div className="flex gap-2">
            <input
              type="text"
              value={enemyInput}
              onChange={(e) => setEnemyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEnemy())}
              placeholder="ex: agências caras que entregam post genérico"
              className={inputClass}
            />
            <button
              onClick={addEnemy}
              className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-sm rounded-xl transition-all shrink-0"
            >
              + add
            </button>
          </div>
          {dna.publicEnemies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {dna.publicEnemies.map((e, i) => (
                <span
                  key={i}
                  className="text-xs bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-1.5 rounded-full flex items-center gap-2"
                >
                  {e}
                  <button onClick={() => removeEnemy(i)} className="text-red-400/50 hover:text-red-400">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Save */}
        <div className="sticky bottom-4 bg-[#0a0a0a]/95 backdrop-blur border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="text-xs">
            {isComplete ? (
              <span className="text-green-400">✓ DNA completo — pronto pra gerar</span>
            ) : (
              <span className="text-amber-400/70">preenche pelo menos: empresa, o que vende, ICP, dor, sua história</span>
            )}
          </div>
          <button
            onClick={save}
            disabled={!isComplete}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
          >
            {saved ? "salvo ✓" : "salvar DNA"}
          </button>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  emoji,
  subtitle,
  children,
}: {
  title: string;
  emoji: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-bold flex items-center gap-2">
          <span>{emoji}</span> {title}
        </h3>
        {subtitle && <p className="text-xs text-white/30 mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-4 pl-1">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-2">
        {label} {hint && <span className="text-white/25 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all";
const textareaClass = inputClass + " resize-none";
