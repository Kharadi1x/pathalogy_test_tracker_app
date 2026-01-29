# API Endpoints (Initial)

Auth
- POST /api/auth/register { email, name, password, role }
- POST /api/auth/login { email, password } -> { token }
- GET /api/auth/me -> current user (Authorization header)

Upload / OCR
- POST /api/upload (multipart/form-data) fields: file?, patientName, testName, testType, result, referenceRange, dateOfTest
- POST /api/ocr/extract (multipart/form-data) -> { text }

Patients
- GET /api/patients/:id -> patient info (masked name)
- GET /api/patients/:id/tests -> list of tests (admin or owner)
- POST /api/patients/:id/reveal -> reveal decrypted name (admin or owner)

Protected endpoints require `Authorization: Bearer <token>` header.
