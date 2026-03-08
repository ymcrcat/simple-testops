#!/usr/bin/env node
import { Command } from "commander";
import { uploadCommand } from "./commands/upload";

const program = new Command();

program
  .name("testops")
  .description("TestOps CLI - Upload test results")
  .version("0.1.0");

program.addCommand(uploadCommand);

program.parse();
