import Pusher from "pusher";
import { PUSHER_CHANNEL } from "./types";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export type PusherEvent =
  | "game:updated"
  | "game:stage-start"
  | "game:stage-evaluating"
  | "game:stage-end"
  | "team:avatar-response";

export async function broadcast<T>(event: PusherEvent, payload: T) {
  await pusherServer.trigger(PUSHER_CHANNEL, event, payload);
}
