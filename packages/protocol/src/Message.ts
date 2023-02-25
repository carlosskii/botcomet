
type MessageType = 
  "comet_connect" | "plugin_connect";

interface Message {
  type: MessageType;
  destination: string;
  data: any;
}

export type { Message };
