import * as fs from 'fs/promises';
import * as path from 'path';

// Define interfaces
interface DeprecatedApiItem {
  kind: string; // e.g., 'class', 'method', 'property', 'enum', 'interface'
  name: string; // Full path, e.g., Page.foo, puppeteer.FrameManager.Events
  deprecationMessage: string;
  deprecatedSince?: string; // Optional: version when it was deprecated
  packageName: string; // 'puppeteer' or 'puppeteer-core'
}

interface BaselineDeprecatedApis {
  // Storing as a flat list, as package is part of DeprecatedApiItem
  all: DeprecatedApiItem[];
}

// Types for API Extractor JSON
// Based on https://api-extractor.com/pages/tsdoc/doc_comment_syntax/
interface ApiJson {
  members: ApiPackage[];
  // There are other top-level properties like "metadata" but we only need "members"
}

interface ApiPackage {
  kind: 'Package';
  members: ApiItem[];
  name: string;
}

interface ApiItem {
  kind: string; // 'Class', 'Method', 'Property', 'Enum', 'Interface', 'EntryPoint', etc.
  name: string;
  canonicalReference?: string; // Full path, e.g., puppeteer!Page.foo
  members?: ApiItem[]; // For nested items like class members
  docComment?: string; // Raw TSDoc comment
  tsdocComment?: TsDocComment; // Parsed TSDoc comment
}

interface TsDocComment {
  summarySection?: DocBlock;
  remarksBlock?: DocBlock;
  deprecatedBlock?: DocBlock; // This is what we're interested in
  // Other blocks like @params, @returns etc.
}

interface DocBlock {
  kind: 'Block';
  content: DocNode[];
}

interface DocNode {
  kind: 'Paragraph' | 'PlainText' | 'FencedCode' | 'LinkTag' | 'CodeSpan'; // And others
  text?: string; // For PlainText
  // Other properties depending on kind
}


// Paths
const API_JSON_PATHS = {
  puppeteer: path.join('docs', 'puppeteer.api.json'),
  'puppeteer-core': path.join('docs', 'puppeteer-core.api.json'),
};
const BASELINE_FILE_PATH = path.join('docs', 'deprecated-apis.json');
const CHANGELOG_PATH = 'CHANGELOG.md';

async function main() {
  console.log('Starting deprecation tracking...');

  const puppeteerDeprecations = await parseApiJson('puppeteer');
  const puppeteerCoreDeprecations = await parseApiJson('puppeteer-core');

  const allCurrentDeprecations = [
    ...puppeteerDeprecations,
    ...puppeteerCoreDeprecations,
  ];

  // TODO:
  // 3. Combine the deprecation lists (Done)
  // 4. Load the baseline
  const baseline = await loadBaseline();

  // 5. Compare and find new deprecations
  const newDeprecations = compareDeprecations(
    allCurrentDeprecations,
    baseline
  );

  if (newDeprecations.length > 0) {
    console.log(`Found ${newDeprecations.length} new deprecations.`);
    // 6. If new deprecations exist, generate markdown and update CHANGELOG.md
    const markdown = generateDeprecationMarkdown(newDeprecations);
    await updateChangelog(markdown);
  } else {
    console.log('No new deprecations found.');
  }

  // 7. Save the new full list to the baseline
  await saveBaseline(allCurrentDeprecations);

  console.log(
    `Found ${allCurrentDeprecations.length} deprecated items in total.`
  );
  console.log('Deprecation tracking finished.');
}

async function loadBaseline(): Promise<DeprecatedApiItem[]> {
  console.log(`Loading baseline from ${BASELINE_FILE_PATH}...`);
  try {
    const fileContent = await fs.readFile(BASELINE_FILE_PATH, 'utf-8');
    const baselineData = JSON.parse(fileContent) as BaselineDeprecatedApis;
    // Ensure 'all' property exists and is an array
    if (baselineData && Array.isArray(baselineData.all)) {
      console.log(`Loaded ${baselineData.all.length} items from baseline.`);
      return baselineData.all;
    }
    console.warn(`Baseline file ${BASELINE_FILE_PATH} is not in the expected format (missing 'all' array). Returning empty baseline.`);
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(
        `Baseline file ${BASELINE_FILE_PATH} not found. Returning empty baseline.`
      );
    } else {
      console.error(
        `Error loading baseline file ${BASELINE_FILE_PATH}:`,
        error
      );
    }
    return []; // Return empty baseline if file not found or on error
  }
}

async function saveBaseline(
  deprecations: DeprecatedApiItem[]
): Promise<void> {
  console.log(`Saving ${deprecations.length} deprecations to ${BASELINE_FILE_PATH}...`);
  const baselineData: BaselineDeprecatedApis = { all: deprecations };
  try {
    await fs.mkdir(path.dirname(BASELINE_FILE_PATH), { recursive: true });
    await fs.writeFile(
      BASELINE_FILE_PATH,
      JSON.stringify(baselineData, null, 2)
    );
    console.log(`Baseline saved to ${BASELINE_FILE_PATH}.`);
  } catch (error) {
    console.error(`Error saving baseline file ${BASELINE_FILE_PATH}:`, error);
  }
}

function compareDeprecations(
  currentDeprecations: DeprecatedApiItem[],
  baselineDeprecations: DeprecatedApiItem[]
): DeprecatedApiItem[] {
  const baselineNames = new Set(
    baselineDeprecations.map(item => item.name + '@' + item.packageName) // Use name + package as unique key
  );
  return currentDeprecations.filter(
    item => !baselineNames.has(item.name + '@' + item.packageName)
  );
}

