const puppeteer = require('../..');
puppeteer.launch({
  pipe: false,
  executablePath: process.env.CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
}).then(async browser => {
  const origin = browser.wsEndpoint().match(/ws:\/\/([0-9A-Za-z:\.]*)\//)[1];
  const page = await browser.newPage();
  await page.goto(`http://${origin}/json/protocol`);
  const json = JSON.parse(await page.evaluate(() => document.documentElement.innerText));
  await browser.close();
  const output = `// This is generated from /utils/protocol-types-generator/index.js
declare global {
  module Protocol {
    ${json.domains.map(domain => `${domain.description ? `
    /**
     * ${domain.description}
     */` : ''}
    export module ${domain.domain} {
      ${(domain.types || []).map(type => `${type.description ? `
        /**
         * ${type.description}
         */` : ''}${type.properties ? `
          export interface ${type.id} {
          ${(type.properties || []).map(property => `${property.description ? `
            /**
             * ${property.description}
             */` : ''}
            ${property.name}${property.optional ? '?' : ''}: ${typeOfProperty(property)};
          `).join(``)}
        }` : `
        export type ${type.id} = ${typeOfProperty(type)};`}
      `).join('')}
    }
    `).join('')}
  }
}
// empty export to keep file a module
export {}
`;
  require('fs').writeFileSync(require('path').join(__dirname, '..', '..', 'lib', 'protocol.d.ts'), output);
});

function typeOfProperty(property) {
  if (property.$ref) return property.$ref;
  if (property.enum) return property.enum.map(value => JSON.stringify(value)).join('|');
  switch (property.type) {
    case 'array':
      return typeOfProperty(property.items) + '[]';
    case 'integer':
      return 'number';
  }
  return property.type;
}