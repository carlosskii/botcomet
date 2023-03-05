import NodeRSA from "node-rsa";
import { createHash } from "crypto";


class Padlock {
  private publicKey: NodeRSA;
  private _address: string | null = null;
  private lastChallenge: string | null = null;

  constructor(publicKey: string) {
    this.publicKey = new NodeRSA(publicKey);

    const hash = createHash("sha256");
    hash.update(publicKey);

    this._address = hash.digest("hex");
  }

  public get address(): string {
    if (!this._address) throw new Error("Address not set");
    return this._address;
  }

  public lock(data: string): string {
    this.lastChallenge = data;
    return this.publicKey.encrypt(data, "base64");
  }

  public verify(unlock: string): boolean {
    if (!this.lastChallenge) return false;
    return this.publicKey.decrypt(unlock, "utf8") === this.lastChallenge;
  }

}

export default Padlock;
