import { TelemetryPayload } from '../types/telemetry';

export const DEFAULT_TELEMETRY: TelemetryPayload = {
  reportMeta: {
    project: 'SentinelGate-Core-Production',
    commitSha: '9f84c2a',
    branch: 'main',
    triggeredBy: 'github-actions[bot]',
    timestamp: '2026-11-10T06:30:14Z',
    imageDigest: 'sha256:4b9e82f1a8d02c91d8c373a1e91d4f6e2b0d8a7c',
    baseImage: 'gcr.io/distroless/nodejs20-debian12:nonroot',
    securityScore: 94,
  },
  stages: [
    {
      id: 'stage-1',
      name: 'GitLeaks Secret & Entropy Gate',
      tool: 'gitleaks v8.18.2',
      status: 'PASSED',
      duration: '8.2s',
      command: 'gitleaks detect --source . --verbose --redact',
      summary: 'Scanned 148 commits & 42 files. Zero hardcoded AWS/GCP credentials or private keys detected.',
      logs: [
        '[INFO] [06:29:02] Initializing GitLeaks entropy & regex scanner...',
        '[INFO] [06:29:04] Inspecting tree 9f84c2a across 42 tracked files',
        '[PASS] [06:29:09] AWS Access Key ID ruleset: 0 findings',
        '[PASS] [06:29:10] Private RSA/SSH key ruleset: 0 findings',
        '[INFO] [06:29:10] Gate completed in 8.2s — Exit Code 0'
      ]
    },
    {
      id: 'stage-2',
      name: 'SAST & Dependency AST Audit',
      tool: 'SonarQube / Semgrep OSS',
      status: 'PASSED',
      duration: '24.5s',
      command: 'semgrep scan --config=p/security-audit --config=p/typescript --error',
      summary: 'Quality Gate PASSED. 0 taint injection vectors, 0 XSS sinks, 98.4% type safety coverage.',
      logs: [
        '[INFO] [06:29:11] Loading OWASP Top 10 & TypeScript AST rulesets (248 rules)...',
        '[INFO] [06:29:19] Analyzing src/utils/trivyParser.ts for unsafe eval/DOM sinks...',
        '[PASS] [06:29:28] No prototype pollution or DOM XSS vulnerabilities detected.',
        '[INFO] [06:29:35] Quality Gate Status: PASSED (Technical Debt Ratio: 0.3%)'
      ]
    },
    {
      id: 'stage-3',
      name: 'Terraform IaC Security Compliance',
      tool: 'Trivy Config / tfsec v1.28',
      status: 'PASSED',
      duration: '11.4s',
      command: 'trivy config ./iac --severity HIGH,CRITICAL --exit-code 1',
      summary: '18/19 AWS CIS Benchmark controls passed. IMDSv2 enforced, EBS KMS encryption active.',
      logs: [
        '[INFO] [06:29:36] Evaluating Terraform modules in ./iac/modules/vpc and ./iac/modules/compute-runner',
        '[PASS] [06:29:40] AVD-AWS-0028: EC2 instance metadata IMDSv2 hop-limit=1 & tokens=required',
        '[PASS] [06:29:43] AVD-AWS-0131: Root EBS block device encrypted with customer KMS key',
        '[WARN] [06:29:46] AVD-AWS-0104: Egress 0.0.0.0/0 allowed on HTTPS port 443 for package pulls',
        '[INFO] [06:29:47] IaC Compliance Gate Passed (0 CRITICAL, 0 HIGH)'
      ]
    },
    {
      id: 'stage-4',
      name: 'Multi-Stage Distroless Container Scan',
      tool: 'Trivy Image Scanner v0.50',
      status: 'WARN',
      duration: '19.8s',
      command: 'trivy image --format json --output public/telemetry/trivy-report.json sentinelgate:9f84c2a',
      summary: 'Non-root UID 65532 verified. 1 Critical & 2 High OS/library CVEs flagged with remediation paths.',
      logs: [
        '[INFO] [06:29:48] Building multi-stage image from docker/Dockerfile...',
        '[INFO] [06:29:56] Stage 1 (builder): node:20-alpine compiled static bundle (412 KB)',
        '[INFO] [06:30:01] Stage 2 (runtime): Hardened non-root runtime image verified (UID 65532)',
        '[WARN] [06:30:06] CVE-2024-21538 (cross-spawn) & CVE-2024-45296 (path-to-regexp) flagged in lockfile snapshot',
        '[INFO] [06:30:08] Exported telemetry artifact -> public/telemetry/trivy-report.json'
      ]
    },
    {
      id: 'stage-5',
      name: 'Zero-Downtime Edge Deployment',
      tool: 'Vercel / GitHub Pages CDN',
      status: 'PASSED',
      duration: '9.1s',
      command: 'vercel deploy --prebuilt --prod',
      summary: 'Immutable artifact published with strict CSP, HSTS, and X-Frame-Options security headers.',
      logs: [
        '[INFO] [06:30:09] Uploading immutable static bundle + live JSON security telemetry...',
        '[PASS] [06:30:12] Applied HTTP response headers: Strict-Transport-Security, Content-Security-Policy',
        '[PASS] [06:30:14] Deployment live and healthcheck HTTP 200 verified.'
      ]
    }
  ],
  vulnerabilities: [
    {
      id: 'CVE-2024-21538',
      pkgName: 'cross-spawn',
      installedVersion: '7.0.3',
      fixedVersion: '7.0.5',
      severity: 'CRITICAL',
      title: 'Regular Expression Denial of Service (ReDoS) via improper argument escaping',
      layer: 'package-lock.json (build-chain)',
      cvss: 9.1,
      target: 'Node.js Dependencies'
    },
    {
      id: 'CVE-2024-45296',
      pkgName: 'path-to-regexp',
      installedVersion: '0.1.7',
      fixedVersion: '0.1.10',
      severity: 'HIGH',
      title: 'Backtracking regular expression complexity leading to event-loop exhaustion',
      layer: 'package-lock.json (router)',
      cvss: 7.5,
      target: 'Node.js Dependencies'
    },
    {
      id: 'CVE-2024-6119',
      pkgName: 'libssl3',
      installedVersion: '3.1.4-r5',
      fixedVersion: '3.1.7-r0',
      severity: 'HIGH',
      title: 'OpenSSL X.509 Name Constraints verification out-of-bounds read during handshake',
      layer: 'sha256:a18c902d (OS Base Layer)',
      cvss: 7.5,
      target: 'Alpine/Debian Base OS'
    },
    {
      id: 'CVE-2024-4067',
      pkgName: 'micromatch',
      installedVersion: '4.0.5',
      fixedVersion: '4.0.8',
      severity: 'MEDIUM',
      title: 'Inefficient regular expression complexity in glob pattern parsing',
      layer: 'package-lock.json (dev-tooling)',
      cvss: 5.3,
      target: 'Node.js Dependencies'
    },
    {
      id: 'CVE-2024-37890',
      pkgName: 'ws',
      installedVersion: '8.16.0',
      fixedVersion: '8.17.1',
      severity: 'MEDIUM',
      title: 'Uncaught TypeError when handling malformed HTTP upgrade headers frame',
      layer: 'package-lock.json (hmr-client)',
      cvss: 5.9,
      target: 'Node.js Dependencies'
    },
    {
      id: 'CVE-2023-45853',
      pkgName: 'zlib1g',
      installedVersion: '1.2.13.dfsg-1',
      fixedVersion: '1.3.dfsg-3.1',
      severity: 'LOW',
      title: 'MiniZip integer overflow in zipOpenNewFileInZip4_64 helper utility',
      layer: 'sha256:a18c902d (OS Base Layer)',
      cvss: 3.7,
      target: 'Alpine/Debian Base OS'
    }
  ],
  containerLayers: [
    {
      order: 1,
      instruction: 'FROM node:20.12-alpine3.19 AS builder',
      size: '41.2 MB',
      hardened: true,
      securityNote: 'Isolated build stage — compilers and npm cache never ship to production runtime.'
    },
    {
      order: 2,
      instruction: 'WORKDIR /app && COPY package*.json ./ && RUN npm ci --ignore-scripts',
      size: '118.4 MB',
      hardened: true,
      securityNote: '--ignore-scripts blocks malicious postinstall supply-chain execution hooks.'
    },
    {
      order: 3,
      instruction: 'COPY . . && RUN npm run build',
      size: '482 KB',
      hardened: true,
      securityNote: 'Compiles static production bundle; strips TypeScript & devDependencies.'
    },
    {
      order: 4,
      instruction: 'FROM nginxinc/nginx-unprivileged:1.25-alpine-slim AS runtime',
      size: '14.8 MB',
      hardened: true,
      securityNote: 'Minimal unprivileged runtime image (88% smaller than legacy node:latest).'
    },
    {
      order: 5,
      instruction: 'RUN rm -rf /usr/share/nginx/html/* && COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html',
      size: '482 KB',
      hardened: true,
      securityNote: 'Strict ownership assigned to non-root UID 101; zero shell escalation binaries.'
    },
    {
      order: 6,
      instruction: 'USER 101:101 && EXPOSE 8080 && HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/ || exit 1',
      size: '0 B',
      hardened: true,
      securityNote: 'Drops CAP_NET_BIND_SERVICE root requirement by binding to unprivileged port 8080.'
    }
  ],
  iacChecks: [
    {
      ruleId: 'AVD-AWS-0028',
      resource: 'aws_instance.sentinel_runner',
      modulePath: 'iac/modules/compute-runner/main.tf:24',
      status: 'PASSED',
      severity: 'HIGH',
      description: 'Instance Metadata Service v2 (IMDSv2) session tokens strictly enforced (http_tokens = "required").',
      remediation: 'metadata_options { http_endpoint = "enabled", http_tokens = "required", http_put_response_hop_limit = 1 }'
    },
    {
      ruleId: 'AVD-AWS-0131',
      resource: 'aws_instance.sentinel_runner.root_block_device',
      modulePath: 'iac/modules/compute-runner/main.tf:31',
      status: 'PASSED',
      severity: 'HIGH',
      description: 'Root EBS volume encrypted at rest using customer-managed AWS KMS key.',
      remediation: 'root_block_device { encrypted = true, kms_key_id = var.kms_key_arn }'
    },
    {
      ruleId: 'AVD-AWS-0107',
      resource: 'aws_security_group.runner_sg',
      modulePath: 'iac/modules/vpc/main.tf:48',
      status: 'PASSED',
      severity: 'CRITICAL',
      description: 'Port 22 (SSH) & Port 8080 ingress restricted to bastion CIDR (no 0.0.0.0/0 public exposure).',
      remediation: 'ingress { from_port = 22, to_port = 22, cidr_blocks = [var.admin_bastion_cidr] }'
    },
    {
      ruleId: 'AVD-AWS-0178',
      resource: 'aws_vpc.sentinel_vpc',
      modulePath: 'iac/modules/vpc/main.tf:19',
      status: 'PASSED',
      severity: 'MEDIUM',
      description: 'VPC Flow Logs enabled and shipped to encrypted CloudWatch Log Group for packet auditing.',
      remediation: 'resource "aws_flow_log" "vpc_flow_audit" { traffic_type = "ALL" }'
    },
    {
      ruleId: 'AVD-AWS-0057',
      resource: 'aws_iam_role_policy.runner_least_privilege',
      modulePath: 'iac/modules/compute-runner/main.tf:62',
      status: 'PASSED',
      severity: 'HIGH',
      description: 'IAM Instance Profile scoped to ECR Pull & CloudWatch Logs without wildcard (*) privileges.',
      remediation: 'Scoped Action array to ecr:GetDownloadUrlForLayer, ecr:BatchGetImage, logs:PutLogEvents.'
    },
    {
      ruleId: 'AVD-AWS-0104',
      resource: 'aws_security_group_rule.https_egress',
      modulePath: 'iac/modules/vpc/main.tf:69',
      status: 'FAILED',
      severity: 'LOW',
      description: 'Outbound HTTPS (443) allows 0.0.0.0/0 to pull upstream Trivy vulnerability DB & container layers.',
      remediation: 'Route outbound traffic through AWS Network Firewall or VPC Endpoints for strict air-gapped environments.'
    }
  ]
};

