import { DidBtc1Error } from '../../utils/error.js';
import { ICommand } from '../btc1.js';

export default class CRUD implements ICommand {
  async execute({ options, subcommand }: { options?: any; subcommand?: string }): Promise<void> {
    try {
      switch (subcommand) {
        case 'create':
          break;
        case 'read':
          break;
        case 'update':
          break;
        case 'delete':
          break;
        default:
          throw new DidBtc1Error(`CRUD: Unknown action ${subcommand}`);
      }
    } catch (error: any) {
      console.error(error.message);
      throw error;
    }
  }
}
