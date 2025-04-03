import { PathLike } from "fs";
import { updateDependentConfigFiles } from "./../common/update.js";
import { loadProject } from "./../common/load-config.js";

export default async function update(configPath: PathLike): Promise<void> {
  const config = await loadProject(configPath);

  await updateDependentConfigFiles(config);
}

