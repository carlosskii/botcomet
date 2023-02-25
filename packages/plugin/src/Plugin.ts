import WebSocket from "ws";

import { Message } from "@botcomet/protocol";

const STATION_ADDRESS = "ws://localhost:8080";

class Plugin {
  private station_conn: WebSocket | null = null;

  public Start() {
    this.station_conn = new WebSocket(STATION_ADDRESS);
    this.station_conn.on("open", this.onOpen);
    this.station_conn.on("message", this.onMessage);
  }

  private onOpen() {
    this.SendStationMessage({
      type: "plugin_connect",
      destination: "STATION",
      data: {}
    });
  }

  private onMessage(data: WebSocket.Data) {
    // Not implemented
  }

  private SendStationMessage(msg: Message) {
    this.station_conn?.send(JSON.stringify(msg));
  }

}

export default Plugin;
