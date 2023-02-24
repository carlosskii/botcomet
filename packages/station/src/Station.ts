import WebSocket, { WebSocketServer } from "ws";

import { Message, DualSet } from "@botcomet/protocol";


class Station {
  private readonly wss: WebSocketServer;

  private comets: DualSet<WebSocket, string> = new DualSet();
  private plugins: DualSet<WebSocket, string> = new DualSet();

  constructor() {
    this.wss = new WebSocketServer({ port: 8080 });
    this.wss.on("connection", this.onConnection);
  }

  private onConnection(ws: WebSocket) {
    ws.on("message", (message: string) => {
      this.onMessage(message, ws);
    });
  }

  private onMessage(message: string, ws: WebSocket) {
    const msg: Message = JSON.parse(message);
    switch (msg.type) {
    case "comet_connect":
      this.comets.Set(ws, "comet");
      break;
    case "plugin_connect":
      this.plugins.Set(ws, "plugin");
      break;
    default:
      // Error
      break;
    }
  }
}

export default Station;