export const SAMPLE_CUSTOM_TRIVY_JSON = JSON.stringify({
  SchemaVersion: 2,
  ArtifactName: "ghcr.io/enterprise-org/payment-gateway-api:v2.4.1",
  ArtifactType: "container_image",
  Metadata: {
    ImageID: "sha256:88f1c9a3d772e04b91a2",
    RepoTags: ["ghcr.io/enterprise-org/payment-gateway-api:v2.4.1"]
  },
  Results: [
    {
      Target: "payment-gateway-api (alpine 3.18.4)",
      Class: "os-pkgs",
      Type: "alpine",
      Vulnerabilities: [
        {
          VulnerabilityID: "CVE-2024-5535",
          PkgName: "openssl",
          InstalledVersion: "3.1.4-r1",
          FixedVersion: "3.1.6-r0",
          Severity: "CRITICAL",
          Title: "OpenSSL SSL_select_next_proto buffer overread during ALPN negotiation",
          CVSS: { nvd: { V3Score: 9.8 } }
        },
        {
          VulnerabilityID: "CVE-2024-2961",
          PkgName: "glibc-iconv",
          InstalledVersion: "2.37-r0",
          FixedVersion: "2.38-r4",
          Severity: "CRITICAL",
          Title: "ISO-2022-CN-EXT out-of-bounds write in iconv() character conversion",
          CVSS: { nvd: { V3Score: 8.8 } }
        }
      ]
    },
    {
      Target: "usr/src/app/package-lock.json",
      Class: "lang-pkgs",
      Type: "npm",
      Vulnerabilities: [
        {
          VulnerabilityID: "CVE-2024-39338",
          PkgName: "axios",
          InstalledVersion: "1.6.2",
          FixedVersion: "1.7.4",
          Severity: "HIGH",
          Title: "Server-Side Request Forgery (SSRF) and credential leakage via protocol-relative URLs",
          CVSS: { nvd: { V3Score: 7.7 } }
        },
        {
          VulnerabilityID: "CVE-2024-43796",
          PkgName: "express",
          InstalledVersion: "4.18.2",
          FixedVersion: "4.20.0",
          Severity: "MEDIUM",
          Title: "Improper neutralization of redirect location parameter in res.redirect()",
          CVSS: { nvd: { V3Score: 6.1 } }
        }
      ]
    }
  ]
}, null, 2);
