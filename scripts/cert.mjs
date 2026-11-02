// Genera un certificado HTTPS de confianza para la IP local con mkcert.
// Uso: pnpm cert   (requiere mkcert: brew install mkcert)
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { networkInterfaces } from 'node:os'

const ips = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === 'IPv4' && !a.internal)
  .map((a) => a.address)

if (ips.length === 0) {
  console.error('No se encontró ninguna IP de red local. ¿Estás conectado a una Wi-Fi?')
  process.exit(1)
}

try {
  execFileSync('mkcert', ['-install'], { stdio: 'inherit' })
} catch {
  console.error('\nNo se encontró mkcert. Instálalo con:  brew install mkcert\n')
  process.exit(1)
}

mkdirSync('certs', { recursive: true })
execFileSync(
  'mkcert',
  ['-key-file', 'certs/key.pem', '-cert-file', 'certs/cert.pem', 'localhost', '127.0.0.1', ...ips],
  { stdio: 'inherit' },
)

const caroot = execFileSync('mkcert', ['-CAROOT']).toString().trim()
console.log(`
Certificado creado para: localhost, ${ips.join(', ')}
Para que un móvil confíe en él, instala en el móvil este archivo:
  ${caroot}/rootCA.pem
Si cambias de red Wi-Fi (cambia la IP), vuelve a ejecutar: pnpm cert
`)
