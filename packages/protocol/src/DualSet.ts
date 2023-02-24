
interface DualSetItem<T, U> {
  first: T;
  second: U;
  lifetime?: number;
}


class DualSet<T, U> {
  private items: DualSetItem<T, U>[] = [];
  
  public GetFirst(second: U): T | undefined {
    if (this.HasSecond(second)) {
      const item = this.items.find((item) => item.second === second);
      return item?.first;
    }
  }

  public GetSecond(first: T): U | undefined {
    if (this.HasFirst(first)) {
      const item = this.items.find((item) => item.first === first);
      return item?.second;
    }
  }

  public Set(first: T, second: U, lifetime?: number) {
    if (this.HasFirst(first) || this.HasSecond(second)) {
      throw new Error("DualSet already contains one of the provided values");
    }

    this.items.push({
      first,
      second,
      lifetime
    });
  }

  public HasFirst(first: T): boolean {
    return this.items.some((item) => item.first === first);
  }

  public HasSecond(second: U): boolean {
    return this.items.some((item) => item.second === second);
  }

  public DeleteFirst(first: T) {
    this.items = this.items.filter((item) => item.first !== first);
  }

  public DeleteSecond(second: U) {
    this.items = this.items.filter((item) => item.second !== second);
  }

  public get size(): number {
    return this.items.length;
  }
}

export default DualSet;
