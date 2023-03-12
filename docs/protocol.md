# BotComet / Protocol

BotComet is a protocol that allows programs to select their features over an internet connection. It is designed for chat bots, but can technically be used for any program that needs to separate features from the application.

## The Basics

At the highest level, BotComet is a "private network over the internet". It allows various nodes in the network to communicate with each other, even when they are behind firewalls or NATs.

At the lowest level, BotComet is an event-based system across machines. Nodes communicate using events, which are sent to specific destinations in the network. Events are sent over WebSockets, and are encoded using JSON.

## What are nodes?

There are three types of nodes in BotComet:

* **Comets** connect to the application itself, and are used to send and receive events for the front-end app.
* **Plugins** hold the features of the application, and are used to privately process events into commands for the Comet to perform.
* **Stations** handle communication between the Comet and the Plugin.

When troubleshooting the nodes themselves (instead of their behavior) you should keep these things in mind:

* Comets are the only nodes that can send events to the application.
* Stations MUST have a public interface for the Comet and Plugin to connect to.

## The event format

Events are sent over WebSockets as JSON objects. They have the following format:

```json
{
  "type": "event-type",
  "src": "source-node",
  "dst": "destination-node",
  "context": "context-id",
  "data": {...}
}
```

## Valid event types

The following event types are valid:

| Type | Description |
| ---- | ----------- |
| `adapter_event` | See [Adapter Events](adapter.md#adapter-events) |
| `adapter_event_response` | See [Adapter Events](adapter.md#adapter-events) |
| `comet_connect` | Sent by the Comet to the Station on connection. |
| `comet_connect_response` | Sent by the Station to the Comet to confirm the connection. |
| `plugin_connect` | Sent by the Plugin to the Station on connection. |
| `plugin_connect_response` | Sent by the Station to the Plugin to confirm the connection. |
| `plugin_verify` | Sent by the Comet to the Station to verify the Plugin. This is passed to the Plugin. |
| `plugin_verify_response` | Sent by the Plugin to the Station to confirm the Plugin. This is passed to the Comet. |

## Valid node addresses

The following node address formats are valid:

| Format | Description |
| ------ | ----------- |
| `{ID}` | A node ID assigned by the Station. |
| `0` | Either the Station itself, or the WebSocket connection that the event was sent over. |
| `PLUGIN:{plugin address}` | A plugin address (only used for `plugin_verify` and `plugin_verify_response`). |