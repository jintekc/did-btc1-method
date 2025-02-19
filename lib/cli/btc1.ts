#!/usr/bin/env node

import { Command, program } from 'commander';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import CreateCommand from './commands/create.js';
import ReadCommand from './commands/read.js';
import UpdateCommand from './commands/update.js';
import DeleteCommand from './commands/delete.js';

export interface ICommand {
  execute({ options, subcommand, }: { options?: any; subcommand?: string; }): Promise<void>;
}

export type CommandType =
  | CreateCommand
  | ReadCommand
  | UpdateCommand
  | DeleteCommand;

class DidBtc1 {
  public static CLI: Command = program;
  public static VERSION: string = 'latest';

  constructor() {
    DidBtc1.addDetails();
    DidBtc1.addCommands();
  }

  private static addCommands() {
    DidBtc1.CLI
      .command('create')
      .description('Create a new did-btc1 identifier and did document')
      .action(async () => await this.invokeCommand({ command: new SetupCommand() }))
      .command('read')
      .command('resolve')
      .description('Connect to web5 using the current profile context or the context provided with -n')
      .option('-n, --name <NAME>', 'Name of the context to use to connect')
      .action(async (options) => await this.invokeCommand({ command: new ConnectCommand(), options }))
      .command('update')
      .description('Connect to web5 using the current profile context or the context provided with -n')
      .option('-n, --name <NAME>', 'Name of the context to use to connect')
      .action(async (options) => await this.invokeCommand({ command: new ConnectCommand(), options }))
      .command('delete')
      .command('deactivate')
      .description('Connect to web5 using the current profile context or the context provided with -n')
      .option('-n, --name <NAME>', 'Name of the context to use to connect')
      .action(async (options) => await this.invokeCommand({ command: new DeleteCommand(), options }));
  }

  private static addDetails() {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = join(__dirname, '..', '..', 'package.json');
    try {
      const data = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      DidBtc1.VERSION = data.version;
    } catch (error) {
      console.error('Error reading package.json:', error);
    }
    DidBtc1.CLI.name('drpm');
    DidBtc1.CLI.version(`DID BTC1 (btc1) v${DidBtc1.VERSION} `, '-v, --version', 'Output the current version');
  }


  public static async invokeCommand({ command, options, subcommand }: { command: CommandType; options?: any; subcommand?: string; }) {
    try {
      await command.execute({ options, subcommand });
      process.exit(0);
    } catch (error) {
      console.error('Error executing command:', error);
    }
  }
}

// Initialize and run the CLI
export default DidBtc1.CLI;
