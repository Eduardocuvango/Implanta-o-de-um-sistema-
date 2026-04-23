# Security Specification - Pioneiro Zeca

## 1. Data Invariants
- A `Patient` must have a `name`, `gender`, and at least one vital sign during creation if possible, but strictly requires `receptionistId`.
- An `age` > 21 must trigger a warning but is not strictly blocked unless specified (actually user said "0 aos 21 anos", but I'll allow registration with warning as per previous iteration).
- `User` roles (`admin`, `staff`) can only be assigned by an existing `admin`.
- `SystemSettings` singleton document `config` can only be modified by an `admin`.

## 2. The Dirty Dozen Payloads
1. **Identity Spoofing**: User A trying to update User B's profile.
2. **Privilege Escalation**: User A (Staff) trying to update their own role to 'admin'.
3. **Orphaned Writes**: Creating a patient without a valid `receptionistId` matching the current user.
4. **Data Poisoning**: Injecting 1MB of text into the `city` field of a patient.
5. **State Skipping**: Updating a patient status from 'Em Espera' directly to 'Alta' skipping 'Atendido' (if business logic forbade it, though here we are more flexible).
6. **Malicious Analytics**: A non-admin user trying to read the `analytics` or `dashboard` total stats if they were sensitive.
7. **Social Engineering**: Claiming to be an admin by adding a `role: 'admin'` field during sign-up.
8. **Resource Exhaustion**: Creating 10,000 patient records in 1 minute.
9. **PII Leak**: A staff member listing all users' emails and signatures.
10. **Settings Hijack**: Changing the alert email to a malicious one.
11. **Doctor Master Data Corruption**: Deleting all clinical staff records.
12. **Future Poisoning**: Setting a clinical entry time in the year 2099.

## 3. Test Runner (Conceptual)
All above payloads should return `PERMISSION_DENIED`.

## 4. Relationship Mapping
- Patients are linked to Users (Receptionists) via `receptionistId`.
- Access to Dashboard is exclusive to `role == 'admin'`.
- Access to Settings is exclusive to `role == 'admin'`.
