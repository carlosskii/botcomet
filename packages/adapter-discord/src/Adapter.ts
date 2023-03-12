import { Adapter } from "@botcomet/adapter";
import { DualSet, next_obfuscated_id } from "@botcomet/protocol";

import {
  Client, GatewayIntentBits,
  Message as DiscordMessage
} from "discord.js";


export class DiscordAdapter extends Adapter {
  private readonly _client: Client;
  private readonly _token: string;

  private readonly _messages = new DualSet<string, string>();

  constructor(token: string) {
    super();

    this._client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
    });

    this._token = token;

    this.events.addListener("__comet_bubbledown_enable", this._onEnable.bind(this));
    this.events.addListener("__comet_bubbledown_disable", this._onDisable.bind(this));
  }

  private async _onEnable() {
    this._client.on("messageCreate", this._onMessage.bind(this));
    await this._client.login(this._token);
  }

  private async _onDisable() {
    await this._client.destroy();
  }

  private async _onMessage(message: DiscordMessage) {
    if (message.author.bot) return;

    const id = next_obfuscated_id();
    this._messages.Set(id, message.id);

    const content = message.content;

    this.fire("message_create", {
      id,
      content
    });
  }
}

export default DiscordAdapter;
