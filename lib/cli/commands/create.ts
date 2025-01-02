import { Profile } from '../../lib/profile.js';
import { Logger } from '../../utils/logger.js';
import { ICommand } from '../btc1.js';
import { DRegistryPackageManagerError } from './error.js';

export default class ReadCommand implements ICommand {
  async execute({ options }: { options: any; }): Promise<void> { }
}