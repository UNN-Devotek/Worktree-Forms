# Story 4.3: Signature Capture

Status: ready-for-dev

## Story

As a Technician,
I want to sign forms on the touchscreen,
So that I can get customer validation.

## Acceptance Criteria

1. **Given** I am on a Signature Field
2. **When** I sign with my finger (or mouse)
3. **Then** the signature creates a vector/image path
4. **And** is saved as an image attachment (blob) to the submission
5. **And** I can clear the signature if I make a mistake
6. **And** it is testable via a "mouse drag simulation" in Playwright

## Tasks / Subtasks

- [ ] **Task 1: Dependencies & Research**
  - [ ] Install `react-signature-canvas` (or similar standard lib).
  - [ ] Research converting canvas to Blob for `FileField` compatibility.

- [ ] **Task 2: Signature Component**
  - [ ] Create `SignaturePad` UI component.
  - [ ] Controls: Clear, Save (implicit or explicit?).
  - [ ] Responsive sizing (full width of container).

- [ ] **Task 3: Integration with Form Runner**
  - [ ] Create `SignatureField` (wrapper for `FormField`).
  - [ ] Integrate into `FieldFactory`.
  - [ ] Implementation: Under the hood, this should probably produce a `File` object so it reuses the upload logic from Story 4.1/4.2.

- [ ] **Task 4: Data Handling**
  - [ ] Convert `toDataURL()` or `toBlob()` to a `File`.
  - [ ] Name it `Signature_{Field}_{Timestamp}.png`.
  - [ ] Feed it into the `useFormUpload` flow so it syncs like any other image.

- [ ] **Task 5: Verification**
  - [ ] Verified manually by drawing.
  - [ ] Verified uploading matches file upload behavior.

## Dev Notes

- **Reusability**: Treat the signature exactly like a file upload. The backend doesn't need to know it's a signature, just a PNG file.
- **Library**: `react-signature-canvas` is the standard React wrapper for `signature_pad`.
- **Styling**: Needs to look good in Dark Mode (white ink on dark background?) or standard "Paper" look (black ink on white box). Standard paper look is usually safer for legal.

## References

- [FR2.6] Touchscreen capture
