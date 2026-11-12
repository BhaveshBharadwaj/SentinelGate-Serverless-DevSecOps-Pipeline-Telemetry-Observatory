# 🛡️ SentinelGate — Serverless DevSecOps Pipeline & Live Vulnerability Observatory

**SentinelGate** is a shift-left DevSecOps automation pipeline, hardened container build architecture, and client-side vulnerability telemetry observatory. It continuously audits infrastructure-as-code (Terraform), application dependencies (SAST/SCA), and multi-stage Docker images (Trivy), surfacing real-time CVE posture and CIS compliance metrics through a zero-cost serverless web interface.

---

## 🏗️ System Architecture

```text
+--------------------+      +-------------------------+      +----------------------------+
|   Git Push / PR    | ---> | GitHub Actions / Jenkins| ---> | 1. GitLeaks Secret Gate    |
+--------------------+      +-------------------------+      | 2. SAST & AST Type Audit   |
                                                             | 3. Terraform tfsec Check   |
                                                             | 4. Multi-Stage Docker Scan |
                                                             +-------------+--------------+
                                                                           |
                                                             Exports JSON Scan Artifacts
                                                                           v
+-----------------------------------------------------------------------------------------+
|                 SentinelGate Client-Side Telemetry Observatory (Vercel / Pages)         |
|  • Interactive Trivy CVE Matrix (CVSS, Layer Provenance, Fix Versions)                  |
|  • Live "Push Custom Scan JSON" Client-Side Parser (Trivy v2 / tfsec / Native Schema)   |
|  • CIS AWS Benchmark Terraform Audit & Unprivileged Container Layer Inspector           |
+-----------------------------------------------------------------------------------------+
```

---

## ✨ Key Engineering Highlights

1. **Interactive Client-Side Telemetry Ingestion (`Push Custom Scan JSON`)**
   * Upload or paste raw output from `trivy image --format json <image>` or `tfsec --format json` directly in the browser.
   * Parses CVEs, CVSS v3 vectors, OS vs. language package layers, and remediation versions entirely in browser memory with zero backend server dependencies.
2. **88% Container Attack-Surface Reduction (`docker/Dockerfile`)**
   * Replaces bloated single-stage root containers with a two-stage build (`node:20-alpine` builder → `nginxinc/nginx-unprivileged:1.25-alpine-slim` runtime).
   * Enforces `--ignore-scripts` during `npm ci` to block postinstall supply-chain hooks and runs strictly under non-root `UID 101`.
3. **CIS-Compliant Modular Terraform (`iac/modules/`)**
   * Refactored into reusable `vpc` and `compute-runner` modules.
   * Enforces **EC2 IMDSv2** (`http_tokens = "required"`, hop limit `1`) to prevent SSRF metadata credential theft, KMS root EBS encryption at rest, VPC Flow Logs, and least-privilege IAM instance profiles.
4. **Dual CI/CD Automation (`.github/workflows/` & `ci-enterprise/Jenkinsfile`)**
   * Automated GitHub Actions workflow builds, scans, injects JSON telemetry, and deploys to GitHub Pages/Vercel on every push to `main`.
   * Includes an enterprise declarative `Jenkinsfile` integrating SonarQube Quality Gates and Trivy CLI.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start the interactive telemetry dashboard locally at http://localhost:5173
npm run dev

# 3. Compile production bundle
npm run build
```

