#!/usr/bin/env node
// This script is used to build a Docker image for the application.
// It is run by the Dockerfile during the build process.
// Usage: --liknur-config <path to config-file.yaml> --service-config <path to service.config.yaml> --build-mode <production|test> [--cert <cert-file> --key <key-file>] [--self-signed] <services>

import { Command } from 'commander';
import { promises as fs } from 'fs';
import { mkdir } from 'fs/promises';
import { PathLike } from 'fs';
import { setupCertificates } from './common/certificates.js';
import { copyYamlSections } from './common/copy-config.js';
import { runNpmInstall } from './common/build-npm.js';

import path from 'path';

const program = new Command();

program
  .description('Build Docker image for the application')
  .option(
    '--liknur-config <path>',
    'Path to the configuration file',
    path.resolve(process.cwd(), 'project.config.yaml')
  )
  .option(
    '--service-config <path>',
    'Path to the service configuration file',
    path.resolve(process.cwd(), 'service.config.yaml')
  )
  .option('--build-mode <mode>', 'Build mode', 'production')
  .option('--cert <cert-folder|self-signed>', 'Path to the certificate folder containing the cert.pem and key.pem files or self-signed', undefined)
  .argument('[services...]', 'Services to build', "")
program.parse(process.argv);
const options = program.opts();
const services : ReadonlyArray<string> = program.args;
const buildMode : "production" | "test" = options.buildMode;
const certOption : "self-signed" | PathLike | undefined = options.cert;

const liknurConfigFile = path.resolve(options.liknurConfig);

// check whether the liknur config file exists
try {
  await fs.access(liknurConfigFile);
} catch (err) {
  console.error(`Cannot access liknur config file ${liknurConfigFile}`);
  process.exit(1);
}

const serviceConfigFile = path.resolve(options.serviceConfig);

// check whether the service config file exists
// if not, exit with error
try {
  await fs.access(serviceConfigFile);
} catch (err) {
  console.error(`Cannot access service config file ${serviceConfigFile}`);
  process.exit(1);
}

console.log(`Building Docker image for ${JSON.stringify(services)} services in ${buildMode} mode...`);

if (certOption) {
  console.log(`Using certificates from ${certOption}`);
  await setupCertificates(certOption);
}

// Copy the sections from the configuration file to the service configuration file or whole file if no sections are specified

await mkdir('dist', { recursive: true });
const dstServiceConfigFile : PathLike = path.resolve('dist', 'service.config.yaml');
if (options.sections) {
  console.log(`Copying sections ${JSON.stringify(options.sections)} from ${serviceConfigFile} to ${dstServiceConfigFile}`);
  await copyYamlSections(serviceConfigFile, dstServiceConfigFile, options.sections);
} else {
  console.log(`Copying whole file ${serviceConfigFile} to ${dstServiceConfigFile}`);
  await fs.copyFile(serviceConfigFile, dstServiceConfigFile);
}

// Install dependencies
runNpmInstall(); 

