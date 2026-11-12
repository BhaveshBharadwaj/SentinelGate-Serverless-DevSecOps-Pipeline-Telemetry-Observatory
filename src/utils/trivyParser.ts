import { TelemetryPayload, VulnerabilityItem, Severity, IaCCheck } from '../types/telemetry';
import { DEFAULT_TELEMETRY } from '../data/defaultTelemetry';

function normalizeSeverity(sev?: string): Severity {
  const upper = (sev || 'LOW').toUpperCase();
  if (upper === 'CRITICAL' || upper === 'HIGH' || upper === 'MEDIUM' || upper === 'LOW') {
    return upper;
  }
  return 'LOW';
}

export function parseCustomScanJson(rawJson: string): {
  payload: TelemetryPayload;
  detectedFormat: string;
} {
  const parsed = JSON.parse(rawJson);

  // Format 1: Direct SentinelGate TelemetryPayload format
  if (parsed && parsed.reportMeta && Array.isArray(parsed.vulnerabilities)) {
    return {
      payload: parsed as TelemetryPayload,
      detectedFormat: 'SentinelGate Native Telemetry Schema'
    };
  }

  // Format 2: Official Trivy JSON Output (SchemaVersion 2 / Results[])
  if (parsed && Array.isArray(parsed.Results)) {
    const extractedVulns: VulnerabilityItem[] = [];
    const extractedMisconfigs: IaCCheck[] = [];

    for (const res of parsed.Results) {
      const targetName = res.Target || 'container-layer';
      if (Array.isArray(res.Vulnerabilities)) {
        for (const v of res.Vulnerabilities) {
          const sev = normalizeSeverity(v.Severity);
          const cvssScore =
            v.CVSS?.nvd?.V3Score ||
            v.CVSS?.ghsa?.V3Score ||
            v.CVSS?.redhat?.V3Score ||
            (sev === 'CRITICAL' ? 9.1 : sev === 'HIGH' ? 7.5 : sev === 'MEDIUM' ? 5.4 : 3.1);

          extractedVulns.push({
            id: v.VulnerabilityID || 'CVE-UNKNOWN',
            pkgName: v.PkgName || 'unknown-pkg',
            installedVersion: v.InstalledVersion || '0.0.0',
            fixedVersion: v.FixedVersion || 'Patch Pending',
            severity: sev,
            title: v.Title || v.Description || 'Security vulnerability detected by Trivy scanner',
            layer: targetName,
            cvss: Number(cvssScore),
            target: res.Type || res.Class || 'Container Artifact'
          });
        }
      }

      if (Array.isArray(res.Misconfigurations)) {
        for (const m of res.Misconfigurations) {
          extractedMisconfigs.push({
            ruleId: m.ID || 'AVD-CUSTOM-001',
            resource: m.CauseMetadata?.Resource || targetName,
            modulePath: targetName,
            status: m.Status === 'PASS' ? 'PASSED' : 'FAILED',
            severity: normalizeSeverity(m.Severity),
            description: m.Title || m.Description || 'IaC configuration policy check',
            remediation: m.Resolution || 'Review resource attributes against CIS benchmark.'
          });
        }
      }
    }

    const critCount = extractedVulns.filter((v) => v.severity === 'CRITICAL').length;
    const highCount = extractedVulns.filter((v) => v.severity === 'HIGH').length;
    const computedScore = Math.max(35, 100 - critCount * 12 - highCount * 5);

    const newPayload: TelemetryPayload = {
      ...DEFAULT_TELEMETRY,
      reportMeta: {
        project: parsed.ArtifactName || 'Custom-Trivy-Artifact',
        commitSha: (parsed.Metadata?.ImageID || 'custom-sha256').replace('sha256:', '').slice(0, 7),
        branch: 'custom-ingest',
        triggeredBy: 'interactive-json-ingest',
        timestamp: new Date().toISOString(),
        imageDigest: parsed.Metadata?.ImageID || 'sha256:custom-ingested-artifact',
        baseImage: parsed.ArtifactType || 'container_image',
        securityScore: computedScore
      },
      vulnerabilities: extractedVulns.length > 0 ? extractedVulns : DEFAULT_TELEMETRY.vulnerabilities,
      iacChecks: extractedMisconfigs.length > 0 ? extractedMisconfigs : DEFAULT_TELEMETRY.iacChecks
    };

    return {
      payload: newPayload,
      detectedFormat: `Trivy Schema v${parsed.SchemaVersion || 2} (${extractedVulns.length} CVEs parsed)`
    };
  }

  // Format 3: Tfsec / Checkov array or results wrapper
  if (parsed && Array.isArray(parsed.results)) {
    const checks: IaCCheck[] = parsed.results.map((item: any, idx: number) => ({
      ruleId: item.rule_id || item.check_id || `TFSEC-${idx + 1}`,
      resource: item.resource || 'aws_resource',
      modulePath: item.location?.filename || 'iac/main.tf',
      status: item.status === 'PASSED' ? 'PASSED' : 'FAILED',
      severity: normalizeSeverity(item.severity),
      description: item.description || item.rule_description || 'Terraform policy violation',
      remediation: item.resolution || item.impact || 'Apply least-privilege configuration.'
    }));

    return {
      payload: {
        ...DEFAULT_TELEMETRY,
        reportMeta: {
          ...DEFAULT_TELEMETRY.reportMeta,
          project: 'Custom-Tfsec-Audit',
          triggeredBy: 'tfsec-json-ingest',
          timestamp: new Date().toISOString()
        },
        iacChecks: checks
      },
      detectedFormat: `tfsec / IaC Report (${checks.length} rules parsed)`
    };
  }

  throw new Error(
    'Unrecognized JSON structure. Expected Trivy JSON (`Results[]`), tfsec JSON (`results[]`), or SentinelGate Telemetry schema.'
  );
}
