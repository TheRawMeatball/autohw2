// These JavaScript module imports need to be bundled:
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare global { interface Window { __WB_MANIFEST: any; } }

// Use the imported Workbox libraries to implement caching,
// routing, and other logic:
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(/\/api/, new NetworkFirst(), "GET");
