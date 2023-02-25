import NodeRSA from "node-rsa";

class Certificate {
  private key: NodeRSA;

  constructor(private_key: string) {
    this.key = new NodeRSA(private_key);
  }

  public unlock(data: string): string {
    return this.key.decrypt(data, "utf8");
  }
}

export default Certificate;
