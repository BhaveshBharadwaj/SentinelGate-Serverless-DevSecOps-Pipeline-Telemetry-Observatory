import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Terminal,
  Layers,
  Cpu,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  Search,
  GitBranch,
  GitCommit,
  Lock,
  Server,
  Download,
  RefreshCw,
  Code2,
  ExternalLink
} from 'lucide-react';
import { DEFAULT_TELEMETRY } from './data/defaultTelemetry';
import { TelemetryPayload, Severity } from './types/telemetry';
import { parseCustomScanJson } from './utils/trivyParser';
import { JsonIngestModal } from './components/JsonIngestModal';

export function App() {
  const [telemetry, setTelemetry] = useState<TelemetryPayload>(DEFAULT_TELEMETRY);
  const [isCustomActive, setIsCustomActive] = useState<boolean>(false);
  const [detectedSchema, setDetectedSchema] = useState<string>('GitHub Actions Live Artifact');
  const [activeTab, setActiveTab] = useState<'cves' | 'layers' | 'iac' | 'pipeline'>('cves');
  const [selectedStageId, setSelectedStageId] = useState<string>(DEFAULT_TELEMETRY.stages[3].id);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Attempt to load live CI/CD artifact from public/telemetry/latest-scan.json on mount
  useEffect(() => {
    fetch('./telemetry/latest-scan.json')
      .then((res) => {
        if (!res.ok) throw new Error('No external file');
        return res.json();
      })
      .then((data) => {
        if (data && data.reportMeta) {
          setTelemetry(data);
        }
      })
      .catch(() => {
        // Fallback to built-in default telemetry seamlessly
      });
  }, []);

  const counts = useMemo(() => {
    const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    telemetry.vulnerabilities.forEach((v) => {
      c[v.severity] = (c[v.severity] || 0) + 1;
    });
    return c;
  }, [telemetry]);

  const filteredVulnerabilities = useMemo(() => {
    return telemetry.vulnerabilities.filter((v) => {
      const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        v.id.toLowerCase().includes(q) ||
        v.pkgName.toLowerCase().includes(q) ||
        v.title.toLowerCase().includes(q) ||
        v.layer.toLowerCase().includes(q);
      return matchesSeverity && matchesQuery;
    });
  }, [telemetry, severityFilter, searchQuery]);

  const selectedStage = useMemo(() => {
    return telemetry.stages.find((s) => s.id === selectedStageId) || telemetry.stages[0];
  }, [telemetry, selectedStageId]);

  const handleIngestJson = (rawJson: string): { success: boolean; message: string } => {
    try {
      const { payload, detectedFormat } = parseCustomScanJson(rawJson);
      setTelemetry(payload);
      setIsCustomActive(true);
      setDetectedSchema(detectedFormat);
      setActiveTab('cves');
      return {
        success: true,
        message: `Successfully ingested ${detectedFormat}`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Invalid JSON structure.'
      };
    }
  };

  const handleExportReport = () => {
    const blob = new Blob([JSON.stringify(telemetry, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinelgate-telemetry-${telemetry.reportMeta.commitSha}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityBadgeClass = (sev: Severity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-950/70 text-red-300 border-red-800/70';
      case 'HIGH':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/70';
      case 'MEDIUM':
        return 'bg-yellow-950/60 text-yellow-200 border-yellow-800/60';
      case 'LOW':
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0a09] text-stone-200 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#292524] bg-[#0b0a09]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a359]/25 to-[#9c7336]/10 border border-[#d4a359]/50 shadow-inner">
              <ShieldCheck className="h-5 w-5 text-[#e6be8a]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-stone-100">SentinelGate</h1>
                <span className="rounded-full border border-[#d4a359]/40 bg-[#d4a359]/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#e6be8a]">
                  v1.2.0 • Shift-Left Observatory
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Serverless DevSecOps Pipeline, Container Hardening & Live CVE Telemetry
              </p>
            </div>
          </div>

          {/* Action Pill Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#292524] bg-[#141210] px-3.5 py-1.5 text-xs text-stone-300 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{detectedSchema}</span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#d4a359] px-4 py-2 text-xs font-semibold text-[#0b0a09] hover:bg-[#e6be8a] transition shadow-md shadow-[#d4a359]/10"
            >
              <FileJson className="h-4 w-4" />
              <span>Push Custom Scan JSON</span>
            </button>

            <button
              onClick={handleExportReport}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#292524] bg-[#141210] px-3.5 py-2 text-xs font-medium text-stone-300 hover:border-[#d4a359]/50 hover:text-[#e6be8a] transition"
              title="Download active telemetry JSON"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 space-y-8">
        {/* Metadata Bar */}
        <section className="rounded-2xl border border-[#292524] bg-[#141210] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                <span>TARGET ARTIFACT</span>
                <span>•</span>
                <span className="text-[#e6be8a]">{telemetry.reportMeta.baseImage}</span>
              </div>
              <h2 className="text-xl font-semibold text-stone-100 flex items-center gap-2.5">
                <span>{telemetry.reportMeta.project}</span>
                {isCustomActive && (
                  <span className="rounded-full bg-[#d4a359]/20 border border-[#d4a359]/50 px-2.5 py-0.5 text-xs font-mono text-[#e6be8a]">
                    Custom Ingest Active
                  </span>
                )}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 rounded-full border border-[#292524] bg-[#1c1917] px-3.5 py-1.5 text-stone-300">
                <GitBranch className="h-3.5 w-3.5 text-[#d4a359]" />
                <span>{telemetry.reportMeta.branch}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[#292524] bg-[#1c1917] px-3.5 py-1.5 text-stone-300">
                <GitCommit className="h-3.5 w-3.5 text-[#d4a359]" />
                <span>{telemetry.reportMeta.commitSha}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[#292524] bg-[#1c1917] px-3.5 py-1.5 text-stone-400">
                <span>Digest: {telemetry.reportMeta.imageDigest.slice(0, 19)}...</span>
              </div>
            </div>
          </div>
        </section>

        {/* Executive KPI Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#292524] bg-[#141210] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                Security Posture Score
              </span>
              <ShieldCheck className="h-4 w-4 text-[#d4a359]" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-[#e6be8a] font-mono">
                {telemetry.reportMeta.securityScore}/100
              </span>
              <span className="rounded-full bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                CIS Hardened
              </span>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              Non-root UID 101 runtime + IMDSv2 Terraform compliance
            </p>
          </div>

          <div className="rounded-2xl border border-[#292524] bg-[#141210] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                Critical & High CVEs
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-red-400 font-mono">{counts.CRITICAL}</span>
              <span className="text-xs text-stone-400">Critical</span>
              <span className="text-2xl font-bold text-amber-400 font-mono ml-2">{counts.HIGH}</span>
              <span className="text-xs text-stone-400">High</span>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              {counts.MEDIUM} Medium & {counts.LOW} Low advisories tracked
            </p>
          </div>

          <div className="rounded-2xl border border-[#292524] bg-[#141210] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                IaC Terraform Benchmark
              </span>
              <Server className="h-4 w-4 text-[#d4a359]" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-stone-100 font-mono">
                {telemetry.iacChecks.filter((c) => c.status === 'PASSED').length}/{telemetry.iacChecks.length}
              </span>
              <span className="rounded-full bg-[#d4a359]/15 border border-[#d4a359]/40 px-2.5 py-0.5 text-[11px] font-mono text-[#e6be8a]">
                tfsec / Checkov
              </span>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              Modular VPC & Compute Runner verified
            </p>
          </div>

          <div className="rounded-2xl border border-[#292524] bg-[#141210] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                Container Attack Surface
              </span>
              <Lock className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-stone-100 font-mono">-88.4%</span>
              <span className="rounded-full bg-stone-800 border border-stone-700 px-2.5 py-0.5 text-[11px] font-mono text-stone-300">
                15.3 MB Image
              </span>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              Multi-stage build vs legacy 132 MB Node base
            </p>
          </div>
        </section>

        {/* Interactive Pipeline Stage Visualizer + Live Terminal */}
        <section className="rounded-2xl border border-[#292524] bg-[#141210] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-stone-100 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#d4a359]" />
                <span>Shift-Left DevSecOps Pipeline Execution</span>
              </h3>
              <p className="text-xs text-stone-400">
                Click any pipeline gate below to inspect its execution command and live security telemetry logs
              </p>
            </div>
            <span className="font-mono text-xs text-stone-400">
              Total Duration: <strong className="text-[#e6be8a]">1m 13s</strong>
            </span>
          </div>

          {/* Pipeline Nodes */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {telemetry.stages.map((stage, index) => {
              const isSelected = stage.id === selectedStage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`text-left rounded-xl border p-3.5 transition all ${
                    isSelected
                      ? 'border-[#d4a359] bg-[#1c1917] shadow-lg shadow-[#d4a359]/5'
                      : 'border-[#292524] bg-[#0b0a09]/60 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-400">0{index + 1}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        stage.status === 'PASSED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {stage.status}
                    </span>
                  </div>
                  <div className="mt-2 font-medium text-xs text-stone-100 line-clamp-1">
                    {stage.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span className="truncate">{stage.tool}</span>
                    <span className="text-[#e6be8a]">{stage.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Embedded Terminal Output for Selected Stage */}
          <div className="rounded-xl border border-[#292524] bg-[#0b0a09] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#292524] bg-[#1c1917] px-4 py-2.5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-[#d4a359]" />
                <span className="text-stone-200 font-semibold">{selectedStage.name}</span>
                <span className="text-stone-400">—</span>
                <code className="text-[#e6be8a]">{selectedStage.command}</code>
              </div>
              <span className="text-stone-400">{selectedStage.tool}</span>
            </div>
            <div className="p-4 font-mono text-xs space-y-1.5 text-stone-300">
              {selectedStage.logs.map((line, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-stone-600 select-none mr-3">{i + 1}</span>
                  <span
                    className={
                      line.includes('[PASS]')
                        ? 'text-emerald-300'
                        : line.includes('[WARN]')
                        ? 'text-amber-300'
                        : 'text-stone-300'
                    }
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deep-Dive Telemetry Tabs */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#292524] pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('cves')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeTab === 'cves'
                    ? 'bg-[#d4a359] text-[#0b0a09]'
                    : 'bg-[#141210] text-stone-300 border border-[#292524] hover:border-stone-700'
                }`}
              >
                Trivy CVE Vulnerability Matrix ({telemetry.vulnerabilities.length})
              </button>
              <button
                onClick={() => setActiveTab('iac')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeTab === 'iac'
                    ? 'bg-[#d4a359] text-[#0b0a09]'
                    : 'bg-[#141210] text-stone-300 border border-[#292524] hover:border-stone-700'
                }`}
              >
                Terraform IaC Compliance ({telemetry.iacChecks.length})
              </button>
              <button
                onClick={() => setActiveTab('layers')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeTab === 'layers'
                    ? 'bg-[#d4a359] text-[#0b0a09]'
                    : 'bg-[#141210] text-stone-300 border border-[#292524] hover:border-stone-700'
                }`}
              >
                Hardened Container Layer Audit ({telemetry.containerLayers.length})
              </button>
            </div>

            {activeTab === 'cves' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className=" h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter CVE, package, layer..."
                    className="rounded-full border border-[#292524] bg-[#141210] pl-8 pr-4 py-1.5 text-xs text-stone-200 placeholder:text-stone-400 focus:border-[#d4a359] focus:outline-none"
                  />
                </div>
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`rounded-full px-3 py-1 text-[11px] font-mono font-medium transition ${
                      severityFilter === sev
                        ? 'bg-[#d4a359]/20 text-[#e6be8a] border border-[#d4a359]'
                        : 'bg-[#141210] text-stone-400 border border-[#292524] hover:text-stone-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB 1: CVE Vulnerability Matrix */}
          {activeTab === 'cves' && (
            <div className="rounded-2xl border border-[#292524] bg-[#141210] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#292524] bg-[#1c1917] text-[11px] font-mono uppercase text-stone-400">
                      <th className="py-3.5 px-4">CVE ID</th>
                      <th className="py-3.5 px-4">Severity / CVSS</th>
                      <th className="py-3.5 px-4">Package</th>
                      <th className="py-3.5 px-4">Installed → Fixed</th>
                      <th className="py-3.5 px-4">Artifact Layer</th>
                      <th className="py-3.5 px-4">Vulnerability Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292524] text-xs">
                    {filteredVulnerabilities.map((vuln, idx) => (
                      <tr key={`${vuln.id}-${idx}`} className="hover:bg-[#1c1917]/60 transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#e6be8a] whitespace-nowrap">
                          {vuln.id}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold ${severityBadgeClass(
                              vuln.severity
                            )}`}
                          >
                            <span>{vuln.severity}</span>
                            <span className="opacity-75">({vuln.cvss.toFixed(1)})</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-200 whitespace-nowrap">
                          {vuln.pkgName}
                        </td>
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <span className="text-red-300/90 line-through mr-1.5">
                            {vuln.installedVersion}
                          </span>
                          <span className="text-emerald-300 font-semibold">
                            → {vuln.fixedVersion}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-400 whitespace-nowrap">
                          {vuln.layer}
                        </td>
                        <td className="py-3.5 px-4 text-stone-300 max-w-md">
                          {vuln.title}
                        </td>
                      </tr>
                    ))}
                    {filteredVulnerabilities.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400 font-mono text-xs">
                          No vulnerabilities match the current filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Terraform IaC Compliance */}
          {activeTab === 'iac' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {telemetry.iacChecks.map((check) => (
                <div
                  key={check.ruleId}
                  className="rounded-2xl border border-[#292524] bg-[#141210] p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#e6be8a]">
                        {check.ruleId}
                      </span>
                      <span className="text-xs font-mono text-stone-400">• {check.modulePath}</span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                        check.status === 'PASSED'
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                          : 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-stone-300">{check.resource}</div>
                  <p className="text-xs text-stone-300 leading-relaxed">{check.description}</p>
                  <div className="rounded-xl border border-[#292524] bg-[#0b0a09] p-3 font-mono text-[11px] text-stone-400">
                    <span className="text-[#d4a359] font-semibold">Enforcement: </span>
                    {check.remediation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Container Layer Audit */}
          {activeTab === 'layers' && (
            <div className="rounded-2xl border border-[#292524] bg-[#141210] p-6 space-y-4">
              {telemetry.containerLayers.map((layer) => (
                <div
                  key={layer.order}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-[#292524] bg-[#0b0a09] p-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d4a359]/15 border border-[#d4a359]/40 font-mono text-xs text-[#e6be8a]">
                        {layer.order}
                      </span>
                      <code className="font-mono text-xs text-stone-100">{layer.instruction}</code>
                    </div>
                    <p className="text-xs text-stone-400 pl-8">{layer.securityNote}</p>
                  </div>
                  <div className="flex items-center gap-3 pl-8 md:pl-0 shrink-0">
                    <span className="rounded-full border border-[#292524] bg-[#141210] px-3 py-1 font-mono text-xs text-stone-300">
                      {layer.size}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 font-mono text-[11px] text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Hardened
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#292524] bg-[#0b0a09] py-6 px-6 text-xs text-stone-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <ShieldCheck className="h-4 w-4 text-[#d4a359]" />
            <span className="text-stone-300 font-semibold">SentinelGate</span>
            <span>— Automated DevSecOps Pipeline & Vulnerability Observatory</span>
          </div>
          <div className="font-mono">
            Serverless Static Architecture • Ready for GitHub Pages & Vercel
          </div>
        </div>
      </footer>

      {/* Interactive JSON Push Modal */}
      <JsonIngestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onIngest={handleIngestJson}
        onResetDefault={() => {
          setTelemetry(DEFAULT_TELEMETRY);
          setIsCustomActive(false);
          setDetectedSchema('GitHub Actions Live Artifact');
        }}
        isCustomActive={isCustomActive}
      />
    </div>
  );
}

export default App;
