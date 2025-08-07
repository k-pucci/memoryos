"use client";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { useEffect } from "react";
import { Brain, Download } from "lucide-react";

export default function ModelLoadingState() {
  const { isLoading, isReady, initializeEmbedder } = useEmbeddings();

  useEffect(() => {
    // Preload the model when the app starts
    initializeEmbedder();
  }, [initializeEmbedder]);

  if (isReady) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Download size={16} className="animate-bounce text-blue-400" />
          ) : (
            <Brain size={16} className="text-gray-400" />
          )}
          <span className="text-sm text-gray-300">
            {isLoading ? "Loading AI model..." : "AI model ready"}
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="mt-2">
          <div className="w-40 bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">First time setup (~20MB)</p>
        </div>
      )}
    </div>
  );
}
