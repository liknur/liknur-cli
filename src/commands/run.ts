import { PathLike } from "fs";
import type { BuildType, LiknurConfig } from "liknur-webpack";
import { liknurWebpack } from 'liknur-webpack';
import { loadProject } from "./../common/load-config.js";
import { runBuild } from "./build.js";
import { spawn } from 'child_process';
// @ts-ignore
import nodemonFn from 'nodemon';
const nodemon = nodemonFn as unknown as (settings: any) => any;

type ServiceInfo = LiknurConfig["parsed"]["services"][number];

async function build(buildMode: BuildType, config: LiknurConfig, services: ReadonlyArray<string>) : Promise<void> {
  const buildResult = await liknurWebpack(config, buildMode, services);
  if (Array.isArray(buildResult) && buildResult.length === 0) {
    console.error("❌ No build result found.");
    return;
  }
  runBuild(buildResult);
}

async function startWatchMode(buildMode: BuildType, config: LiknurConfig, services: ReadonlyArray<string>) : Promise<void> {
  return new Promise((resolve) => {
  nodemon( {
    script: `dist/${buildMode}/server/main.cjs`,
    ext: 'js ts',
    watch: ['src/backend/**/*.ts', 'src/backend/**/*.js'],
    ignore: ['src/**/*.test.ts'],
    verbose: true,
    cwd: process.cwd()
  })
    .on('start', () => {
      console.log('Nodemon started');
      build(buildMode, config, services).then(() => {
        console.log('Build completed successfully');
      }).catch((error) => {
        console.error('Build failed:', error);
      });
    })
    .on('quit', () => {
      resolve();
      console.log('Nodemon quit');
      process.exit();
    })
    .on('restart', (files : any) => {
      console.log('Nodemon restarting due to changes in: ', files);
      build(buildMode, config, services).then(() => {
        console.log('Build completed successfully');
      }).catch((error) => {
        console.error('Build failed:', error);
      });
    })
    .once('start', () => {
      console.log('Nodemon is ready to watch for changes...');
    });
  });
}

export default async function run(buildMode: BuildType, configPath: PathLike, watchBackend : boolean, buildBefore: boolean, services?: ReadonlyArray<string>): Promise<void> {
  const config = await loadProject(configPath);
  const servicesToBuild = [];
  const configuredServices = config.parsed.services.map((service : ServiceInfo) => service.name);
  if (services && services.length > 0) {
    const containsAll = services.every(name => configuredServices.includes(name));
    if (!containsAll) {
      console.error(`❌ Services ${services.join(", ")} not found in configuration.`);
      process.exit(1);
    }
    servicesToBuild.push(...services);
  } if (services && services.length === 0) {
    servicesToBuild.push(...configuredServices);
  }

  if (watchBackend) {
    console.log('🔄 Watching for backend changes...');
    await startWatchMode(buildMode, config, servicesToBuild);
    process.exit(0);
  }

  if (buildBefore) {
    build(buildMode, config, servicesToBuild);
    console.log('✅ Build finished successfully!');
  }

  const server = spawn('node', [`dist/${buildMode}/server/main.cjs`], { stdio: 'inherit' });
  server.on('error', (error) => {
    console.error('Error starting server:', error);
  });
}

