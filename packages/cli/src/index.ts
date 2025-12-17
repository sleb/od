#!/usr/bin/env bun

import { homedir } from "node:os";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { app } from "./app";

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
      app("init", path);
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
            app("config-show", path);
          },
        })
        .demandCommand(1, "You need at least one subcommand for 'config'"),
    handler: noOpHandler,
  })
  .command({
    command: ["start", "s"],
    describe: "Start Overdrip",
    handler: async ({ path }) => {
      app("start", path);
    },
  })
  .version()
  .help()
  .demandCommand(1, "You need at least one command")
  .strict()
  .parse(hideBin(process.argv));
