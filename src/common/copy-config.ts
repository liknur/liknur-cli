import fs from 'fs';
import yaml from 'js-yaml';
import _ from 'lodash';

export async function copyYamlSections(
  sourcePath: string,
  destinationPath: string,
  sections: string[]
) : Promise<void> {
  const fileContent = fs.readFileSync(sourcePath, 'utf8');
  const data = yaml.load(fileContent) as Record<string, any>;

  const result: Record<string, any> = {};

  for (const section of sections) {
    const value = _.get(data, section);
    if (value !== undefined) {
      _.set(result, section, value);
    }
  }

  const outputYaml = yaml.dump(result, { noRefs: true, indent: 2 });
  fs.writeFileSync(destinationPath, outputYaml, 'utf8');
}
