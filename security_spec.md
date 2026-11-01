# Security Specification - SIVYH San Francisco (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny & Verified Auth**: Every path outside explicit collections is denied (`allow read, write: if false;`). Write operations require an authenticated user with `email_verified == true` and `ownerId == request.auth.uid`.
2. **Path Variable Hardening**: Every single-document ID (`userId`, `productId`, `categoryId`, `supplierId`, `beneficiaryId`, `movementId`, `projectId`) must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.
3. **Strict Key & Size Validation**: Every entity helper (`isValidUser`, `isValidProduct`, `isValidCategory`, `isValidSupplier`, `isValidBeneficiary`, `isValidMovement`, `isValidProject`) validates exact allowed keys via `hasAll` and `hasOnly`, string `.size()` boundaries matching `firebase-blueprint.json`, numeric ranges, and `request.time` temporal integrity.
4. **Immutable Ownership & Timestamps**: `ownerId` and `createdAt` can never be mutated during `update`. `updatedAt` must equal `request.time`.
5. **PII Isolation & Query Enforcer**: `users`, `suppliers`, `beneficiaries`, `products`, `categories`, `movements`, and `projects` enforce `resource.data.ownerId == request.auth.uid || isAdmin()` on `get` and `list` so no blanket reads or client-delegated list queries exist.
6. **Privilege Escalation Prevention**: Users cannot self-assign `admin` role upon user creation unless they are the bootstrapped admin (`deposito.vyh@gmail.com` with `email_verified == true`) or already registered in `/admins/$(request.auth.uid)`.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection**: Adding `"isSuperAdmin": true` to `/products/{id}` -> Rejected by `data.keys().hasOnly(...)`.
2. **Owner Spoofing on Create**: Creating a product with `ownerId: "victim-uid"` -> Rejected by `data.ownerId == request.auth.uid`.
3. **Owner Mutation on Update**: Updating `ownerId` on an existing `/projects/{id}` -> Rejected by `incoming().ownerId == existing().ownerId`.
4. **Unverified Email Admin Spoof**: Token with `email == "deposito.vyh@gmail.com"` and `email_verified == false` -> Rejected by `request.auth.token.email_verified == true`.
5. **Self-Assigned Admin Escalation**: Regular user creating `/users/{uid}` with `role: "admin"` -> Rejected unless `isAdmin()`.
6. **Denial-of-Wallet 1MB String**: Creating `/categories/{id}` with `description` of 5,000 chars -> Rejected by `data.description.size() <= 300`.
7. **ID Poisoning Attack**: Writing to `/products/bad$id!@#` -> Rejected by `isValidId(productId)`.
8. **Timestamp Forgery on Create**: Sending past/future `createdAt` instead of `request.time` -> Rejected by `incoming().createdAt == request.time`.
9. **Immutable `createdAt` Tampering**: Modifying `createdAt` during an update -> Rejected by `incoming().createdAt == existing().createdAt`.
10. **Negative Stock Injection**: Setting `stock: -50` on `/products/{id}` -> Rejected by `data.stock >= 0`.
11. **Out-of-Bounds Project Progress**: Setting `physicalProgress: 150` on `/projects/{id}` -> Rejected by `data.physicalProgress >= 0 && data.physicalProgress <= 100`.
12. **Unauthorized Blanket List Scraping**: Querying `/beneficiaries` without `where('ownerId', '==', uid)` as non-admin -> Rejected by `allow list: if isSignedIn() && (resource.data.ownerId == request.auth.uid || isAdmin())`.
