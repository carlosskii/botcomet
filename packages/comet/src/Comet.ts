import WebSocket from "ws";
import { EventEmitter, once } from "events";

import {
  CometConnectMessage, CometConnectResponseMessage,
  PluginVerifyMessage, PluginVerifyResponseMessage,
  AdapterEventMessage, AdapterEventResponseMessage,
  ContextCache,
  next_obfuscated_id
} from "@botcomet/protocol";
import { Padlock } from "@botcomet/auth";
import { Adapter } from "@botcomet/adapter";

type ValidCometMessage = CometConnectResponseMessage | PluginVerifyResponseMessage | AdapterEventResponseMessage;
type ValidCometResponseMessage = CometConnectMessage | PluginVerifyMessage | AdapterEventMessage;


/**
 * The comet is the main class for a Discord bot. It
 * connects to the station, and handles
 * all communication with chat APIs using adapters.
 * Stations are responsible for handling all communication
 * with plugins.
 */
class Comet {
  // The client ID from the station
  private client_id = "";
  private station_conn: WebSocket | null = null;

  // The adapters
  private adapters: Map<string, Adapter> = new Map();
  private current_adapter: Adapter | null = null;

  // EventEmitter for BotComet communication
  private eventAsyncer = new EventEmitter();

  // The context cache for messages. This holds persistent
  // data between messages, and is used to relate messages
  // to one another.
  private message_context: ContextCache = new Map();

  // Padlocks used to verify plugins. The key is the
  // plugin address, and the value is the padlock used
  // to verify the plugin.
  private padlocks: Map<string, Padlock> = new Map();

  /**
   * Connects to the station. This will open a websocket
   * connection, and send a comet_connect message to
   * the station. The station will respond with a
   * comet_connect_response message, which will contain
   * the client ID.
   */
  public start(address: string) {
    this.station_conn = new WebSocket(address);
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
        dst: 0,
        src: 0,
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

  /**
   * Loads an adapter. This will add the adapter to the
   * list of adapters, and set the current adapter to
   * the one that was just added.
   * @param adapter The adapter to load
   * @param name The name of the adapter
   * @returns True if the adapter was loaded successfully
   */
  public loadAdapter(adapter: Adapter, name: string) {
    // Check if the adapter is already loaded
    if (this.adapters.has(name)) {
      console.error(`[COMET] Adapter ${name} is already loaded!`);
      return false;
    }

    // Add the adapter to the list of adapters
    this.adapters.set(name, adapter);

    if (this.current_adapter !== null) {
      this.current_adapter.events.removeListener("__comet_bubbleup", this.processAdapterEvent.bind(this));
      this.current_adapter.events.emit("__comet_bubbledown_disable");
    }

    // Set the current adapter to the one that was just added
    this.current_adapter = adapter;

    // Add adapter event listeners
    this.current_adapter.events.addListener("__comet_bubbleup", this.processAdapterEvent.bind(this));

    // Start the adapter
    this.current_adapter.events.emit("__comet_bubbledown_enable");

    return true;
  }

  private evaluateStationMessage(message: ValidCometMessage) {
    switch (message.type) {

    case "comet_connect_response":
      this._onCometConnectResponseMessage(message);
      break;
    case "plugin_verify_response":
      this._onPluginVerifyResponseMessage(message);
      break;
    case "adapter_event_response":
      this._onAdapterEventResponseMessage(message);
      break;
    }
  }

  private _onCometConnectResponseMessage(msg: CometConnectResponseMessage) {
    // TODO: Add error handling
    this.client_id = msg.dst;
  }

  private _onPluginVerifyResponseMessage(msg: PluginVerifyResponseMessage) {
    if (!this.message_context.has(msg.context)) {
      console.error("[COMET] Plugin verify response context not found!");
      return;
    }

    const context = this.message_context.get(msg.context)!;
    if (context.type !== "plugin_verify") {
      console.error("[COMET] Plugin verify response context type mismatch!");
      return;
    }

    this.eventAsyncer.emit(`plugin_verify_response_${msg.context}`, msg);
  }

  private _onAdapterEventResponseMessage(msg: AdapterEventResponseMessage) {
    this.current_adapter?.fire("__comet_bubbledown", msg);
  }

  private sendStationMessage(message: ValidCometResponseMessage) {
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
    const [response] = await once(this.eventAsyncer, `plugin_verify_response_${context_id}`) as [PluginVerifyResponseMessage];
    if (padlock.verify(response.data.challenge)) {
      console.log("[COMET] Plugin verified!");
    } else {
      console.error("[COMET] Plugin verification failed!");
      return false;
    }

    this.padlocks.set(address, padlock);
    return true;
  }

  private processAdapterEvent(message: AdapterEventMessage) {
    // Check for proper typing
    if (message.type != "adapter_event") {
      console.error("[COMET] Adapter event type mismatch!");
      return;
    }

    // Check for proper source
    if (message.src != "ADAPTER" || message.dst != "COMET") {
      console.error("[COMET] Adapter event source mismatch!");
      return;
    }

    // Modify message accordingly
    // TODO: Add proper plugin selection
    const new_message: AdapterEventMessage = {
      type: "adapter_event",
      dst: "",
      src: this.client_id,
      context: message.context,
      data: message.data
    };

    // Send the message to all plugins
    // TODO: Get real address from plugin
    for (const [address, padlock] of this.padlocks) {
      new_message.dst = address;
      this.sendStationMessage(new_message);
    }
  }

  public get has_station_connection(): boolean {
    return this.client_id !== "";
  }
}

export default Comet;
