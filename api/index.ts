import serverBundle from '../dist-server/server.cjs';

// Extract the app from the ESM/CJS default wrapper
const app = (serverBundle as any).default || serverBundle;

export default app;
