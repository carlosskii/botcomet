import WebSocket from "ws";

import { Message } from "@botcomet/protocol";
import { Certificate } from "@botcomet/auth";

const STATION_ADDRESS = "ws://localhost:8080";

class Plugin {
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
    this.sendStationMessage({
      type: "plugin_connect",
      destination: "STATION",
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
        destination: "STATION",
        data: { challenge }
      });

      break;
    }
    default:
      console.error("Unknown message type: " + data.type);

    }
  }

  private sendStationMessage(msg: Message) {
    this.station_conn?.send(JSON.stringify(msg));
  }

}

export default Plugin;
