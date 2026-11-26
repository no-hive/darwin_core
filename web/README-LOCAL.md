# Darwin Core Protocol — local development

Install the Node.js version specified in `package.json` and Python 3 with Pillow. Then run these commands from `web`:

```sh
npm ci
npm run build
node start-local.mjs
```

The build fetches published articles and images from Sanity (`0ypa3y83`, `production`) and requires network access. The output is in `web/dist/`; the local server runs at `http://127.0.0.1:4173/`.

The site is static: after publishing changes in Studio, rebuild and redeploy the site. An automatic build webhook has not been configured.
