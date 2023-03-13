
type MessageType = 
  "comet_connect" | "plugin_connect" |
  "comet_connect_response" | "plugin_connect_response" |
  "plugin_verify" | "plugin_verify_response" |
  "adapter_event" | "adapter_event_response";

interface CometConnectMessage {
  type: "comet_connect";
  src: 0;
  dst: 0;
  context: string;
  data: object;
}

interface PluginConnectMessage {
  type: "plugin_connect";
  src: 0;
  dst: 0;
  context: string;
  data: {
    address: string;
  }
}

interface CometConnectResponseMessage {
  type: "comet_connect_response";
  src: 0;
  dst: string;
  context: string;
  data: object;
}

interface PluginConnectResponseMessage {
  type: "plugin_connect_response";
  src: 0;
  dst: string;
  context: string;
  data: object;
}

interface PluginVerifyMessage {
  type: "plugin_verify";
  src: string;
  dst: string;
  context: string;
  data: {
    challenge: string;
  }
}

interface AdapterEventMessage {
  type: "adapter_event";
  src: string;
  dst: string;
  context: string;
  data: object;
}

interface AdapterEventResponseMessage {
  type: "adapter_event_response";
  src: string;
  dst: string;
  context: string;
  data: object;
}

interface PluginVerifyResponseMessage {
  type: "plugin_verify_response";
  src: string;
  dst: string;
  context: string;
  data: {
    challenge: string;
  }
}

export type {
  PluginConnectMessage, CometConnectMessage,
  PluginConnectResponseMessage, CometConnectResponseMessage,
  PluginVerifyMessage, PluginVerifyResponseMessage,
  AdapterEventMessage, AdapterEventResponseMessage,
  MessageType };
