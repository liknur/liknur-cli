import { PathLike } from "fs";
import { runCLI } from '@jest/core';
import path from "path";
import { loadProject } from "./../common/load-config.js";
import { LiknurConfig, getAliases, ServiceType } from 'liknur-webpack';
import { updateDependentConfigFiles } from "./../common/update.js";
import type { Config } from '@jest/types';
import chalk from "chalk";

export type TestType = "unit" | "integration";

const testConfigsByTestType = {
  unit: {
    testPathPattern: "unit",
    testNamePattern: '^\\[unit\\]'
  },
  integration: {
    testPathPattern: "integration",
    testNamePattern: '^\\[integration\\]'
  },
};

const testConfigsByServiceType = {
  frontend: {
    testPathPattern: "frontend",
    testEnvironment: "jsdom",
    testMatch: [`/**/__tests__/**/*.spec.(ts|tsx)`],
    testPathIgnorePatterns: [`<rootDir>/node_modules/`, `<rootDir>/dist/`, `<rootDir>/src/backend/`]
  },
  backend: {
    testPathPattern: "backend",
    testEnvironment: "node",
    testMatch: [`/**/__tests__/**/*.spec.ts`],
    testPathIgnorePatterns: [`<rootDir>/node_modules/`, `<rootDir>/dist/`, `<rootDir>/src/frontend/`]
  },
};

function createModuleNameMapper(config : LiknurConfig, serviceType : ServiceType) : Record<string, string> {
  const aliases = getAliases(config, serviceType);
  const moduleNameMapper : Record<string, string> = {};
  for (const alias in aliases) {
    moduleNameMapper[`^${alias}(.*)$`] = `<rootDir>/${aliases[alias]}/$1`;
    moduleNameMapper[`^${alias}$`] = `<rootDir>/${aliases[alias]}/index.ts`;
  }
  return moduleNameMapper;
}

function createTestConfig(serviceType : ServiceType, config : LiknurConfig) : Config.InitialOptions {
  const testConfigByServiceType = testConfigsByServiceType[serviceType];
  const moduleNameMapper = createModuleNameMapper(config, serviceType);
  const workingDir = path.resolve(process.cwd());
  const jestConfig = {
    globals: {
      __DEVELOPMENT__ : false,
      __PRODUCTION__: false,
      __TEST__: true,
      __TEST_JEST__: true
    },
    automock: true,
    clearMocks: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleDirectories: ['node_modules'],
    moduleFileExtensions: ['js', 'ts', 'tsx', 'json', 'node'],
    rootDir: workingDir,
    testMatch: testConfigByServiceType.testMatch, 
    transform: {
      "^.+\\.ts$": ["ts-jest", {  }],
      "^.+\\.tsx$": ["ts-jest", { }],
    },
    moduleNameMapper,
    testEnvironment: testConfigByServiceType.testEnvironment,
    testPathIgnorePatterns: testConfigByServiceType.testPathIgnorePatterns,
  } satisfies Config.InitialOptions;

  return jestConfig;
}

async function runJest(testType : TestType, config : LiknurConfig, serviceType : ServiceType) {
  const jestConfig = createTestConfig(serviceType, config);
  const workingDir = path.resolve(process.cwd());
  const testNamePattern = testConfigsByTestType[testType].testNamePattern;
  const testArgs = {
    config: JSON.stringify(jestConfig),
    testNamePattern,
    passWithNoTests: true,
    _: [],
    $0: 'custom-cli'
  };
  await runCLI(testArgs, [workingDir]);
}


export default async function runTest(testType : TestType, configPath: PathLike): Promise<void> {
  const config = await loadProject(configPath);
  await updateDependentConfigFiles(config);
  const serviceTypes : ServiceType[] = ["frontend", "backend"];
  for (const serviceType of serviceTypes) {
    console.log();
    console.log(chalk.green('>>> Running ') + chalk.yellow(testType) + chalk.green(' tests for ') + chalk.yellow(serviceType) + chalk.green(' service type <<<'));
    console.log();
    await runJest(testType, config, serviceType);
  }
}

