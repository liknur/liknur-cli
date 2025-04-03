#!/usr/bin/env node

import { Command } from "commander";
import build from "./commands/build.js";
import update from "./commands/update.js";

const program = new Command();

const validEnvironments = ["development", "test", "production"];

function parseServices(value: string): string[] {
  return value.split(",").map((s) => s.trim());
}

program
  .name("lknur-cli")
  .description("CLI tool to build Liknur web projects")
  .version("1.0.0");

program
  .command("build")
  .description("Build a Liknur web project for a specific environment")
  .argument("<environment>", "Target environment (development, test, production)")
  .option(
    "--services <items>",
    "Comma-separated list of services to include (default: all)",
    parseServices,
    []
  )
  .option("--config <path>", "Path to configuration file", "project.config.yaml")
  .action(async (environment, options) => {
    if (!validEnvironments.includes(environment)) {
      console.error(
        `❌ Invalid environment: "${environment}". Valid options are: ${validEnvironments.join(", ")}`
      );
      process.exit(1);
    }

    console.log(`🛠️  Building Liknur web project for "${environment}" environment`);
    console.log(`🔧 Services: ${options.services.join(", ")}`);

    console.log(`📄 Using configuration from: ${options.config}`);

    await build(environment, options.services, options.config);
  });

program
  .command("update")
  .description("Update dependent config files")
  .option("--config <path>", "Path to configuration file", "project.config.yaml")
  .action(async (options) => {
    console.log(`🛠️  Updating dependent config files`);
    console.log(`📄 Using configuration from: ${options.config}`);

    await update(options.config);
  });


program.parse();
