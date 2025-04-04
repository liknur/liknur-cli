import { mkdir, writeFile, readFile, access, stat } from "fs/promises";
import type { LiknurConfig } from "liknur-webpack";
import { getAliases } from "liknur-webpack";
import path from "path";
import chalk from "chalk";
import { PathLike } from "fs";

async function isDirectory(pathValue: PathLike): Promise<boolean> {
    const info = await stat(pathValue);
    return info.isDirectory();
}

async function updateDeclarationFile(config: LiknurConfig): Promise<void> {
  const dir = path.resolve("dist", "generated");
  await mkdir(dir, { recursive: true });
  const declarationFile = path.resolve(dir, "index.ts");
  console.log('📄 Generating declaration file:' + chalk.green(declarationFile));
  let fileContent = `
// This file is generated by the Liknur CLI

export declare const __DEVELOPMENT__: boolean;
export declare const __PRODUCTION__: boolean;
export declare const __TEST__: boolean;
export declare const __TEST_JEST__: boolean;
export declare const __BACKEND_SERVICES__: string[];
export declare const __FRONTEND_SERVICES__: string[];
`;

  for (const [_, serviceConfig] of Object.entries(config.services)) {
    const name = serviceConfig.name.toUpperCase();
    fileContent += `export declare const __${serviceConfig.serviceType.toUpperCase()}_${name}_SERVICE__: boolean;\n`;
    fileContent += `export declare const __${serviceConfig.serviceType.toUpperCase()}_${name}_SUBDOMAIN__: string;\n`;
  }

  await writeFile(declarationFile, fileContent);
}

async function updateTSConfig(tsConfigPath : PathLike, config: LiknurConfig): Promise<void> {
  console.log('📄 Updating tsconfig.json:' + chalk.green(tsConfigPath));
  // Read tsconfig.json file and update the "paths" property
  const tsConfig = await readFile(tsConfigPath, 'utf-8');
  const tsConfigJson = JSON.parse(tsConfig);
  const aliases = getAliases(null, config);
  const aliasesToWrite : Record<string, string[]> = {};
  for (const alias of Object.keys(aliases)) {
    // check whether alias value is folder
    const aliasValue = aliases[alias];
    if ( await isDirectory(aliasValue) ) {
      const newAliasKey = alias + path.sep + '*';
      aliasesToWrite[newAliasKey] = [aliasValue.toString() + path.sep + '*'];
    }
    else {
      aliasesToWrite[alias] = [aliasValue.toString()];
    }
  }

  tsConfigJson.compilerOptions = tsConfigJson.compilerOptions || {};
  tsConfigJson.compilerOptions.paths = tsConfigJson.compilerOptions.paths || {};
  tsConfigJson.compilerOptions.paths = aliasesToWrite;

  await writeFile(tsConfigPath, JSON.stringify(tsConfigJson, null, 2));
}

export async function updateDependentConfigFiles(config: LiknurConfig): Promise<void> {
  const tsConfigPath = path.resolve("tsconfig.json");
  const exists = await access(tsConfigPath).then(() => true).catch(() => false);
  if (exists) {
    await updateTSConfig(tsConfigPath, config);
    await updateDeclarationFile(config);
  } else {
    console.log(chalk.bgRed('📄 TypeScript configuration file tsconfig.json not found, skipping update.'));
  }
}

