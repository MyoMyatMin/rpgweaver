"use client";
import { useState } from "react";
import type { GenerateResponse } from "@/types";
import { exportFormats } from "@/lib/utils";

interface ExportOptionsProps {
  data: GenerateResponse;
  className?: string;
}

export default function ExportOptions({
  data,
  className = "",
}: ExportOptionsProps) {
  const [selectedFormat, setSelectedFormat] = useState("json");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const format =
        exportFormats[selectedFormat as keyof typeof exportFormats];
      const content = format.transform(data);

      const blob = new Blob([content], { type: format.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        data.type === "dialogue" ? data.npcName : data.title
      }-${selectedFormat}.${format.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    try {
      const format =
        exportFormats[selectedFormat as keyof typeof exportFormats];
      const content = format.transform(data);
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Export Options</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            Copy
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-3 py-1 text-sm bg-white text-black hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
          >
            {isExporting ? "Exporting..." : "Download"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(exportFormats).map(([key, format]) => (
          <button
            key={key}
            onClick={() => setSelectedFormat(key)}
            className={`p-3 rounded-lg border transition-all text-left ${
              selectedFormat === key
                ? "border-white/30 bg-white/10"
                : "border-white/10 bg-black/20 hover:bg-black/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                {key === "json" && "{}"}
                {key === "unity" && "U"}
                {key === "unreal" && "U"}
                {key === "markdown" && "M"}
              </div>
              <div>
                <div className="font-medium text-white">{format.name}</div>
                <div className="text-xs text-gray-400">.{format.extension}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Format Description */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          {exportFormats[selectedFormat as keyof typeof exportFormats].name}{" "}
          Format
        </h4>
        <div className="text-sm text-gray-400">
          {selectedFormat === "json" &&
            "Raw JSON data for direct integration with your tools"}
          {selectedFormat === "unity" &&
            "Unity C# script with dialogue system classes ready to use"}
          {selectedFormat === "unreal" &&
            "Unreal Engine compatible JSON format for Blueprint import"}
          {selectedFormat === "markdown" &&
            "Human-readable documentation format for quest/dialogue docs"}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Preview</h4>
        <div className="bg-black/30 rounded p-3 max-h-32 overflow-auto">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
            {(() => {
              const format =
                exportFormats[selectedFormat as keyof typeof exportFormats];
              const content = format.transform(data);
              return content.length > 200
                ? content.substring(0, 200) + "..."
                : content;
            })()}
          </pre>
        </div>
      </div>
    </div>
  );
}
