import { spawn } from 'child_process';

export function runNpmInstall() {
  const installProcess = spawn('npm', ['install', '--omit-dev'], { stdio: 'inherit', shell: true });

  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Dependencies installed successfully! 🎉');
    } else {
      console.error(`Installation failed with code ${code}. ❌`);
    }
  });
}

export function runNpmBuild(buildType: string, configPath: string) {
  console.log(`Building command: npx liknur-cli build ${buildType} --config "${configPath}"`);
  const buildProcess = spawn('npx', ['liknur-cli', 'build', buildType, `--config "${configPath}"`], { stdio: 'inherit', shell: true });

  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Build completed successfully! 🎉');
    } else {
      console.error(`Build failed with code ${code}. ❌`);
      process.exit(code);
    }
  });
}
