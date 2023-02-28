import { Client } from "discord.js";
import WebSocket from "ws";

import { DualSet, Message, next_obfuscated_id } from "@botcomet/protocol";
import { Padlock } from "@botcomet/auth";

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

  // Padlocks used to verify plugins.
  private padlocks: Map<string, Padlock> = new Map();

  constructor() {
    this.client = new Client({
      intents: []
    });
  }

  // Starts the comet. This will connect to Discord and
  // the station.
  public async start(token: string) {
    this.client.on("ready", () => {
      console.log("Ready!");
      this.beginStationConnection();
    });

    this.client.on("messageCreate", async (message) => {
      const obfuscated_id = next_obfuscated_id();
      this.station_messages.Set(obfuscated_id, message.id);
      this.sendStationMessage({
        type: "message_create",
        dst: "STATION",
        src: "COMET",
        context: "CONTEXT",
        data: {
          id: obfuscated_id,
          content: message.content
        }
      });
    });

    this.client.login(token);
  }

  // Begins the connection to the station.
  private beginStationConnection() {
    this.station_conn = new WebSocket(STATION_ADDRESS);
    this.station_conn.on("open", () => {
      console.log("Connected to station!");
    });

    this.station_conn.on("close", () => {
      console.log("Disconnected from station!");
    });

    this.station_conn.on("message", (data) => {
      const message = JSON.parse(data.toString());
      this.evaluateStationMessage(message);
    });

    this.sendStationMessage({
      type: "comet_connect",
      dst: "STATION",
      src: "COMET",
      context: "CONTEXT",
      data: {}
    });
  }

  // Evaluates a message from the station.
  private evaluateStationMessage(message: Message) {
    console.log(message);
  }

  // Sends a message to the station.
  private sendStationMessage(message: Message) {
    this.station_conn?.send(JSON.stringify(message));
  }

  public async addPlugin(authority: string): Promise<boolean> {
    const padlock = new Padlock(authority);

    const challenge = Array.from({ length: 32 }, () => Math.random().toString(36).substring(2)).join("");
    let locked_challenge = await padlock.lock(challenge);

    // Get the verified test from the station
    // and verify it. If it's verified, then
    // we can add the plugin.

    // For now, we'll just assume it's verified.
    locked_challenge = challenge;
    const verified = await padlock.verify(locked_challenge);
    if (verified) {
      this.padlocks.set(authority, padlock);
      return true;
    }

    return false;
  }
}

export default Comet;
