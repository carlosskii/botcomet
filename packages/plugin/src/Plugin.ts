import WebSocket from "ws";
import { EventEmitter } from "events";

import {
  PluginVerifyMessage, PluginConnectResponseMessage,
  PluginVerifyResponseMessage, PluginConnectMessage,
  AdapterEventMessage, AdapterEventResponseMessage,
  ContextCache, next_obfuscated_id
} from "@botcomet/protocol";
import { Certificate } from "@botcomet/auth";

type ValidPluginMessage = PluginVerifyMessage | PluginConnectResponseMessage | AdapterEventMessage;
type ValidPluginResponseMessage = PluginVerifyResponseMessage | PluginConnectMessage | AdapterEventResponseMessage;

/**
 * Plugins handle all functionality for comets. They
 * receive events from the bot, and emit commands for
 * the bot to execute. Plugins are loaded by the station
 * on connection, but are not verified by the station
 * itself. Comets handle all verification of plugins.
 */
class Plugin {
  // The client ID from the station
  private client_id = "";
  // The plugin address (see @botcomet/auth - Certificate)
  private address: string;
  // The context cache for messages. This holds persistent
  // data between messages, and is used to relate messages
  // to one another.
  private message_context: ContextCache = new Map();

  private station_conn: WebSocket | null = null;
  private certificate: Certificate;

  private eventAsyncer = new EventEmitter();

  /**
   * @param publicKey The public key as a PEM string (see \@botcomet/auth - Certificate)
   * @param privateKey The private key as a PEM string (see \@botcomet/auth - Certificate)
   */
  constructor(publicKey: string, privateKey: string) {
    this.certificate = new Certificate(publicKey, privateKey);
    this.address = this.certificate.address;
  }

  /**
   * Starts the plugin. This will connect to the station,
   * and begin listening for messages on the station.
   */
  public start(address: string) {
    this.station_conn = new WebSocket(address);
    this.station_conn.on("open", this.onOpen.bind(this));
    this.station_conn.on("message", (data) => this.onMessage.bind(this)(JSON.parse(data.toString())));

    this.eventAsyncer.on("plugin_verify", this._onPluginVerifyMessage.bind(this));
    this.eventAsyncer.on("plugin_connect_response", this._onPluginConnectResponseMessage.bind(this));
    this.eventAsyncer.on("adapter_event", this._onAdapterEventMessage.bind(this));
  }

  private onOpen() {
    if (!this.certificate) {
      // The certificate is initialized in the constructor,
      // so this should never happen.
      throw new Error("No certificate loaded! [IMPOSSIBLE ERROR]");
    }

    const context_id = next_obfuscated_id();
    this.message_context.set(context_id, {
      type: "plugin_connect",
      data: {}
    });

    this.sendStationMessage({
      type: "plugin_connect",
      dst: 0,
      src: 0,
      context: context_id,
      data: {
        address: this.address
      }
    });
  }

  private _onPluginVerifyMessage(data: PluginVerifyMessage) {
    if (!this.certificate) {
      console.error("No certificate loaded! [IMPOSSIBLE ERROR]");
    }

    let challenge: string = data.data.challenge;
    challenge = this.certificate.unlock(challenge);

    this.sendStationMessage({
      type: "plugin_verify_response",
      src: data.dst,
      dst: data.src,
      context: data.context,
      data: { challenge }
    });
  }

  private _onPluginConnectResponseMessage(data: PluginConnectResponseMessage) {
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
    this.client_id = data.dst;
  }

  private _onAdapterEventMessage(data: AdapterEventMessage) {
    this.eventAsyncer.emit(data.data.event, data);
  }


  private onMessage(data: ValidPluginMessage) {
    switch (data.type) {
    case "plugin_verify":
      this.eventAsyncer.emit("plugin_verify", data);
      break;
    case "plugin_connect_response":
      this.eventAsyncer.emit("plugin_connect_response", data);
      break;
    }
  }

  private sendStationMessage(msg: ValidPluginResponseMessage) {
    this.station_conn?.send(JSON.stringify(msg));
  }

  public get has_station_connection() {
    return this.client_id !== null;
  }

}

export default Plugin;
