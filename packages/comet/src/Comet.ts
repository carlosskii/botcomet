import { Client } from "discord.js";
import WebSocket from "ws";

import {
  DualSet, Message,
  ContextCache,
  next_obfuscated_id
} from "@botcomet/protocol";
import { Padlock } from "@botcomet/auth";

const STATION_ADDRESS = "ws://localhost:8080";

class Comet {
  private client: Client;
  private client_id = "";
  private station_conn: WebSocket | null = null;

  // Sets of obfuscated IDs. Only the comet knows what
  // the real IDs are.
  private station_guilds: DualSet<string, string> = new DualSet();
  private station_channels: DualSet<string, string> = new DualSet();
  private station_users: DualSet<string, string> = new DualSet();
  private station_messages: DualSet<string, string> = new DualSet();

  private message_context: ContextCache = new Map();

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
        src: this.client_id,
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

    const context_id = next_obfuscated_id();
    this.message_context.set(context_id, {
      type: "comet_connect",
      data: {}
    });

    this.sendStationMessage({
      type: "comet_connect",
      dst: "STATION",
      src: "CONNECTION",
      context: context_id,
      data: {}
    });
  }

  // Evaluates a message from the station.
  private evaluateStationMessage(message: Message) {
    switch (message.type) {

    case "comet_connect_response": {
      if (!this.message_context.has(message.context)) {
        console.error("Comet connect response context not found!");
        return;
      }

      const context = this.message_context.get(message.context)!;
      if (context.type !== "comet_connect") {
        console.error("Comet connect response context type mismatch!");
        return;
      }

      this.message_context.delete(message.context);
      this.client_id = message.dst;
    } break;

    }
  }

  // Sends a message to the station.
  private sendStationMessage(message: Message) {
    this.station_conn?.send(JSON.stringify(message));
  }

  // TODO: Add full communication with the station.
  public addPlugin(publicKey: string): boolean {
    const padlock = new Padlock(publicKey);
    const address = padlock.address;

    const challenge: string = Array.from({ length: 32 }, () => Math.random().toString(36).substring(2)).join("");
    const challenge_locked = padlock.lock(challenge);

    const context_id = next_obfuscated_id();
    this.message_context.set(context_id, {
      type: "plugin_verify",
      data: { challenge }
    });

    this.sendStationMessage({
      type: "plugin_verify",
      dst: `PLUGIN:${address}`,
      src: this.client_id,
      context: context_id,
      data: {
        challenge: challenge_locked
      }
    });

    this.padlocks.set(address, padlock);
    return true;
  }
}

export default Comet;
