#!/usr/bin/env bun

import { homedir } from "node:os";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { app } from "./app";

const DEFAULT_CONFIG_PATH = `${homedir()}/.overdrip/config.json`;

yargs().usage("$0 [options] <cmd> [args]").option("path", {
  alias: "p",
  type: "string",
  description: "Path to config file",
  default: DEFAULT_CONFIG_PATH
}).command({
  command: "init",
  describe: "Initialize Overdrip",
  handler: async ({ path }) => {
    app("init", path);
  }
}).version().help().demandCommand(1, "You need at least one command").strict().parse(hideBin(process.argv));
