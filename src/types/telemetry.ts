export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface VulnerabilityItem {
  id: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion: string;
  severity: Severity;
  title: string;
  layer: string;
  cvss: number;
  target: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  tool: string;
  status: 'PASSED' | 'WARN' | 'BLOCKED';
  duration: string;
  command: string;
  summary: string;
  logs: string[];
}

export interface ContainerLayer {
  order: number;
  instruction: string;
  size: string;
  hardened: boolean;
  securityNote: string;
}

export interface IaCCheck {
  ruleId: string;
  resource: string;
  modulePath: string;
  status: 'PASSED' | 'FAILED';
  severity: Severity;
  description: string;
  remediation: string;
}

export interface TelemetryPayload {
  reportMeta: {
    project: string;
    commitSha: string;
    branch: string;
    triggeredBy: string;
    timestamp: string;
    imageDigest: string;
    baseImage: string;
    securityScore: number;
  };
  stages: PipelineStage[];
  vulnerabilities: VulnerabilityItem[];
  containerLayers: ContainerLayer[];
  iacChecks: IaCCheck[];
}
