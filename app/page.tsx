"use client";
import { useEffect, useMemo, useState } from "react";
import type { GenerateRequest, GenerateResponse } from "@/types";

type Tab = "dialogue" | "quest";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dialogue");
  const [gameLore, setGameLore] = useState("");
  const [npcName, setNpcName] = useState("");
  const [npcPersonality, setNpcPersonality] =
    useState<GenerateRequest["npcPersonality"]>("Mysterious");
  const [situation, setSituation] = useState("");
  const [location, setLocation] = useState("");
  const [primaryObjective, setPrimaryObjective] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [history, setHistory] = useState<
    Array<{ id: string; req: GenerateRequest; res: GenerateResponse }>
  >([]);

  useEffect(() => {
    const storedLore =
      typeof window !== "undefined"
        ? localStorage.getItem("rpgweaver:lore")
        : null;
    if (storedLore) setGameLore(storedLore);
    const storedHistory =
      typeof window !== "undefined"
        ? localStorage.getItem("rpgweaver:history")
        : null;
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = setTimeout(
        () => localStorage.setItem("rpgweaver:lore", gameLore),
        300
      );
      return () => clearTimeout(t);
    }
  }, [gameLore]);

  const canSubmit = useMemo(() => {
    if (gameLore.trim().length < 10) return false;
    if (activeTab === "dialogue") {
      return npcName.trim().length > 0 || situation.trim().length > 0;
    }
    return location.trim().length > 0 || primaryObjective.trim().length > 0;
  }, [activeTab, gameLore, npcName, situation, location, primaryObjective]);

  async function handleGenerate() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const body: GenerateRequest =
        activeTab === "dialogue"
          ? {
              type: "dialogue",
              gameLore,
              npcName: npcName || undefined,
              npcPersonality: npcPersonality,
              situation: situation || undefined,
            }
          : {
              type: "quest",
              gameLore,
              location: location || undefined,
              primaryObjective: primaryObjective || undefined,
            };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as GenerateResponse;
      setResult(data);
      const entry = { id: crypto.randomUUID(), req: body, res: data };
      const nextHistory = [entry, ...history].slice(0, 10);
      setHistory(nextHistory);
      localStorage.setItem("rpgweaver:history", JSON.stringify(nextHistory));
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function loadFromHistory(id: string) {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    setActiveTab(item.req.type);
    setGameLore(item.req.gameLore || "");
    if (item.req.type === "dialogue") {
      setNpcName(item.req.npcName || "");
      setNpcPersonality(item.req.npcPersonality || "Mysterious");
      setSituation(item.req.situation || "");
    } else {
      setLocation(item.req.location || "");
      setPrimaryObjective(item.req.primaryObjective || "");
    }
    setResult(item.res);
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      <header className="container pt-12 pb-6 animate-fadeIn">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
          RPGWeaver
        </h1>
        <p className="muted mt-2 max-w-prose">
          Generate rich, structured RPG dialogues and quests with AI. Provide
          your game lore and parameters, and get consistent JSON you can drop
          into your tools.
        </p>
      </header>

      <main className="container grid gap-6 lg:grid-cols-3 pb-16">
        <section className="lg:col-span-2 space-y-6">
          <div className="card">
            <label className="label" htmlFor="lore">
              Game Lore
            </label>
            <textarea
              id="lore"
              className="textarea min-h-32"
              placeholder="Describe your world, factions, rules, tone..."
              value={gameLore}
              onChange={(e) => setGameLore(e.target.value)}
            />
            <div className="flex justify-between mt-2">
              <span className="muted">{gameLore.length} characters</span>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => setGameLore(LORE_EXAMPLE)}
                >
                  Load example
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setGameLore("")}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex gap-2 mb-4">
              <button
                className={`btn ${
                  activeTab === "dialogue" ? "btn-primary" : "btn-secondary"
                }`}
                onClick={() => setActiveTab("dialogue")}
                aria-pressed={activeTab === "dialogue"}
              >
                Dialogue
              </button>
              <button
                className={`btn ${
                  activeTab === "quest" ? "btn-primary" : "btn-secondary"
                }`}
                onClick={() => setActiveTab("quest")}
                aria-pressed={activeTab === "quest"}
              >
                Quest
              </button>
            </div>

            {activeTab === "dialogue" ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="npcName">
                    NPC Name
                  </label>
                  <input
                    id="npcName"
                    className="input"
                    value={npcName}
                    onChange={(e) => setNpcName(e.target.value)}
                    placeholder="E.g., Mira Stoneveil"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="personality">
                    Personality
                  </label>
                  <select
                    id="personality"
                    className="select"
                    value={npcPersonality}
                    onChange={(e) => setNpcPersonality(e.target.value as any)}
                  >
                    <option>Goofy</option>
                    <option>Serious</option>
                    <option>Mysterious</option>
                    <option>Aggressive</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="situation">
                    Situation
                  </label>
                  <textarea
                    id="situation"
                    className="textarea"
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="E.g., The blacksmith warns about an ancient forge awakening."
                  />
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    className="input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="E.g., Emberreach"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="objective">
                    Primary Objective
                  </label>
                  <textarea
                    id="objective"
                    className="textarea"
                    value={primaryObjective}
                    onChange={(e) => setPrimaryObjective(e.target.value)}
                    placeholder="E.g., Retrieve the Ember Core from the lava tunnels."
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={!canSubmit || loading}
              >
                {loading ? "Generating..." : "Generate"}
              </button>
              {!canSubmit && (
                <span className="muted">Add lore and at least one field.</span>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Result</h2>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={copyResult}
                  disabled={!result}
                >
                  Copy JSON
                </button>
                {result && (
                  <a
                    className="btn btn-secondary"
                    href={`data:application/json;charset=utf-8,${encodeURIComponent(
                      JSON.stringify(result, null, 2)
                    )}`}
                    download={`${result.type}-result.json`}
                  >
                    Export JSON
                  </a>
                )}
              </div>
            </div>
            <div className="min-h-24 bg-black/30 rounded-md p-3 overflow-auto text-sm">
              {loading && (
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-white/80 animate-pulse"></span>
                  <span className="muted">Contacting the AI...</span>
                </div>
              )}
              {error && <div className="text-red-400">{error}</div>}
              {!loading && !error && result && (
                <pre className="whitespace-pre-wrap break-words text-gray-200">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
              {!loading && !error && !result && (
                <div className="muted">Results will appear here.</div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card">
            <h3 className="text-base font-semibold mb-2">History</h3>
            <ul className="space-y-2">
              {history.length === 0 && (
                <li className="muted">No history yet.</li>
              )}
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    className="w-full text-left btn btn-secondary"
                    onClick={() => loadFromHistory(h.id)}
                  >
                    <span className="font-mono text-xs uppercase tracking-wide mr-2">
                      {h.req.type}
                    </span>
                    {h.req.type === "dialogue"
                      ? h.req.npcName || "Unnamed NPC"
                      : h.req.location || "Unknown location"}
                  </button>
                </li>
              ))}
            </ul>
            {history.length > 0 && (
              <button
                className="btn btn-secondary mt-3"
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem("rpgweaver:history");
                }}
              >
                Clear history
              </button>
            )}
          </div>

          <div className="card">
            <h3 className="text-base font-semibold mb-2">Templates</h3>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setActiveTab("dialogue");
                  setNpcName("Mira Stoneveil");
                  setNpcPersonality("Serious");
                  setSituation("Warns about unstable Ember Core");
                }}
              >
                NPC: Blacksmith
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setActiveTab("quest");
                  setLocation("Emberreach");
                  setPrimaryObjective("Retrieve the Ember Core");
                }}
              >
                Quest: Ember Core
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-base font-semibold mb-2">Tips</h3>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
              <li>Longer lore yields more consistent outputs.</li>
              <li>Use the templates to sanity check quickly.</li>
              <li>Copy JSON and integrate into your toolchain.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

const LORE_EXAMPLE = `The city of Emberreach was built atop ancient lava tunnels. The Ember Core, a relic that stabilizes the city’s forges, is weakening. Guilds compete for influence, and the Night Wardens patrol shadowed alleys. Magic is regulated; contraband runes circulate in the black market.`;
