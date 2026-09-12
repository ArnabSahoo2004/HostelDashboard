import PocketBase from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_PB_URL ?? 'http://127.0.0.1:8090');

// Disable auto cancellation to prevent request cancellation on fast re-renders
pb.autoCancellation(false);

export default pb;
