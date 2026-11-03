# Data Breach Response Plan — DPDP Act Section 8(6)

## Incident Response Framework

### Phase 1: Identification & Containment (Hour 0–2)
1. Detect anomaly through Supabase audit logs or error spikes.
2. Sever compromised API credentials and rotate secrets immediately.
3. Isolate affected instances and preserve forensic logs.

### Phase 2: Assessment & Notification (Hour 2–6)
1. Determine categories of participants affected.
2. In compliance with DPDP Act 2023 Section 8(6) and CERT-In directions, notify the **Data Protection Board of India** and CERT-In within 6 hours.
3. Transmit written notification to affected Team Leaders via verified email.

### Phase 3: Remediation & Post-Mortem (Hour 6–72)
1. Deploy code fixes and execute regression testing.
2. File comprehensive post-incident analysis report with regulatory authorities.
