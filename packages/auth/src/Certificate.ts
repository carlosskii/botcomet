import NodeRSA from "node-rsa";
import { createHash } from "crypto";

/**
 * Certificates are used by plugins to verifty their
 * identity. They use self-generated RSA keys to
 * prove their identity, which works as long as
 * the private key is not compromised.
 *
 * The public key is distributed to comets, and the
 * private key is kept safe. When a comet wants to
 * verify a plugin, it will encrypt a challenge
 * using the public key, and the plugin will decrypt
 * it using the private key. For added security, the
 * plugin will re-encrypt the challenge using the
 * private key, and the comet will decrypt it again
 * using the public key to verify the challenge.
 */
class Certificate {
  // The private key used to decrypt challenges.
  private privateKey: NodeRSA;
  // The address the station uses when sending
  // challenges to this plugin. This is NOT the
  // client ID used by all other messages.
  private _address: string | null = null;

  /**
   * @param publicKey The public key as a PEM string (this MUST be the same as the comet's copy!)
   * @param privateKey The private key as a PEM string
   */
  constructor(publicKey: string, privateKey: string) {
    // TODO: Handle parsing errors accordingly.
    this.privateKey = new NodeRSA(privateKey);

    // The address is the SHA256 hash of the public key.
    const hash = createHash("sha256");
    hash.update(publicKey);
    this._address = hash.digest("hex");
  }

  /**
   * The address used by the station to send challenges to this plugin.
   */
  public get address(): string {
    if (!this._address) {
      // This should be impossible, since the address
      // is set in the constructor. If this error is
      // thrown, there is a serious bug in the code.
      throw new Error("Certificate not loaded! [IMPOSSIBLE ERROR]");
    }

    return this._address;
  }

  /**
   * Unlocks an encrypted challenge using the private key.
   * @param challenge The encrypted challenge
   * @returns The decrypted challenge
   */
  public unlock(challenge: string): string {
    const data = this.privateKey.decrypt(challenge, "utf8");
    return this.privateKey.encrypt(data, "base64");
  }
}

export default Certificate;
