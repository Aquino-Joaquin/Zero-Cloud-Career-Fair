# Zero-Cloud Career Fair

Prototipo offline-first para ferias de empleo: listado de empresas, perfiles y ofertas laborales.

## Servidor local (para la feria)

```bash
pnpm serve     # compila y arranca el servidor Node: app + API en https://<tu-ip>:3000
pnpm start     # arranca sin recompilar
```

`server/index.js` no tiene dependencias: sirve `dist/`, la API de `server/api.js` y usa HTTPS si existe `certs/`.
Cada petición a `/api/*` aparece en la terminal (útil para enseñar en la demo que Zero-Cloud deja de pedir datos).
Puerto distinto: `PORT=8080 pnpm start`.

## Arrancar (desarrollo)

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (normalmente http://localhost:5173).
`--host` ya está activado, así que también verás una URL de red local (útil para probar desde el móvil; el modo offline en el móvil necesitará HTTPS).

## Estructura

```
server/data/companies.json   Datos (versión + empresas + ofertas). Los usará el servidor Node.
src/types/index.ts           Tipos Company, Job, Dataset
src/services/api.ts          Única puerta de acceso a los datos (hoy: JSON estático)
src/components/              CompanyCard, JobCard
src/pages/                   Home (/), CompanyDetail (/company/:id)
```

Las rutas `/company/<id>` son las que codificarán los QR (ids: greengrid, ecoterra, pixelforge, medalink).

## Modo offline (cómo probarlo)

El Service Worker solo funciona con la versión compilada:

```bash
pnpm offline        # = pnpm build && vite preview  ->  http://localhost:4173
```

1. Abre http://localhost:4173 y navega por algunas empresas (se guardan en IndexedDB).
2. Para el servidor (Ctrl+C) **o** en DevTools → Network marca "Offline".
3. Recarga: la app y los perfiles siguen funcionando.

Ojo: desconectar el Wi-Fi no basta en localhost, porque el servidor sigue en tu propia máquina.

### Cómo fluyen los datos

- `server/api.js`: `GET /api/companies` y `GET /api/updates?since=<ISO>` (lo sirve Vite en dev y preview).
- `src/services/sync.ts`: primera vez descarga todo; después solo las empresas con `updatedAt` más reciente.
- `src/services/database.ts`: IndexedDB. Las páginas **siempre** leen de aquí.
- `src/services/metrics.ts`: peticiones de red, bytes descargados y lecturas locales (reales).

Para probar la sincronización: edita una empresa en `server/data/companies.json` y **sube su `updatedAt`**
(también si cambias una de sus ofertas). Al recargar con conexión, solo se descarga esa empresa.

## Comparación Traditional vs. Zero-Cloud

En `/dashboard`:

- **Interruptor de modo.** *Traditional* pide los datos al servidor en cada vista (como una plataforma en la nube);
  *Zero-Cloud* lee de IndexedDB y solo usa la red para sincronizar. Cada modo tiene sus propios contadores.
- **Run benchmark.** Ejecuta el mismo escenario en los dos modos (1 listado + 20 perfiles); Zero-Cloud empieza con el
  dispositivo vacío, así que incluye su descarga inicial.
- **CO₂e** estimado con CO2.js (`@tgwf/co2`, modelo Sustainable Web Design v4) a partir de los bytes medidos.
  Es una estimación, no una medición de energía (para Wh: Green Metrics Tool).

Prueba offline justa: navega en cada modo con DevTools → Network → Offline y compara "Views served offline" y "Failed views".

## HTTPS en la red local (modo offline en móviles)

El Service Worker solo funciona en un contexto seguro: `localhost` o HTTPS con un certificado de confianza.

```bash
brew install mkcert      # una sola vez
pnpm cert                # genera certs/ para tu IP actual (repetir si cambias de Wi-Fi)
pnpm offline             # ahora sirve https://<tu-ip>:4173
```

Cada móvil de la demo tiene que confiar en la CA de mkcert (`rootCA.pem`, la ruta la imprime `pnpm cert`):
- **iPhone:** envíalo por AirDrop → Ajustes → Perfil descargado → Instalar → Ajustes → General → Información →
  Ajustes de confianza de certificados → activar mkcert.
- **Android:** Ajustes → Seguridad → Cifrado y credenciales → Instalar certificado → Certificado de CA.

Sin certificado (p. ej. móviles del jurado por HTTP): los datos se guardan igual en IndexedDB y la navegación
dentro de la app funciona sin conexión; lo único que falla es **recargar** la página estando offline.

Para quitar HTTPS, borra la carpeta `certs/`.

## Siguientes pasos

1. Medición de energía (Wh) con Green Metrics Tool
