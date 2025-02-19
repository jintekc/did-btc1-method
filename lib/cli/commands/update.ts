import { DidBtc1 } from '../../../src/did-btc1.js';

export default class Update {
  async execute({ options }: { options?: any; }): Promise<void> {
    try {
      await DidBtc1.create(options);
    } catch (error: any) {
      console.error(error.message);
      throw error;
    }
  }
}