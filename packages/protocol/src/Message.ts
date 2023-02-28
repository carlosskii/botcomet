
type MessageType = 
  "comet_connect" | "plugin_connect" |
  "message_create" | "plugin_verify" | "plugin_verify_response";

interface Message {
  type: MessageType;
  src: string;
  dst: string;
  context: string;
  data: any;
}

export type { Message };