function generateDeprecationMarkdown(
  deprecations: DeprecatedApiItem[]
): string {
  if (deprecations.length === 0) {
    return '';
  }

  let markdown = '### New Deprecations\n\n';
  for (const item of deprecations) {
    // Clean up the name for display: remove package prefix if present in canonicalReference
    // e.g., "puppeteer!Page.foo" becomes "Page.foo"
    const displayName = item.name.includes('!')
      ? item.name.substring(item.name.indexOf('!') + 1)
      : item.name;
    markdown += `*   **${item.kind}:** \`${displayName}\` - Deprecated: ${item.deprecationMessage.replace(/\n/g, ' ')}\n`;
  }
  return markdown + '\n'; // Add an extra newline for spacing
}

async function updateChangelog(markdown: string): Promise<void> {
  if (!markdown) {
    return;
  }
  console.log(`Updating ${CHANGELOG_PATH} with new deprecations...`);
  try {
    let changelogContent = await fs.readFile(CHANGELOG_PATH, 'utf-8');
    // Try to find an unreleased section or the top of the changelog
    const unreleasedRegex = /^(##\s*\[\s*UNRELEASED\s*\]|##\s*\[\s*\d+\.\d+\.\d+\s*\])/im;
    const match = unreleasedRegex.exec(changelogContent);

    if (match) {
      // Insert before the found heading
      const insertIndex = match.index;
      changelogContent =
        changelogContent.slice(0, insertIndex) +
        markdown +
        changelogContent.slice(insertIndex);
      console.log('Added deprecations to the unreleased section.');
    } else {
      // If no unreleased section, prepend to the file (or append, depending on preference)
      // Prepending is generally safer for changelogs that list newest first.
      changelogContent = markdown + changelogContent;
      console.warn(
        'No "[UNRELEASED]" or version heading found in CHANGELOG.md. Prepending deprecations to the top.'
      );
    }
    await fs.writeFile(CHANGELOG_PATH, changelogContent);
    console.log(`${CHANGELOG_PATH} updated successfully.`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(
        `${CHANGELOG_PATH} not found. Please ensure it exists at the root of the repository.`
      );
    } else {
      console.error(`Error updating ${CHANGELOG_PATH}:`, error);
    }
  }
}


async function parseApiJson(
  packageName: 'puppeteer' | 'puppeteer-core'
): Promise<DeprecatedApiItem[]> {
  const filePath = API_JSON_PATHS[packageName];
  console.log(`Parsing API JSON for ${packageName} from ${filePath}...`);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const apiJson = JSON.parse(fileContent) as ApiJson;

    const deprecatedItems: DeprecatedApiItem[] = [];

    // The top level "members" array in .api.json usually contains one "Package" item.
    // We need to find the "EntryPoint" within that package.
    const packageItem = apiJson.members.find(m => m.kind === 'Package');
    if (!packageItem || !packageItem.members) {
      console.warn(`No top-level 'Package' or members found in ${filePath}`);
      return [];
    }
    
    const entryPoint = packageItem.members.find(m => m.kind === 'EntryPoint');
    if (!entryPoint || !entryPoint.members) {
      console.warn(`No 'EntryPoint' or members found in ${filePath}`);
      return [];
    }

    function extractDeprecations(
      item: ApiItem,
      parentName: string = ''
    ): void {
      const fullName = parentName
        ? `${parentName}.${item.name}`
        : item.name;

      if (item.tsdocComment?.deprecatedBlock) {
        let deprecationMessage = '';
        // Try to extract a meaningful message from the deprecatedBlock
        // It might be a simple paragraph or more complex.
        // For now, we'll join the text from PlainText nodes.
        const deprecatedContent = item.tsdocComment.deprecatedBlock.content;
        for (const node of deprecatedContent) {
          if (node.kind === 'Paragraph') {
            node.content?.forEach(inlineNode => {
              if (inlineNode.kind === 'PlainText') {
                deprecationMessage += inlineNode.text;
              }
            });
            deprecationMessage += '\n'; // Add newline after paragraph
          } else if (node.kind === 'PlainText') {
            deprecationMessage += node.text;
          }
        }
        deprecationMessage = deprecationMessage.trim();
        if (!deprecationMessage) {
          deprecationMessage = 'Deprecated (no specific message).';
        }

        deprecatedItems.push({
          kind: item.kind,
          // Use canonicalReference if available, otherwise construct from name
          name: item.canonicalReference || fullName,
          deprecationMessage,
          // TODO: Extract deprecatedSince from TSDoc if available
          packageName,
        });
      }

      // Recursively process members of classes, interfaces, namespaces, etc.
      if (item.members) {
        for (const member of item.members) {
          // For members of classes/interfaces, their canonicalReference often already includes the parent.
          // If not, we might need to adjust fullName construction.
          // For now, relying on canonicalReference if present.
          extractDeprecations(member, item.kind === 'Package' || item.kind === 'EntryPoint' ? '' : fullName);
        }
      }
    }

    // Start traversal from the members of the EntryPoint
    for (const member of entryPoint.members) {
      extractDeprecations(member, ''); // entryPoint.name is usually the package name e.g. "puppeteer"
    }
    
    console.log(
      `Found ${deprecatedItems.length} deprecated items in ${packageName}.`
    );
    return deprecatedItems;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`API JSON file not found: ${filePath}. Run 'npm run docs' first.`);
    } else {
      console.error(`Error parsing API JSON file ${filePath}:`, error);
    }
    return []; // Return empty list on error
  }
}

main().catch(error => {
  console.error('Error running deprecation tracker:', error);
  process.exit(1);
});
