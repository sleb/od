#!/usr/bin/env bun

import { homedir } from "node:os";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { handleConfigShow } from "./commands/config-show";
import { handleInit } from "./commands/init";
import { handleStart } from "./commands/start";

const DEFAULT_CONFIG_PATH = `${homedir()}/.overdrip/config.json`;

const noOpHandler = () => {};

yargs()
  .usage("$0 [options] <cmd> [args]")
  .option("path", {
    alias: "p",
    type: "string",
    description: "Path to config file",
    default: DEFAULT_CONFIG_PATH,
  })
  .command({
    command: ["init", "i"],
    describe: "Initialize Overdrip",
    handler: async ({ path }) => {
      await handleInit(path as string);
    },
  })
  .command({
    command: ["config", "c"],
    describe: "Manage Overdrip configuration",
    builder: (yargs) =>
      yargs
        .command({
          command: ["show", "s"],
          describe: "Show current configuration",
          handler: async ({ path }) => {
            await handleConfigShow(path as string);
          },
        })
        .demandCommand(1, "You need at least one subcommand for 'config'"),
    handler: noOpHandler,
  })
  .command({
    command: ["start", "s"],
    describe: "Start Overdrip",
    handler: async ({ path }) => {
      await handleStart(path as string);
    },
  })
  .version()
  .help()
  .demandCommand(1, "You need at least one command")
  .strict()
  .parse(hideBin(process.argv));
