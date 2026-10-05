# Security Specification & Threat Model

## 1. Data Invariants
1. **User Identity Isolation**: All documents under `/users/{userId}` and its subcollections (`folders`, `photos`) belong exclusively to `userId`. An authenticated user `U1` cannot read, create, update, or delete any resource under `/users/{U2}` where `U1 != U2`.
2. **Immutable Identity & Creation**:
   - `UserProfile.id` must equal `request.auth.uid`.
   - `GalleryFolder.userId` and `GalleryPhoto.userId` must strictly equal `request.auth.uid`.
   - `createdAt` is immutable upon updates.
3. **Temporal Integrity**: `createdAt` must match `request.time` upon creation, and `updatedAt` must match `request.time` on updates.
4. **Finite Resource Bounds**:
   - Photo titles are restricted to <= 100 characters.
   - Folder names are restricted to <= 50 characters.
   - Tags are arrays of strings capped at <= 10 items.
   - Images stored are bounded in length to prevent memory and storage abuse.
5. **No Orphaned Resources**: Subcollection resources must have valid alphanumeric IDs conforming to `isValidId`.

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Read of User Profile**: Anonymous or null auth requesting `/users/user_abc` -> `PERMISSION_DENIED`.
2. **Cross-User Profile Read**: Auth user `user_attacker` reading `/users/user_victim` -> `PERMISSION_DENIED`.
3. **Cross-User Profile Write**: Auth user `user_attacker` writing `/users/user_victim` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Creating a profile with `{ ...validFields, isAdmin: true }` -> `PERMISSION_DENIED`.
5. **Owner ID Spoofing in Folder**: Auth user `user_1` creating `/users/user_1/folders/f1` with `{ userId: 'user_2' }` -> `PERMISSION_DENIED`.
6. **Cross-User Folder Reading**: Auth user `user_1` listing `/users/user_2/folders` -> `PERMISSION_DENIED`.
7. **Cross-User Photo Creation**: Auth user `user_1` creating photo in `/users/user_2/photos/p1` -> `PERMISSION_DENIED`.
8. **Cross-User Photo Deletion**: Auth user `user_1` calling delete on `/users/user_2/photos/p1` -> `PERMISSION_DENIED`.
9. **Unbounded Array Injection**: Writing a photo with 50 tags -> `PERMISSION_DENIED`.
10. **Oversized String Attack**: Submitting a photo title of 5,000 characters -> `PERMISSION_DENIED`.
11. **Client Fake Timestamp**: Creating a photo with `createdAt = 0` instead of `request.time` -> `PERMISSION_DENIED`.
12. **Modifying Immutable Fields**: Updating a photo attempting to alter `createdAt` or `userId` -> `PERMISSION_DENIED`.
