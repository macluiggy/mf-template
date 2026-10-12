import { initFederation } from '@angular-architects/native-federation';

// Standalone entry point. When the host mounts this remote, it loads the
// exposed module directly and never executes this file.
initFederation({}, { sse: false })
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
