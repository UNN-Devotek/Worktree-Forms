# Worktree Remotion Video

This directory contains the code for the Worktree promotional video.

## Setup

1.  Ensure you have `remotion`, `@remotion/react`, and `@remotion/player` installed in `apps/frontend`.
    ```bash
    npm install remotion @remotion/react @remotion/player --legacy-peer-deps
    ```

## Running the Preview

To preview the video using Remotion Studio:

1.  Add this script to `apps/frontend/package.json`:
    ```json
    "scripts": {
      "remotion:studio": "remotion studio remotion/index.ts"
    }
    ```
2.  Run `npm run remotion:studio`.

## Embedding in the App

You can embed the video using the `<Player />` component:

```tsx
import { Player } from '@remotion/player';
import { PromoVideo } from '../remotion/PromoVideo';

export const LandingPageVideo = () => {
  return (
    <Player
      component={PromoVideo}
      durationInFrames={150}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      controls
      style={{
        width: '100%',
        aspectRatio: '16/9',
      }}
    />
  );
};
```
