import NodeRSA from "node-rsa";
import { createHash } from "crypto";

/**
 * Padlocks are used by comets to verify plugins. They
 * contain a public key from the plugin maintainer, and
 * can be used to encrypt challenges. The plugin can
 * then decrypt the challenge using its private key. For
 * added security, the challenge is re-encrypted using
 * the private key, and the comet must decrypt it again
 * using the public key to verify the challenge.
 */
class Padlock {
  // The plugin public key
  private publicKey: NodeRSA;
  // The plugin address (NOT the client ID)
  private _address: string | null = null;
  // The last challenge sent to the plugin, used to
  // verify the response.
  private lastChallenge: string | null = null;

  /**
   * @param publicKey The public key as a PEM string (this MUST be the same as the plugin's copy!)
   */
  constructor(publicKey: string) {
    // TODO: Handle parsing errors accordingly.
    this.publicKey = new NodeRSA(publicKey);

    // The address is the SHA256 hash of the public key.
    const hash = createHash("sha256");
    hash.update(publicKey);
    this._address = hash.digest("hex");
  }

  /**
   * The address used by the station to send challenges
   * to the plugin.
   */
  public get address(): string {
    if (!this._address) {
      // This should be impossible, since the address
      // is set in the constructor. If this error is
      // thrown, there is a serious bug in the code.
      throw new Error("Address not loaded! [IMPOSSIBLE ERROR]");
    }

    return this._address;
  }

  /**
   * Locks a challenge string using the public key.
   * @param data The challenge string
   * @returns The encrypted challenge
   */
  public lock(data: string): string {
    this.lastChallenge = data;
    return this.publicKey.encrypt(data, "base64");
  }

  /**
   * Verifies the unlocked challenge response.
   * @param unlock The challenge encrypted using the plugin's private key
   * @returns True if the challenge passed, false otherwise.
   */
  public verify(unlock: string): boolean {
    if (!this.lastChallenge) return false;
    return this.publicKey.decrypt(unlock, "utf8") === this.lastChallenge;
  }

}

export default Padlock;
