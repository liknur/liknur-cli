import webpack from "webpack";
import { PathLike } from "fs";
import type { BuildType } from "liknur-webpack";
import { liknurWebpack } from 'liknur-webpack';
import { updateDependentConfigFiles } from "./../common/update.js";
import { loadProject } from "./../common/load-config.js";

function runBuild(configs: webpack.Configuration[]) {
  const compiler = webpack(configs);

  compiler.run((err, stats) => {
    if (err) {
      console.error("❌ Build failed:", err);
      process.exit(1);
    }

    if (stats?.hasErrors()) {
      console.error("❌ Build errors:", stats.toJson().errors);
      process.exit(1);
    }

    console.log("✅ Build completed successfully.");
    console.log(stats?.toString({ colors: true }));
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

