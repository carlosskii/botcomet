# BotComet

[![Node.js CI](https://github.com/botcomet/botcomet/actions/workflows/node.js.yml/badge.svg)](https://github.com/botcomet/botcomet/actions/workflows/node.js.yml)

BotComet is a framework for building chatbots. It is designed to be easy
to use, both for developers and for general users. Our libraries are currently
very Discord-focused, but this should change in an upcoming release.

## How it works

In the BotComet network, there are three entities:

- **Comets** are the "translator" between the chat platform and the BotComet ecosystem.
- **Plugins** handle events from Comets, send commands to Comets for the chat platform, and provide a modular system for developers to share their bot code.
- **Stations** handle communication between Comets and Plugins.

Since Comets are the only entities that can communicate with the chat platform, they make the final decision on whether or not to execute a command. This gives users a lot of flexibility, even after choosing a plugin to use.

## Progress

BotComet is currently in VERY early development. We are working on the core of the system, and we are not yet ready for public use. If you are interested in contributing, see the issues page.