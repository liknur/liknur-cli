import webpack from "webpack";
import { PathLike } from "fs";
import type { BuildType } from "liknur-webpack";
import { liknurWebpack } from 'liknur-webpack';
import { updateDependentConfigFiles } from "./../common/update.js";
import { loadProject } from "./../common/load-config.js";
import  formatMessages from "webpack-format-messages";

function runBuild(configs: webpack.Configuration[]) {
  const compiler = webpack(configs);

  compiler.run((err, multiStats) => {
    if (err || multiStats == null) {
      console.error("❌ Build failed:", err);
      process.exit(1);
    }

    for (const stats of multiStats.stats) {
      if (stats.hasErrors()) {
        const messages = formatMessages(stats);

        if (messages.errors.length) {
          console.error('❌ Build failed with errors:\n');
          messages.errors.forEach(msg => console.error(msg));
        } else if (messages.warnings.length) {
          console.warn('⚠️ Build finished with warnings:\n');
          messages.warnings.forEach(msg => console.warn(msg));
        } else {
          console.log('✅ Build successful!');
        }
      }
    }
    compiler.close(() => {});
  });
}

export default async function build(buildMode: BuildType, services: string[], configPath: PathLike): Promise<void> {
  const config = await loadProject(configPath);

  const buildResult = liknurWebpack(config, buildMode, services);
  if (Array.isArray(buildResult) && buildResult.length === 0) {
    process.exit(1);
  }
  await updateDependentConfigFiles(config);

  runBuild(buildResult);
}

