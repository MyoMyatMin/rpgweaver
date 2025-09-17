"use client";
import { useState } from "react";
import type { QuestResponse } from "@/types";

interface QuestVisualizerProps {
  quest: QuestResponse;
  className?: string;
}

interface ObjectiveProps {
  objective: {
    id: string;
    description: string;
    type: "main" | "optional";
    reward?: string;
  };
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function QuestObjective({
  objective,
  index,
  isExpanded,
  onToggle,
}: ObjectiveProps) {
  const typeColors = {
    main: "bg-blue-500/20 border-blue-500/30",
    optional: "bg-purple-500/20 border-purple-500/30",
  };

  const colorClass = typeColors[objective.type];

  return (
    <div className="space-y-2">
      <div
        className={`${colorClass} border rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.02] ${
          isExpanded ? "shadow-lg" : ""
        }`}
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-200 font-medium">
                {objective.description}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  objective.type === "main"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-purple-500/20 text-purple-300"
                }`}
              >
                {objective.type}
              </span>
            </div>
            {objective.reward && (
              <div className="text-xs text-green-400">
                Reward: {objective.reward}
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-black/20 border border-white/10 rounded-md p-3 ml-6">
          <div className="text-sm text-gray-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Objective ID:</span>
              <span className="font-mono text-blue-400">{objective.id}</span>
            </div>
            <div className="text-gray-400">
              <p className="mb-2">{objective.description}</p>
              {objective.reward && (
                <div className="flex items-center gap-2">
                  <span className="text-green-400">💰</span>
                  <span>{objective.reward}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestVisualizer({
  quest,
  className = "",
}: QuestVisualizerProps) {
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(
    new Set()
  );

  const toggleObjective = (objectiveId: string) => {
    const newExpanded = new Set(expandedObjectives);
    if (newExpanded.has(objectiveId)) {
      newExpanded.delete(objectiveId);
    } else {
      newExpanded.add(objectiveId);
    }
    setExpandedObjectives(newExpanded);
  };

  const expandAll = () => {
    setExpandedObjectives(new Set(quest.objectives.map((obj) => obj.id)));
  };

  const collapseAll = () => {
    setExpandedObjectives(new Set());
  };

  const mainObjectives = quest.objectives.filter((obj) => obj.type === "main");
  const optionalObjectives = quest.objectives.filter(
    (obj) => obj.type === "optional"
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            🎯 Quest: {quest.title}
          </h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
            <span>⏱️ {quest.estimatedDuration}</span>
            <span className="text-gray-500">•</span>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                quest.difficulty === "Easy"
                  ? "bg-green-500/20 text-green-300"
                  : quest.difficulty === "Medium"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {quest.difficulty}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Quest Description */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Description
        </h4>
        <p className="text-sm text-gray-200 leading-relaxed">
          {quest.description}
        </p>
      </div>

      {/* Main Objectives */}
      {mainObjectives.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span className="text-blue-400">📋</span>
            Main Objectives ({mainObjectives.length})
          </h4>
          <div className="space-y-3">
            {mainObjectives.map((objective, index) => (
              <QuestObjective
                key={objective.id}
                objective={objective}
                index={index}
                isExpanded={expandedObjectives.has(objective.id)}
                onToggle={() => toggleObjective(objective.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional Objectives */}
      {optionalObjectives.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span className="text-purple-400">🎯</span>
            Optional Objectives ({optionalObjectives.length})
          </h4>
          <div className="space-y-3">
            {optionalObjectives.map((objective, index) => (
              <QuestObjective
                key={objective.id}
                objective={objective}
                index={mainObjectives.length + index}
                isExpanded={expandedObjectives.has(objective.id)}
                onToggle={() => toggleObjective(objective.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rewards */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span className="text-yellow-400">💰</span>
          Rewards
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">
              {quest.rewards.experience}
            </div>
            <div className="text-sm text-gray-400">Experience</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">
              {quest.rewards.gold}
            </div>
            <div className="text-sm text-gray-400">Gold</div>
          </div>
          {quest.rewards.items && quest.rewards.items.length > 0 && (
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">
                {quest.rewards.items.length}
              </div>
              <div className="text-sm text-gray-400">Items</div>
            </div>
          )}
        </div>
        {quest.rewards.items && quest.rewards.items.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs font-semibold text-gray-400 mb-2">
              Item Rewards:
            </h5>
            <div className="flex flex-wrap gap-2">
              {quest.rewards.items.map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quest Summary */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Quest Summary
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <span className="text-gray-500">Total Objectives:</span>{" "}
            {quest.objectives.length}
          </div>
          <div>
            <span className="text-gray-500">Main Objectives:</span>{" "}
            {mainObjectives.length}
          </div>
          <div>
            <span className="text-gray-500">Optional Objectives:</span>{" "}
            {optionalObjectives.length}
          </div>
        </div>
      </div>
    </div>
  );
}
