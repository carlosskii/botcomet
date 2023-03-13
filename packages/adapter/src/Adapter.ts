import { EventEmitter } from "events";

import {
  AdapterEventMessage, AdapterEventResponseMessage
} from "@botcomet/protocol";

/**
 * Adapters are used with Comets to provide API
 * access to the Comet's internal state.
 */
export class Adapter {
  public events: EventEmitter;

  constructor() {
    this.events = new EventEmitter();
  }

  public fire(event: string, ...args: any[]) {
    // TODO: Add proper context tracking
    this.events.emit("__comet_bubbleup", {
      type: "adapter_event",
      src: "ADAPTER",
      dst: "COMET",
      context: "ADAPTER",
      data: {
        event,
        args
      }
    } as AdapterEventMessage);
  }
}

export default Adapter;
