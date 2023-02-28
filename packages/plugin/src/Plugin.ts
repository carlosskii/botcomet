import WebSocket from "ws";

import {
  Message,
  Context, ContextCache,
  next_obfuscated_id
} from "@botcomet/protocol";
import { Certificate } from "@botcomet/auth";

const STATION_ADDRESS = "ws://localhost:8080";

class Plugin {
  private client_id = "";
  private message_context: ContextCache = new Map();

  private station_conn: WebSocket | null = null;
  private certificate: Certificate | null = null;

  public Start() {
    this.station_conn = new WebSocket(STATION_ADDRESS);
    this.station_conn.on("open", this.onOpen);
    this.station_conn.on("message", (data) => this.onMessage(JSON.parse(data.toString())));
  }

  public loadCertificate(rsa_private: string) {
    this.certificate = new Certificate(rsa_private);
  }

  private onOpen() {
    const context_id = next_obfuscated_id();
    this.message_context.set(context_id, {
      type: "plugin_connect",
      data: {}
    });

    this.sendStationMessage({
      type: "plugin_connect",
      dst: "STATION",
      src: "CONNECTION",
      context: context_id,
      data: {}
    });
  }

  private onMessage(data: Message) {
    switch (data.type) {

    case "plugin_verify": {
      if (!this.certificate) {
        console.error("No certificate loaded!");
        return;
      }

      let challenge: string = data.data.challenge;
      challenge = this.certificate.unlock(challenge);

      this.sendStationMessage({
        type: "plugin_verify_response",
        dst: "STATION",
        src: "PLUGIN",
        context: "CONTEXT",
        data: { challenge }
      });
    } break;

    case "plugin_connect_response": {
      if (!this.message_context.has(data.context)) {
        console.error("Plugin connect response context not found!");
        return;
      }

      const context = this.message_context.get(data.context)!;
      if (context.type !== "plugin_connect") {
        console.error("Plugin connect response context type mismatch!");
        return;
      }

      this.message_context.delete(data.context);
      this.client_id = data.data.client_id;
    } break;

    default:
      console.error("Unknown message type: " + data.type);

    }
  }

  private sendStationMessage(msg: Message) {
    this.station_conn?.send(JSON.stringify(msg));
  }

}

export default Plugin;
