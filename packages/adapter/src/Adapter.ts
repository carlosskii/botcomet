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
    this.events.addListener("__comet_bubbledown", this._onCometBubbleDown.bind(this));
  }

  public fire(event: string, data: object) {
    // TODO: Add proper context tracking
    this.events.emit("__comet_bubbleup", {
      type: "adapter_event",
      src: "ADAPTER",
      dst: "COMET",
      context: "ADAPTER",
      data: {
        event,
        data
      }
    } as AdapterEventMessage);
  }

  private _onCometBubbleDown(message: AdapterEventResponseMessage) {
    this.events.emit(message.data.event, message.data.data);
  }
}

export default Adapter;
