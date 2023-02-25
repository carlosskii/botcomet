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
    case "comet_connect":
      this.comets.Set(ws, next_obfuscated_id());
      break;
    case "plugin_connect":
      this.plugins.Set(ws, next_obfuscated_id());
      break;
    default:
      // Error
      break;
    }
  }
}

export default Station;
