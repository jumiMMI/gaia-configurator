import PartySocket from "partysocket";

export function createPartyClient(room: string, host: string) {
  return new PartySocket({
    host,
    room,
  });
}
