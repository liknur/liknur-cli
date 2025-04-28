import { PathLike } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { copyFile, mkdir } from 'fs/promises';

function generateCertificates(certDir : PathLike) {
  const keyPath = path.join(certDir.toString(), 'key.pem');
  const certPath = path.join(certDir.toString(), 'cert.pem');
  const csrPath = path.join(certDir.toString(), 'csr.pem');

  try {
    console.log('Generating self-signed certificates...');
    execSync(`openssl genrsa -out ${keyPath} 2048`);
    execSync(`openssl req -new -key ${keyPath} -out ${csrPath} -subj "/C=US/ST=Mazowieckie/L=Warsaw/O=FlowCortex/OU=Development/CN=localhost"`);
    execSync(`openssl x509 -req -days 365 -in ${csrPath} -signkey ${keyPath} -out ${certPath}`);
    console.log('Certificates generated successfully.');
  } catch (error) {
    console.error('Error generating certificates:', error);
  }
}

export async function setupCertificates(certOption : "self-signed" | PathLike | undefined) : Promise<void> {
  const certPath : PathLike = path.resolve(process.cwd(), 'dist', 'certificates');
  await mkdir(certPath, { recursive: true });
  if (certOption === "self-signed") {
    generateCertificates(certPath);
  } else if (certOption) {
    const srcCertPath : PathLike = path.join(certOption.toString(), 'cert.pem');
    const srcKeyPath : PathLike = path.join(certOption.toString(), 'key.pem');
    const dstCertPath : PathLike = path.join(certPath.toString(), 'cert.pem');
    const dstKeyPath : PathLike = path.join(certPath.toString(), 'key.pem');
    console.log(`Copying certificates from ${srcCertPath} to ${dstCertPath} and ${dstKeyPath}`);
    await copyFile(srcCertPath, dstCertPath);
    console.log(`Copying certificates from ${srcKeyPath} to ${dstKeyPath}`);
    await copyFile(srcKeyPath, dstKeyPath);
  }
}
