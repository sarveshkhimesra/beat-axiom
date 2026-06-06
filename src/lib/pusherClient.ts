"use client";

import PusherClient from "pusher-js";
import { PUSHER_CHANNEL } from "./types";

let client: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (client) return client;
  client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });
  return client;
}

export function subscribeGame() {
  return getPusherClient().subscribe(PUSHER_CHANNEL);
}

// The underlying connection — used to re-sync state when the socket reconnects
// (e.g., a projector tab that was throttled in the background regains focus).
export function getPusherConnection() {
  return getPusherClient().connection;
}
