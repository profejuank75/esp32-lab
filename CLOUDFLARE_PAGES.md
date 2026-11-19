# ESP32Lab 3D — Cloudflare Pages

Este repositorio contiene el codigo fuente original del laboratorio.
Los archivos de configuracion de Cloudflare no modifican los componentes,
estilos, rutas ni logica de la app.

## Conectar desde Cloudflare

Abre https://dash.cloudflare.com/ y entra en **Workers & Pages**.
Crea un proyecto de **Pages** con GitHub y selecciona
`profejuank75/esp32-lab`.

| Ajuste | Valor |
| --- | --- |
| Rama de produccion del repositorio del simulador | `main` |
| Framework | Vite |
| Directorio raiz | `/` |
| Comando de compilacion | `npm run build` |
| Carpeta de salida | `dist` |
| Variable de entorno | `NODE_VERSION` = `22` |

El archivo `.node-version` tambien fija Node.js 22 en los sistemas que
lo admiten. `wrangler.toml` declara `./dist` para Cloudflare Pages.

## Pruebas antes de integrar en Profe Juank

1. Comprueba que Cloudflare marca el despliegue como satisfactorio.
2. Abre la URL `https://<nombre-de-proyecto>.pages.dev/` que proporcione Cloudflare.
3. Prueba el modelo 3D, paneles, controles, osciloscopio y quiz.
4. Inserta esa URL real en el iframe del sitio Profe Juank de 2.º BGU,
   exclusivamente en la rama `desarrollo` y con ancho `100%` y alto `850px`.
5. No publicar los cambios en la rama `main` de `profe-juank-web`
   hasta aprobar la vista previa.

Los resultados del quiz no se trasladan automaticamente al modulo docente.
