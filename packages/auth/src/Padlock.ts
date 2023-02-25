import fetch from "node-fetch";
import NodeRSA from "node-rsa";

const getDestinationFromAuthority = (authority: string) => {
  const [host, plugin] = authority.split("/");
  const plugin_parsed = plugin.split(".").reverse().join("/");
  return `https://bcauth.${host}/${plugin_parsed}`;
};

class Padlock {
  private authority: string;
  private publicKey: NodeRSA | null = null;
  private lastChallenge: string | null = null;

  constructor(authority: string) {
    this.authority = authority;
  }

  public async getPublicKey(): Promise<NodeRSA> {
    if (this.publicKey) return this.publicKey;
    const response = await fetch(getDestinationFromAuthority(this.authority));
    const key = await response.text();
    this.publicKey = new NodeRSA(key);
    return this.publicKey;
  }

  public async lock(data: string): Promise<string> {
    const key = await this.getPublicKey();
    this.lastChallenge = data;
    return key.encrypt(data, "base64");
  }

  public async verify(unlock: string): Promise<boolean> {
    if (!this.lastChallenge) return false;
    const key = await this.getPublicKey();
    return key.decrypt(unlock, "utf8") === this.lastChallenge;
  }

}

export default Padlock;
