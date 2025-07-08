export type RoomState = "waiting" | "playing" | "ended";

export interface GameEvent {
  type: "draw" | "guess" | "join";
  payload: any;
}
