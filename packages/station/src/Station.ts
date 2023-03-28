import WebSocket, { WebSocketServer } from "ws";
import { EventEmitter } from "events";


import { 
  DualSet, next_obfuscated_id,
  CometConnectMessage, PluginConnectMessage,
  PluginVerifyMessage, PluginVerifyResponseMessage,
  AdapterEventMessage, AdapterEventResponseMessage
} from "@botcomet/protocol";

type ValidStationMessage =
  CometConnectMessage | PluginConnectMessage |
  PluginVerifyMessage | PluginVerifyResponseMessage |
  AdapterEventMessage | AdapterEventResponseMessage;

/**
 * The station handles all traffic between comets
 * and plugins. It handles mesasge routing and
 * client ID assignment.
 */
class Station {
  private readonly wss: WebSocketServer;
  private eventAsyncer: EventEmitter = new EventEmitter();

  // Obfuscated IDs for the comets and plugins. No
  // real IDs exist, but messages need a destination
  // for routing.
  private comets: DualSet<WebSocket, string> = new DualSet();
  private plugins: DualSet<WebSocket, string> = new DualSet();
  private plugin_addresses: DualSet<string, string> = new DualSet();

  constructor() {
    // TODO: Make this configurable.
    this.wss = new WebSocketServer({ port: 6197 });
    this.wss.on("connection", this._onConnection.bind(this));

    this.eventAsyncer.addListener("comet_connect", this._onCometConnectMessage.bind(this));
    this.eventAsyncer.addListener("plugin_connect", this._onPluginConnectMessage.bind(this));
    this.eventAsyncer.addListener("plugin_verify", this._onPluginVerifyMessage.bind(this));
    this.eventAsyncer.addListener("plugin_verify_response", this._onPluginVerifyResponseMessage.bind(this));
    this.eventAsyncer.addListener("adapter_event", this._onAdapterEventMessage.bind(this));
    this.eventAsyncer.addListener("adapter_event_response", this._onAdapterEventResponseMessage.bind(this));
  }

  // Handles a new connection.
  private _onConnection(ws: WebSocket) {
    console.log("[STATION] New connection");

    ws.on("message", (message: string) => {
      console.log("[STATION] Message received");
      this._onMessage.bind(this)(message, ws);
    });

    ws.on("close", () => {
      if (this.comets.HasFirst(ws)) {
        this.comets.DeleteFirst(ws);
      } else if (this.plugins.HasFirst(ws)) {
        this.plugins.DeleteFirst(ws);
      }
    });
  }

  private _onCometConnectMessage(msg: CometConnectMessage, ws: WebSocket) {
    console.log("[STATION] Comet connected, assigning ID");
    const comet_id = next_obfuscated_id();
    this.comets.Set(ws, comet_id);
    ws.send(JSON.stringify({
      type: "comet_connect_response",
      dst: comet_id,
      src: 0,
      context: msg.context,
      data: {}
    }));
  }

  private _onPluginConnectMessage(msg: PluginConnectMessage, ws: WebSocket) {
    console.log("[STATION] Plugin connected, assigning ID");
    const plugin_id = next_obfuscated_id();
    this.plugins.Set(ws, plugin_id);
    this.plugin_addresses.Set(msg.data.address, plugin_id);
    ws.send(JSON.stringify({
      type: "plugin_connect_response",
      dst: plugin_id,
      src: 0,
      context: msg.context,
      data: {}
    }));
  }

  private _onPluginVerifyMessage(msg: PluginVerifyMessage, ws: WebSocket) {
    console.log("[STATION] Plugin verification request");
    // TODO: Add proper address parsing (PLUGIN:ADDRESS).
    if (!this.plugin_addresses.HasFirst(msg.dst)) {
      console.log("[STATION] Plugin not found");
    }

    const plugin_id = this.plugin_addresses.GetSecond(msg.dst);
    // TODO: Add proper undefined handling.
    const plugin_ws = this.plugins.GetFirst(plugin_id!)!;

    plugin_ws.send(JSON.stringify({
      type: "plugin_verify",
      src: msg.src,
      dst: plugin_id,
      context: msg.context,
      data: {
        challenge: msg.data.challenge
      }
    }));
  }

  private _onPluginVerifyResponseMessage(msg: PluginVerifyResponseMessage) {
    console.log("[STATION] Plugin verification response");

    if (!this.comets.HasSecond(msg.dst)) {
      console.log("[STATION] Comet not found");
    }

    const comet_ws = this.comets.GetFirst(msg.dst);

    comet_ws!.send(JSON.stringify(msg));
  }

  private _onAdapterEventMessage(msg: AdapterEventMessage) {
    console.log("[STATION] Adapter event");

    if (!this.plugins.HasSecond(msg.dst)) {
      console.log("[STATION] Plugin not found");
    }

    const plugin_ws = this.plugins.GetFirst(msg.dst);

    plugin_ws!.send(JSON.stringify(msg));
  }

  private _onAdapterEventResponseMessage(msg: AdapterEventResponseMessage) {
    console.log("[STATION] Adapter event response");

    if (!this.comets.HasSecond(msg.dst)) {
      console.log("[STATION] Comet not found");
    }

    const comet_ws = this.comets.GetFirst(msg.dst);

    comet_ws!.send(JSON.stringify(msg));
  }

  // Handles a message from a comet or plugin.
  private _onMessage(message: string, ws: WebSocket) {
    const msg: ValidStationMessage = JSON.parse(message);
    switch (msg.type) {
    case "comet_connect":
      this.eventAsyncer.emit("comet_connect", msg, ws);
      break;
    case "plugin_connect":
      this.eventAsyncer.emit("plugin_connect", msg, ws);
      break;
    case "plugin_verify":
      this.eventAsyncer.emit("plugin_verify", msg, ws);
      break;
    case "plugin_verify_response":
      this.eventAsyncer.emit("plugin_verify_response", msg);
      break;
    case "adapter_event":
      this.eventAsyncer.emit("adapter_event", msg);
      break;
    case "adapter_event_response":
      this.eventAsyncer.emit("adapter_event_response", msg);
      break;
    default:
      console.log("[STATION] Unknown message type");
    }
  }
}

export default Station;
