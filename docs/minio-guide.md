# MinIO Image Upload and Serving Guide

This guide documents the current implementation of image uploads and serving using MinIO (or S3-compatible storage) in the Worktree-Forms application.

## 1. Overview

The system uses a **direct upload to backend -> stream to MinIO** approach, coupled with a **proxy/redirect** mechanism for serving files. This ensures:

- Secure file handling (authenticated uploads).
- Centralized file tracking in the database (`FileUpload` table).
- Support for private buckets (via presigned URLs for viewing).

## 2. Configuration

### Backend Setup

- **Storage Service**: `apps/backend/src/services/storage.ts` manages the MinIO client.
- **Initialization**: On server start (`apps/backend/src/index.ts`), `StorageService.ensureBucket()` is called to verify or create the bucket.
- **Multer**: Configured with `memoryStorage()` to hold files briefly in memory before streaming to MinIO. Limit is set to **20MB**.

## 3. Upload Flow

### Frontend (`ImageUploadField.tsx`)

1.  User selects a file.
2.  Frontend sends a `POST` request to `/api/groups/:groupId/forms/:formId/upload`.
3.  Payload is `multipart/form-data` with a `file` field.

### Backend (`upload.service.ts`)

1.  **Endpoint**: `POST /api/groups/:groupId/forms/:formId/upload`
2.  **Handling**:
    - Receives file via `multer` middleware.
    - Generates a unique filename using UUID: `${uuid}.${ext}`.
    - Key format: `form_uploads/${uuid}.${ext}`.
    - Streams file to MinIO.
    - Creates a record in the `FileUpload` database table.
3.  **Response**:
    Returns a JSON object with snake_case keys (matching frontend expectations):
    ```json
    {
      "success": true,
      "data": {
        "files": [
          {
            "filename": "original_name.jpg",
            "object_key": "form_uploads/uuid-123.jpg",
            "url": "http://localhost:5005/api/images/form_uploads/uuid-123.jpg",
            "size": 1024,
            "content_type": "image/jpeg"
          }
        ]
      }
    }
    ```

## 4. Serving Flow

Images are _not_ accessed directly from MinIO's public URL. Instead, they are routed through the backend to handle authentication/presigning.

### Frontend

Constructs the URL dynamically using the `object_key`:

```javascript
const url = `${API_BASE}/api/images/${objectKey}`;
```

### Backend (`index.ts`)

1.  **Endpoint**: `GET /api/images/:key(*)` (Wildcard captures deep paths).
2.  **Logic**:
    - Extracts `key` from URL.
    - Calls `StorageService.getDownloadUrl(key)` to generate a **Presigned URL** valid for a limited time.
    - Redirects (`res.redirect(url)`) the browser to this presigned MinIO URL.

## 5. Database Schema

Files are tracked in the `FileUpload` table in Prisma:

- `id`: UUID
- `objectKey`: Unique path in MinIO.
- `filename`: Original filename.
- `contentType`: MIME type.
- `submissionId`: (Optional) Links file to a specific form submission.

## 6. Cleanup

A cleanup script is available to wipe data during development:

- **Script**: `apps/backend/src/cleanup.ts`
- **Usage**: Deletes all files from MinIO bucket and clears related database tables.

## 7. Key Files

- `apps/backend/src/services/upload.service.ts`: Core upload logic.
- `apps/backend/src/index.ts`: Route definitions.
- `apps/frontend/components/form-builder/properties/editors/ImageUploadField.tsx`: Frontend component.
