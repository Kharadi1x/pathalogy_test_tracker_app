# Initial Backlog & Prioritization

Priority: P0 = must-have for MVP; P1 = important; P2 = nice-to-have

P0 - Ingestion & Storage
- Implement file upload endpoint with OCR pipeline (backend + OCR service) ✅ (stubbed)
- Store extracted structured tests: Test name, result, reference range, date, linked to Patient (encrypted name)
- Patient history page + charts (frontend) ✅ (starter page)
- Authentication + role-based access (Admin vs Patient) ✅ (basic register/login + middleware implemented)
- Field-level encryption (AES-256), masked patient name with timed reveal ✅ (helpers + reveal API implemented)

P1 - Security & Compliance
- 2FA (TOTP) and Google OAuth stub
- Audit logs for uploads/edits ✅ (audit entries created by worker)
- Secure key management (GCP Secret Manager or Vault)
- Add e2e tests and attack surface review

P0 - Background processing
- Add background worker (BullMQ) to process uploaded files and call OCR ✅ (worker stub added)
- Add job status endpoint `/api/jobs/:id` ✅

P2 - UX & Scale
- Notifications (email/SMS), export (PDF/CSV)
- Advanced search & filters, performance optimizations
- Cloud deployment (GCP), monitoring and backups

---

To convert backlog items into issues: use `gh issue create` or add them to project board.