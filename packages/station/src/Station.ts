import WebSocket, { WebSocketServer } from "ws";

import { Message, DualSet, next_obfuscated_id } from "@botcomet/protocol";


class Station {
  private readonly wss: WebSocketServer;

  // Obfuscated IDs for the comets and plugins. No
  // real IDs exist, but messages need a destination
  // for routing.
  private comets: DualSet<WebSocket, string> = new DualSet();
  private plugins: DualSet<WebSocket, string> = new DualSet();

  constructor() {
    this.wss = new WebSocketServer({ port: 8080 });
    this.wss.on("connection", this.onConnection);
  }

  // Handles a new connection.
  private onConnection(ws: WebSocket) {
    ws.on("message", (message: string) => {
      this.onMessage(message, ws);
    });

    ws.on("close", () => {
      if (this.comets.HasFirst(ws)) {
        this.comets.DeleteFirst(ws);
      } else if (this.plugins.HasFirst(ws)) {
        this.plugins.DeleteFirst(ws);
      }
    });
  }

  // Handles a message from a comet or plugin.
  private onMessage(message: string, ws: WebSocket) {
    const msg: Message = JSON.parse(message);
    switch (msg.type) {

    case "comet_connect": {
      const comet_id = next_obfuscated_id();
      this.comets.Set(ws, comet_id);
      ws.send(JSON.stringify({
        type: "comet_connect_response",
        dst: comet_id,
        src: "STATION",
        context: msg.context,
        data: {}
      }));
    } break;

    case "plugin_connect": {
      const plugin_id = next_obfuscated_id();
      this.plugins.Set(ws, plugin_id);
      ws.send(JSON.stringify({
        type: "plugin_connect_response",
        dst: plugin_id,
        src: "STATION",
        context: msg.context,
        data: {}
      }));
    } break;

    default:
      // Error
      break;
    }
  }
}

export default Station;
