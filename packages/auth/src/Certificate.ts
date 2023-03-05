import NodeRSA from "node-rsa";
import { createHash } from "crypto";

class Certificate {
  private publicKey: NodeRSA;
  private privateKey: NodeRSA;
  private _address: string | null = null;

  constructor(publicKey: string, privateKey: string) {
    this.publicKey = new NodeRSA(publicKey);
    this.privateKey = new NodeRSA(privateKey);

    const hash = createHash("sha256");
    hash.update(publicKey);

    this._address = hash.digest("hex");
  }

  public get address(): string {
    if (!this._address) {
      throw new Error("Certificate not loaded!");
    }

    return this._address;
  }

  public unlock(challenge: string): string {
    return this.privateKey.decrypt(challenge, "utf8");
  }
}

export default Certificate;
