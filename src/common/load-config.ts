import { access } from "fs/promises";
import { PathLike, constants } from "fs";
import type { LiknurConfig } from "liknur-webpack";
import { parseConfiguration } from 'liknur-webpack';
import chalk from "chalk";

export async function fileExists(path: PathLike): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function loadProject(configPath: PathLike): Promise<LiknurConfig> {
  if (! await fileExists(configPath)) {
    console.error(`❌ Configuration file not found: ${configPath}`);
    process.exit(1);
  }
  console.log(`🛠️  Reading Liknur web project using configuration from: ${configPath}`);

  const configResult = await parseConfiguration(configPath);

  if (!configResult.success) {
    if (!configResult.errors) {
      console.error(`❌ Configuration file could not be parsed.`);
      process.exit(1);
    }
    console.error(`❌ Configuration file contains errors:`);
    for (const error of configResult.errors) {
      console.error(chalk.red(`  - ${error}`));
    }
    process.exit(1);
  }

  const config = configResult.data;
  printConfiguration(config);
  return config;
}

function printConfiguration(config: LiknurConfig): void {
  console.log('');
  console.log(`📄 Configuration loaded successfully:`);
  console.log('  - Project name: ' + chalk.green(config.parsed.name));
  console.log('  - Project version: ' + chalk.green(config.parsed.version));
  if (config.parsed.aliases) {
    console.log('  - Aliases:');
      for (const aliasType in config.parsed.aliases) {
        const key = aliasType as keyof typeof config.parsed.aliases;
        if (!config.parsed.aliases[key])
          continue;
        console.log(`    - ${aliasType}:`);
        for (const [alias, path] of Object.entries(config.parsed.aliases[key])) {
          console.log(`      - ${alias}: ${path}`);
        }
      }
  }

  if(config.parsed.services) {
    console.log('  - Services:');
    for (const [_, serviceConfig] of Object.entries(config.parsed.services)) {
      console.log(`    - service name: ` + chalk.green(serviceConfig.name));
      console.log(`      - Type: ${serviceConfig.serviceType}`);
      console.log(`      - Subdomain: ${serviceConfig.subdomain}`);
      console.log(`      - BuildType: ${JSON.stringify(serviceConfig.buildType)}`);
    }
  }
  console.log('');
}

