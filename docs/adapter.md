# BotComet / Adapters

Comets don't know how to talk to the application they represent. To do this, they use adapters. Adapters are plugins that provide the Comet with any communication they need to do with the application.

## Adapter Events

Only two events are valid for adapters:

- `adapter_event`
- `adapter_event_response`