import { Client } from "discord.js";
import WebSocket from "ws";
import { EventEmitter, once } from "events";

import {
  DualSet, Message,
  ContextCache,
  next_obfuscated_id
} from "@botcomet/protocol";
import { Padlock } from "@botcomet/auth";

// TODO: Remove this, set the address in the config file.
const STATION_ADDRESS = "ws://localhost:8080";


/**
 * The comet is the main class for a Discord bot. It
 * connects to Discord and the station, and handles
 * all communication between the two. Stations are
 * responsible for handling all communication with
 * plugins.
 */
class Comet {
  // The Discord client
  private client: Client;
  // The client ID from the station
  private client_id = "";
  private station_conn: WebSocket | null = null;

  // EventEmitter for BotComet communication
  private eventAsyncer = new EventEmitter();

  // Sets of obfuscated IDs. Only the comet knows what
  // the real IDs are.
  private station_guilds: DualSet<string, string> = new DualSet();
  private station_channels: DualSet<string, string> = new DualSet();
  private station_users: DualSet<string, string> = new DualSet();
  private station_messages: DualSet<string, string> = new DualSet();

  // The context cache for messages. This holds persistent
  // data between messages, and is used to relate messages
  // to one another.
  private message_context: ContextCache = new Map();

  // Padlocks used to verify plugins. The key is the
  // plugin address, and the value is the padlock used
  // to verify the plugin.
  private padlocks: Map<string, Padlock> = new Map();

  constructor() {
    // TODO: Add Discord client configuration, possibly from a config file.
    this.client = new Client({
      intents: []
    });
  }

  /**
   * Starts the comet. This will connect to Discord and
   * the station, and begin listening for messages on
   * both.
   * @param token The Discord bot token
   */
  public async start(token: string) {
    if (this.client_id == "") throw new Error("Client ID is not negotiated! You must complete beginStationConnection() before calling start().");

    this.client.on("ready", () => {
      console.log("[COMET] Discord client ready");
    });

    // Example event handler. This will send a message
    // to the station when a message is sent in a guild
    // channel.
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

  /**
   * Connects to the station. This will open a websocket
   * connection, and send a comet_connect message to
   * the station. The station will respond with a
   * comet_connect_response message, which will contain
   * the client ID.
   */
  public beginStationConnection() {
    this.station_conn = new WebSocket(STATION_ADDRESS);
    this.station_conn.on("open", () => {
      console.log("[COMET] Opened station WebSocket");

      // Send a comet_connect message to the station.
      const context_id = next_obfuscated_id();
      this.message_context.set(context_id, {
        type: "comet_connect",
        data: {}
      });

      console.log("[COMET] Requesting station ID...");
      this.sendStationMessage({
        type: "comet_connect",
        dst: "STATION",
        src: "CONNECTION",
        context: context_id,
        data: {}
      });
    });

    // TODO: Add error handling/comet shutdown.
    this.station_conn.on("close", () => {
      console.log("[COMET] Disconnected from station");
    });

    this.station_conn.on("message", (data) => {
      const message = JSON.parse(data.toString());
      this.evaluateStationMessage(message);
    });
  }

  private evaluateStationMessage(message: Message) {
    switch (message.type) {

    case "comet_connect_response": {
      // Check that the context is valid.
      if (!this.message_context.has(message.context)) {
        console.error("[COMET] Connect response context not found!");
        return;
      }

      // Check that the context is correct.
      const context = this.message_context.get(message.context)!;
      if (context.type !== "comet_connect") {
        console.error("[COMET] Connect response context type mismatch!");
        return;
      }

      // Save the client ID (it's stored in the destination field)
      this.message_context.delete(message.context);
      this.client_id = message.dst;

      console.log("[COMET] Station ID received!");
    } break;

    case "plugin_verify_response": {
      // Did I request this plugin?
      if (!this.message_context.has(message.context)) {
        console.error("[COMET] Plugin verify response context not found!");
        return;
      }

      // Is the context correct?
      const context = this.message_context.get(message.context)!;
      if (context.type !== "plugin_verify") {
        console.error("[COMET] Plugin verify response context type mismatch!");
        return;
      }

      // Emit an event to indicate a plugin response
      this.eventAsyncer.emit(`plugin_verify_response_${message.context}`, message);
    } break;

    }
  }

  private sendStationMessage(message: Message) {
    if (!this.station_conn) {
      // The station connection should always be open
      // if this function is called.
      throw new Error("[COMET] Station connection not open! [IMPOSSIBLE ERROR]");
    }

    this.station_conn?.send(JSON.stringify(message));
  }

  /**
   * Add a plugin using its public key. This will send
   * a plugin_verify message to the station, which will
   * be forwarded to the plugin. The plugin will respond
   * with a plugin_verify_response message, which will
   * contain a challenge response. The challenge response
   * will be verified, and if it is correct, the plugin
   * will be added to the comet.
   * @param publicKey The public key of the plugin
   * @returns True if the plugin was added successfully
   */
  public async addPlugin(publicKey: string): Promise<boolean> {
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
      dst: `${address}`,
      src: this.client_id,
      context: context_id,
      data: {
        challenge: challenge_locked
      }
    });

    // Wait for the plugin to respond.
    const [response] = await once(this.eventAsyncer, `plugin_verify_response_${context_id}`) as [Message];
    if (padlock.verify(response.data.challenge)) {
      console.log("[COMET] Plugin verified!");
    } else {
      console.error("[COMET] Plugin verification failed!");
      return false;
    }

    this.padlocks.set(address, padlock);
    return true;
  }

  public get has_station_connection(): boolean {
    return this.client_id !== "";
  }
}

export default Comet;
