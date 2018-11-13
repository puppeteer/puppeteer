// @ts-check
const path = require('path');
const puppeteer = require('../..');
module.exports = puppeteer.launch({
  pipe: false,
  executablePath: process.env.CHROME,
}).then(async browser => {
  const origin = browser.wsEndpoint().match(/ws:\/\/([0-9A-Za-z:\.]*)\//)[1];
  const page = await browser.newPage();
  await page.goto(`http://${origin}/json/protocol`);
  const json = JSON.parse(await page.evaluate(() => document.documentElement.innerText));
  const version = await browser.version();
  await browser.close();
  const output = `// This is generated from /utils/protocol-types-generator/index.js
  type binary = string;
declare global {
  module Protocol {${json.domains.map(domain => `${domain.description ? `
    /**
     * ${domain.description}
     */` : ''}
    export module ${domain.domain} {${(domain.types || []).map(type => `${type.description ? `
        /**
         * ${type.description}
         */` : ''}${type.properties ? `
        export interface ${type.id} {${(type.properties || []).map(property => `${property.description ? `
            /**
             * ${property.description}
             */` : ''}
            ${property.name}${property.optional ? '?' : ''}: ${typeOfProperty(property)};`).join(``)}
        }` : `
        export type ${type.id} = ${typeOfProperty(type)};`}`).join('')}
        ${(domain.events || []).map(event => `${event.description ? `
        /**
         * ${event.description}
         */` : ''}${event.parameters ? `
        export type ${event.name}Payload = {${event.parameters.map(parameter => `${parameter.description ? `
            /**
             * ${parameter.description}
             */` : ''}
            ${parameter.name}${parameter.optional ? '?' : ''}: ${typeOfProperty(parameter)};`).join(``)}
        }` : `
        export type ${event.name}Payload = void;`}`).join('')}
        ${(domain.commands || []).map(command => `${command.description ? `
        /**
         * ${command.description}
         */` : ''}
        export type ${command.name}Parameters = {${(command.parameters || []).map(parameter => `${parameter.description ? `
            /**
             * ${parameter.description}
             */` : ''}
            ${parameter.name}${parameter.optional ? '?' : ''}: ${typeOfProperty(parameter)};`).join(``)}
        }
        export type ${command.name}ReturnValue = {${(command.returns || []).map(retVal => `${retVal.description ? `
            /**
             * ${retVal.description}
             */` : ''}
            ${retVal.name}${retVal.optional ? '?' : ''}: ${typeOfProperty(retVal)};`).join(``)}
        }`).join('')}
    }
    `).join('')}
    export interface Events {${json.domains.map(domain => (domain.events || []).map(event => `
      "${domain.domain}.${event.name}": ${domain.domain}.${event.name}Payload;`).join('')).join('')}
    }
    export interface CommandParameters {${json.domains.map(domain => (domain.commands || []).map(command => `
      "${domain.domain}.${command.name}": ${domain.domain}.${command.name}Parameters;`).join('')).join('')}
    }
    export interface CommandReturnValues {${json.domains.map(domain => (domain.commands || []).map(command => `
      "${domain.domain}.${command.name}": ${domain.domain}.${command.name}ReturnValue;`).join('')).join('')}
    }
  }
}
// empty export to keep file a module
export {}
`;
  const outputPath = path.join(__dirname, '..', '..', 'lib', 'protocol.d.ts');
  require('fs').writeFileSync(outputPath, output);
  console.log(`Wrote protocol.d.ts for ${version} to ${path.relative(process.cwd(), outputPath)}`);
});


/**
 * @typedef {Object} Property
 * @property {string=} $ref
 * @property {!Array=} enum
 * @property {string=} type
 * @property {!Property=} items
 * @property {string=} description
 */

/**
 * @param {!Property} property
 * @param {string=} domain
 */
function typeOfProperty(property, domain) {
  if (property.$ref) return property.$ref.includes('.') || !domain ? property.$ref : domain + '.' + property.$ref;
  if (property.enum) return property.enum.map(value => JSON.stringify(value)).join('|');
  switch (property.type) {
    case 'array':
      return typeOfProperty(property.items, domain) + '[]';
    case 'integer':
      return 'number';
  }
  return property.type;
}
