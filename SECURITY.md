<!-- Path: SECURITY.md -->
# Security Policy — Sparkle Universe

This document describes how to report security vulnerabilities responsibly and our general handling policy.

---

## Summary
If you discover a security vulnerability in Sparkle Universe, thank you — we take security seriously. Please report it privately and do **not** create public issues or disclose the issue publicly until it is resolved.

---

## Reporting a Security Vulnerability

Preferred channels (in priority order):

1. **Email (encrypted)** — `security@sparkleuniverse.com`  
   - If you use PGP / GPG, encrypt your message to our public key (PGP key fingerprint placeholder below).
   - Please include: affected component, steps to reproduce, impact, PoC (if available), and suggested mitigation.

2. **GitHub Security Advisories** — Create a private security advisory (recommended if you have a GitHub account and wish to use the platform).

3. **Private GitHub issue (labelled `security`)** — If email is not possible, open a private issue and label it `security`.

---

## PGP / GPG Key
- **PGP key fingerprint:** `INSERT_PGP_FINGERPRINT_HERE`  
(Replace with a real key when ready.)

Encrypt sensitive reports using our PGP key before emailing.

---

## What to include in your report
- Full description of the issue
- Full, minimal reproduction steps (PoC code)
- Impact assessment (data exposure, remote code exec, privilege escalation, etc.)
- Affected versions & components
- Any suggested fixes or mitigation steps
- Your contact information and preferred disclosure timeline

---

## Severity & Response SLA
We strive to respond quickly and transparently:
- **Acknowledgement:** within 48 hours
- **Initial triage & next steps:** within 72 hours
- **Remediation plan:** within 7 business days (aim to patch or mitigate)
- **Coordinated disclosure timeline:** typically within 30–90 days depending on severity and complexity

Please note: timelines may vary for complex issues; we will communicate progress.

---

## Public Disclosure Policy
- We will coordinate with the reporter on a responsible disclosure timeline.
- If a reporter discloses a vulnerability publicly before mitigation, we will still aim to assess and remediate quickly, but public disclosure outside agreed timelines may result in longer resolution windows.

---

## Supported Versions
- We support the current `main` branch and the latest released stable version. For critical security patches, we will provide fixes for the last **two major** releases (when applicable).

---

## Bounties
- At this time there is no formal bug bounty program. If/when one is available, it will be announced here.

---

## Security Best Practices (for contributors)
- Never commit secrets or credentials.
- Use environment variables and secrets managers for production configs.
- Follow least privilege for API keys and tokens.
- Run `npm audit` and keep dependencies up to date (Dependabot recommended).
- Add security-related tests for critical flows (auth, access controls, input validation).

---

## Contact
- Security contact: `security@sparkleuniverse.com` (Replace with the operational email)
- For urgent issues and active incidents, include “**SECURITY - CRITICAL**” in the subject.

---

> Note: Replace placeholder contact information and PGP fingerprint with real values before publishing this document publicly.
