
export interface IKeyring {
  id: string;
  type: string;
  addAccounts(count: number): void;
  addAccount(index: number): void;
  getAccounts(): any[];
  serialize(): any;
  deserialize(data: any): void;
}