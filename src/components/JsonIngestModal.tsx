import React, { useState } from 'react';
import { Upload, X, FileJson, Sparkles, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { SAMPLE_CUSTOM_TRIVY_JSON } from '../data/defaultTelemetry';

interface JsonIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (rawJson: string) => { success: boolean; message: string };
  onResetDefault: () => void;
  isCustomActive: boolean;
}

export const JsonIngestModal: React.FC<JsonIngestModalProps> = ({
  isOpen,
  onClose,
  onIngest,
  onResetDefault,
  isCustomActive
}) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setFeedback(null);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setJsonInput(SAMPLE_CUSTOM_TRIVY_JSON);
    setFeedback({
      type: 'success',
      text: 'Loaded sample Trivy v2 container scan payload (payment-gateway-api:v2.4.1). Click "Push & Parse Telemetry" below.'
    });
  };

  const handlePush = () => {
    if (!jsonInput.trim()) {
      setFeedback({ type: 'error', text: 'Please paste a JSON payload or upload a .json scan artifact first.' });
      return;
    }
    const result = onIngest(jsonInput);
    if (result.success) {
      setFeedback({ type: 'success', text: result.message });
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 900);
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-[#292524] bg-[#141210] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292524] px-6 py-4 bg-[#1c1917]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4a359]/15 border border-[#d4a359]/40 text-[#e6be8a]">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">
                Push / Ingest Custom Security Scan JSON
              </h3>
              <p className="text-xs text-stone-400">
                100% Client-Side Parser — Supports Trivy JSON (<code className="text-[#e6be8a]">trivy image -f json</code>), tfsec, or SentinelGate schema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[#292524] bg-[#1c1917] px-4 py-2 text-xs font-medium text-stone-200 hover:border-[#d4a359]/60 hover:text-[#e6be8a] transition">
                <Upload className="h-3.5 w-3.5 text-[#d4a359]" />
                <span>Upload .JSON File</span>
                <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-2 rounded-full border border-[#d4a359]/40 bg-[#d4a359]/10 px-4 py-2 text-xs font-medium text-[#e6be8a] hover:bg-[#d4a359]/20 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Load Sample Payment-API Trivy Payload
              </button>
            </div>

            {isCustomActive && (
              <button
                type="button"
                onClick={() => {
                  onResetDefault();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-700 bg-stone-900 px-3.5 py-1.5 text-xs text-stone-300 hover:border-stone-500 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore Default Pipeline Run
              </button>
            )}
          </div>

          <div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={12}
              placeholder='Paste output of "trivy image --format json <image-name>" or click "Load Sample Payment-API Trivy Payload" above...'
              className="w-full rounded-xl border border-[#292524] bg-[#0b0a09] p-4 font-mono text-xs text-stone-200 placeholder:text-stone-600 focus:border-[#d4a359] focus:outline-none"
            />
          </div>

          {feedback && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs ${
                feedback.type === 'success'
                  ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                  : 'border-red-800/60 bg-red-950/40 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#292524] bg-[#1c1917] px-6 py-4">
          <span className="text-xs text-stone-400 font-mono">
            Zero-backend execution • Parsed locally in browser memory
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#292524] px-4 py-2 text-xs font-medium text-stone-300 hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePush}
              className="rounded-full bg-[#d4a359] px-5 py-2 text-xs font-semibold text-[#0b0a09] hover:bg-[#e6be8a] transition shadow-lg shadow-[#d4a359]/10"
            >
              Push & Parse Telemetry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
