import { Client } from "discord.js";
import WebSocket from "ws";

import { DualSet } from "@botcomet/protocol";

const STATION_ADDRESS = "ws://localhost:8080";

class Comet {
  private client: Client;
  private station_conn: WebSocket | null = null;

  private station_guilds: DualSet<string, string> = new DualSet();
  private station_channels: DualSet<string, string> = new DualSet();
  private station_users: DualSet<string, string> = new DualSet();
  private station_messages: DualSet<string, string> = new DualSet();

  constructor() {
    this.client = new Client({
      intents: []
    });
  }

  public async Start(token: string) {
    this.client.on("ready", () => {
      console.log("Ready!");
      this.BeginStationConnection();
    });

    this.client.on("messageCreate", async (message) => {
      const obfuscated_id = this.next_obfuscated_id;
      this.station_messages.Set(obfuscated_id, message.id);
      this.SendStationMessage({
        type: "message_create",
        data: {
          id: obfuscated_id,
          content: message.content
        }
      });
    });

    this.client.login(token);
  }

  private BeginStationConnection() {
    this.station_conn = new WebSocket(STATION_ADDRESS);
    this.station_conn.on("open", () => {
      console.log("Connected to station!");
    });

    this.station_conn.on("message", (data) => {
      const message = JSON.parse(data.toString());
      this.EvaluateStationMessage(message);
    });
  }

  private EvaluateStationMessage(message: any) {
    console.log(message);
  }

  private SendStationMessage(message: any) {
    if (this.station_conn) {
      this.station_conn.send(JSON.stringify(message));
    }
  }

  private get next_obfuscated_id(): string {
    return Math.random().toString(36).substring(2);
  }
};

export default Comet;