import WebSocket, { WebSocketServer } from "ws";

import { Message, DualSet, next_obfuscated_id } from "@botcomet/protocol";

/**
 * The station handles all traffic between comets
 * and plugins. It handles mesasge routing and
 * client ID assignment.
 */
class Station {
  private readonly wss: WebSocketServer;

  // Obfuscated IDs for the comets and plugins. No
  // real IDs exist, but messages need a destination
  // for routing.
  private comets: DualSet<WebSocket, string> = new DualSet();
  private plugins: DualSet<WebSocket, string> = new DualSet();
  private plugin_addresses: DualSet<string, string> = new DualSet();

  constructor() {
    // TODO: Make this configurable.
    this.wss = new WebSocketServer({ port: 8080 });
    this.wss.on("connection", this.onConnection.bind(this));
  }

  // Handles a new connection.
  private onConnection(ws: WebSocket) {
    console.log("[STATION] New connection");

    ws.on("message", (message: string) => {
      console.log("[STATION] Message received");
      this.onMessage.bind(this)(message, ws);
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
      console.log("[STATION] Comet connected, assigning ID");
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
      console.log("[STATION] Plugin connected, assigning ID");
      const plugin_id = next_obfuscated_id();

      this.plugins.Set(ws, plugin_id);
      this.plugin_addresses.Set(msg.data.address, plugin_id);

      ws.send(JSON.stringify({
        type: "plugin_connect_response",
        dst: plugin_id,
        src: "STATION",
        context: msg.context,
        data: {}
      }));
    } break;

    case "plugin_verify": {
      console.log("[STATION] Plugin verification request");
      if (!this.plugin_addresses.HasFirst(msg.dst)) {
        console.log("[STATION] Plugin not found");
        // TODO: Add error handling over socket.
        return;
      }

      const plugin_id = this.plugin_addresses.GetSecond(msg.dst)!;
      const plugin_ws = this.plugins.GetFirst(plugin_id);

      if (plugin_ws === undefined) {
        console.log("[STATION] Plugin not found");
        // TODO: Add error handling over socket.
        return;
      }

      plugin_ws.send(message);
    } break;

    case "plugin_verify_response": {
      console.log("[STATION] Plugin verification response");
      if (!this.comets.HasSecond(msg.dst)) {
        console.log("[STATION] Comet not found");
        // You know the drill, add error handling.
        return;
      }

      const comet_ws = this.comets.GetFirst(msg.dst);
      if (comet_ws === undefined) {
        console.log("[STATION] Comet not found");
        // You know the drill, add error handling.
        return;
      }

      comet_ws.send(message);
    } break;

    default:
      // Error
      break;
    }
  }
}

export default Station;
