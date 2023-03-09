import { EventEmitter } from "events";

/**
 * Adapters are used with Comets to provide API
 * access to the Comet's internal state.
 */
export class Adapter {
  private events: EventEmitter;

  constructor() {
    this.events = new EventEmitter();
  }

  public fire(event: string, ...args: any[]) {
    this.events.emit(event, ...args);
  }
}

export default Adapter;
