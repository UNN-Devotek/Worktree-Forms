---
description: Restarts the Worktree project using docker compose with watch mode
---

1. Stop any running containers
   // turbo

```bash
docker compose down
```

2. Start the project with file watching enabled
   // turbo

```bash
docker compose up --watch
```

3. Wait for the Frontend to be ready at http://localhost:3005
