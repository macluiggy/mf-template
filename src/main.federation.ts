import { initFederation } from '@angular-architects/native-federation';

// Federation entry point, used only by the `federation` build configuration
// (`bun run build:federation` / `bun run start:federation`). When the host
// mounts this remote, it loads the exposed module directly and never executes
// this file.
initFederation({}, { sse: false })
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
