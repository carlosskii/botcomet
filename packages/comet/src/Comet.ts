import { Client } from "discord.js";
import WebSocket from "ws";

import { DualSet, Message, next_obfuscated_id } from "@botcomet/protocol";

const STATION_ADDRESS = "ws://localhost:8080";

class Comet {
  private client: Client;
  private station_conn: WebSocket | null = null;

  // Sets of obfuscated IDs. Only the comet knows what
  // the real IDs are.
  private station_guilds: DualSet<string, string> = new DualSet();
  private station_channels: DualSet<string, string> = new DualSet();
  private station_users: DualSet<string, string> = new DualSet();
  private station_messages: DualSet<string, string> = new DualSet();

  constructor() {
    this.client = new Client({
      intents: []
    });
  }

  // Starts the comet. This will connect to Discord and
  // the station.
  public async Start(token: string) {
    this.client.on("ready", () => {
      console.log("Ready!");
      this.BeginStationConnection();
    });

    this.client.on("messageCreate", async (message) => {
      const obfuscated_id = next_obfuscated_id();
      this.station_messages.Set(obfuscated_id, message.id);
      this.SendStationMessage({
        type: "message_create",
        destination: "STATION",
        data: {
          id: obfuscated_id,
          content: message.content
        }
      });
    });

    this.client.login(token);
  }

  // Begins the connection to the station.
  private BeginStationConnection() {
    this.station_conn = new WebSocket(STATION_ADDRESS);
    this.station_conn.on("open", () => {
      console.log("Connected to station!");
    });

    this.station_conn.on("close", () => {
      console.log("Disconnected from station!");
    });

    this.station_conn.on("message", (data) => {
      const message = JSON.parse(data.toString());
      this.EvaluateStationMessage(message);
    });

    this.SendStationMessage({
      type: "comet_connect",
      destination: "STATION",
      data: {}
    });
  }

  // Evaluates a message from the station.
  private EvaluateStationMessage(message: Message) {
    console.log(message);
  }

  // Sends a message to the station.
  private SendStationMessage(message: Message) {
    if (this.station_conn) {
      this.station_conn.send(JSON.stringify(message));
    }
  }
}

export default Comet;
