
type MessageType = 
  "comet_connect" | "plugin_connect" |
  "comet_connect_response" | "plugin_connect_response" |
  "message_create" | "plugin_verify" | "plugin_verify_response" |
  "adapter_event" | "adapter_event_response";

interface Message {
  type: MessageType;
  src: string;
  dst: string;
  context: string;
  data: any;
}

export type { Message, MessageType };
