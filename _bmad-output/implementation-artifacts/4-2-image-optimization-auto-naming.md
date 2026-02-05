# Story 4.2: Image Optimization & Auto-Naming

Status: ready-for-dev

## Story

As a Technician,
I want my photos to upload quickly and be named correctly,
So that the admin can find them easily and upload doesn't timeout.

## Acceptance Criteria

1. **Given** I attach a photo `IMG_999.jpg` to the "Kitchen Sink" field
2. **When** the form is saved
3. **Then** the client validates file size < 50MB and type is image/\* before upload attempt
4. **And** the image is resized to max 1920x1080 (client-side compression)
5. **And** renamed to `Kitchen_Sink_ProjectName_Date.jpg` before upload
6. **And** Metadata (GPS) is preserved if possible or extracted to separate field

## Tasks / Subtasks

- [ ] **Task 1: Project & Form Context Helpers**
  - [ ] Create utility to generate standardized filenames: `{FieldName}_{ProjectSlug}_{Timestamp}.jpg`
  - [ ] Ensure `useFormSubmission` has access to Project Name/Slug and Form Field Names.

- [ ] **Task 2: Client-Side Image Compression**
  - [ ] Install `browser-image-compression` or similar lightweight lib.
  - [ ] Create `ImageOptimizer` service/utility.
  - [ ] Implement `compress(file: File): Promise<File>` with max dimension 1920x1080 and 0.8 quality.

- [ ] **Task 3: Integration with Form Runner**
  - [ ] Update `FileField` component to intercept `onChange`.
  - [ ] Run compression and renaming immediately upon selection (providing UX feedback "Compressing...").
  - [ ] Store the optimized `File` object in React Hook Form state.

- [ ] **Task 4: Validation & Types**
  - [ ] Enforce 50MB limit (Pre-compression) and 5MB limit (Post-compression) ?
  - [ ] Validate MIME types `image/jpeg`, `image/png`, `image/webp`.

- [ ] **Task 5: Verification**
  - [ ] Test with large (10MB+) image.
  - [ ] Verify output dimensions and file size.
  - [ ] Verify filename format in Console/Network tab.

## Dev Notes

- **Library**: `browser-image-compression` is a solid choice for client-side work.
- **Renaming**: `File` objects are immutable. Need to create new `File` instance with new name.
- **Context**: The `FileField` might need extra props to know the "Project Name" for standard naming. Or efficient way to lookup. For now, maybe just "ProjectSlug" from URL?
- **Sync**: This complements Story 4.1. The queue will store the _optimized_ blobs, saving IndexedDB space.

## References

- [FR2.5] Image Optimization
- [FR1.5] Auto-naming files
