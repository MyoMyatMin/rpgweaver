"use client";
import { useState } from "react";
import type { DialogueResponse } from "@/types";

interface DialogueTreeVisualizerProps {
  dialogue: DialogueResponse;
  className?: string;
}

interface NodeProps {
  node: {
    id: string;
    text: string;
    options: Array<{
      id: string;
      text: string;
      nextId?: string;
      consequence?: string;
    }>;
  };
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  personality: string;
}

function DialogueNode({
  node,
  depth,
  isExpanded,
  onToggle,
  personality,
}: NodeProps) {
  const personalityColors = {
    Goofy: "bg-yellow-500/20 border-yellow-500/30",
    Serious: "bg-blue-500/20 border-blue-500/30",
    Mysterious: "bg-purple-500/20 border-purple-500/30",
    Aggressive: "bg-red-500/20 border-red-500/30",
  };

  const colorClass =
    personalityColors[personality as keyof typeof personalityColors] ||
    "bg-gray-500/20 border-gray-500/30";

  return (
    <div className="space-y-2">
      <div
        className={`${colorClass} border rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.02] ${
          isExpanded ? "shadow-lg" : ""
        }`}
        onClick={onToggle}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono">
            {node.id}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-200 leading-relaxed">{node.text}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">
                {node.options.length} options
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">{personality}</span>
            </div>
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
        <div className="space-y-2">
          {node.options.map((option, index) => (
            <div
              key={option.id}
              className="bg-black/20 border border-white/10 rounded-md p-3 transition-all hover:bg-black/30"
              style={{ marginLeft: `${(depth + 1) * 20}px` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-xs font-mono text-gray-400">
                  {String.fromCharCode(97 + index)} {/* a, b, c, etc */}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {option.text}
                  </p>
                  {option.consequence && (
                    <p className="text-xs text-orange-400 mt-1 italic">
                      Consequence: {option.consequence}
                    </p>
                  )}
                  {option.nextId && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-500">→</span>
                      <span className="text-xs text-blue-400 font-mono">
                        {option.nextId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DialogueTreeVisualizer({
  dialogue,
  className = "",
}: DialogueTreeVisualizerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    setExpandedNodes(new Set(dialogue.dialogue.map((node) => node.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            📝 Dialogue: {dialogue.npcName}
          </h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                dialogue.metadata.personality === "Goofy"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : dialogue.metadata.personality === "Serious"
                  ? "bg-blue-500/20 text-blue-300"
                  : dialogue.metadata.personality === "Mysterious"
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {dialogue.metadata.personality}
            </span>
            <span className="text-gray-500">•</span>
            <span>{dialogue.metadata.mood}</span>
            <span className="text-gray-500">•</span>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                dialogue.metadata.difficulty === "Easy"
                  ? "bg-green-500/20 text-green-300"
                  : dialogue.metadata.difficulty === "Medium"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {dialogue.metadata.difficulty}
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

      {/* Tree Structure */}
      <div className="space-y-3">
        {dialogue.dialogue.map((node) => (
          <DialogueNode
            key={node.id}
            node={node}
            depth={0}
            isExpanded={expandedNodes.has(node.id)}
            onToggle={() => toggleNode(node.id)}
            personality={dialogue.metadata.personality}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-4 mt-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Dialogue Summary
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <span className="text-gray-500">Total Nodes:</span>{" "}
            {dialogue.dialogue.length}
          </div>
          <div>
            <span className="text-gray-500">Total Options:</span>{" "}
            {dialogue.dialogue.reduce(
              (sum, node) => sum + node.options.length,
              0
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
