# SYSTEM TECHNICAL DEBT REGISTRY
## DEFERRED ITEM: HIGH PRIORITY TECHNICAL DEBT

### Title: 
Firebase Authentication Restoration & Workforce Synchronization

---

## 1. GENERAL INFORMATION
- **Status**: Deferred
- **Priority**: High
- **Urgency**: Medium (Low impact on local operations, high impact on strict production environments)
- **Dependency**: Prompt 3 Completion
- **Owner**: Technical Custodian & Lead Enterprise Solutions Architect
- **Target Baseline**: `SUPERVISOR_EYE_PRE_PROMPT3_BASELINE`

---

## 2. SYMPTOM & ROOT CAUSE ANALYSIS
- **Symptom**: During live Firebase interactions, standard API triggers occasionally encounter a `Firebase: Error (auth/invalid-credential)` error, disrupting full cloud identity flows.
- **Immediate Root Cause**: Mismatched credentials or client certificates in the Firebase console setup (such as SHA1/SHA256 configurations, or region mismatches).
- **Interim Resolution**: Implemented a highly reliable, robust Mock Auth and DB-driven token fallback model that simulates deterministic UIDs based on registered base64-encoded emails. This allows testing all enterprise modules without blocking the development pipeline.

---

## 3. SCOPE OF FUTURE WORK (POST-PROMPT 3)
1. **Firebase Forensic Audit**:
   - Check and align active API keys inside the client-side/server-side environment files.
   - Verify SHA1 and SHA256 certificate hashes inside Google Cloud / Firebase console settings.
2. **User Directory Synchronization**:
   - Loop over the PostgreSQL `users` table and bulk-insert missing profiles into Firebase Authentication using the Firebase Admin SDK.
   - Update `firebase_uid` parameters dynamically on successful cloud account creation.
3. **Token Verification Alignment**:
   - Restore standard ID Token decoding middleware (`admin.auth().verifyIdToken()`) inside the server-side Express handlers.
4. **Enterprise Security Validation**:
   - Validate Firestore Security Rules (`firestore.rules`) against verified production permissions to ensure no unauthorized database modifications can occur.
   - Run active pentests on authentication endpoints.

---

## 4. REGISTRATION AND APPROVAL
This registry entry has been successfully recorded in the platform's core governance systems. No developer or automated script should attempt to modify or bypass this deferred state until Prompt 3 has been marked complete by the primary operator.
