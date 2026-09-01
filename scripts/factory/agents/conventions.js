const fs = require('fs');
const path = require('path');

const { ROOT_DIR, relativeToRoot } = require('./utils');

const PAGES_DIR = path.join(ROOT_DIR, 'src', 'css', 'pages');
const SPACING_FILE = path.join(ROOT_DIR, 'src', 'css', 'abstracts', '_margins.scss');
const TEMPLATE_FAMILY_STYLE_FILES = new Set([
  'shop',
  'product',
  'product-category',
  'cart',
  'checkout',
  'account',
  'search'
]);

function listFiles(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }
  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function readSpacingValues() {
  const source = fs.readFileSync(SPACING_FILE, 'utf8');
  const match = source.match(/\$xl-min-values:\s*\(([^)]+)\)/);
  if (!match) {
    throw new Error('Could not read Factory spacing values from _margins.scss.');
  }
  return match[1]
    .split(',')
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter(Number.isFinite);
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function spacingSuggestion(property, value) {
  const prefixes = {
    'padding-top': 'pt',
    'padding-bottom': 'pb',
    'padding-left': 'pl',
    'padding-right': 'pr',
    'margin-top': 'mt',
    'margin-bottom': 'mb',
    'margin-left': 'ml',
    'margin-right': 'mr'
  };
  return `${prefixes[property]}-${value}`;
}

function lintSpacing(filePath, spacingValues) {
  const source = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const declarationPattern = /\b(padding-top|padding-bottom|padding-left|padding-right|margin-top|margin-bottom|margin-left|margin-right)\s*:\s*(\d+)px\s*;/g;
  let match;
  while ((match = declarationPattern.exec(source))) {
    const value = Number.parseInt(match[2], 10);
    if (spacingValues.includes(value)) {
      issues.push({
        code: 'CUSTOM_SPACING_WHERE_UTILITY_EXISTS',
        file: relativeToRoot(filePath),
        line: lineNumberAt(source, match.index),
        message: `${match[1]}: ${value}px duplicates .${spacingSuggestion(match[1], value)}`
      });
    }
  }

  const shorthandPattern = /\b(padding|margin)\s*:\s*(\d+)px\s*;/g;
  while ((match = shorthandPattern.exec(source))) {
    const value = Number.parseInt(match[2], 10);
    if (spacingValues.includes(value)) {
      issues.push({
        code: 'CUSTOM_SPACING_WHERE_UTILITY_EXISTS',
        file: relativeToRoot(filePath),
        line: lineNumberAt(source, match.index),
        message: `${match[1]}: ${value}px duplicates .${match[1] === 'padding' ? 'p' : 'm'}-${value}`
      });
    }
  }

  const multiValueShorthandPattern = /\b(padding|margin)\s*:\s*([^;]+)\s*;/g;
  while ((match = multiValueShorthandPattern.exec(source))) {
    const tokens = match[2].trim().split(/\s+/);
    if (tokens.length < 2 || tokens.length > 4
      || tokens.some((token) => !/^(?:0|\d+px)$/.test(token))) {
      continue;
    }
    const values = tokens.map((token) => token === '0' ? 0 : Number.parseInt(token, 10));
    const expanded = values.length === 2
      ? [values[0], values[1], values[0], values[1]]
      : values.length === 3
        ? [values[0], values[1], values[2], values[1]]
        : values;
    const sides = ['top', 'right', 'bottom', 'left'];
    const suggestions = [...new Set(expanded.flatMap((value, index) => (
      value > 0 && spacingValues.includes(value)
        ? [spacingSuggestion(`${match[1]}-${sides[index]}`, value)]
        : []
    )))];
    if (suggestions.length > 0) {
      issues.push({
        code: 'CUSTOM_SPACING_WHERE_UTILITY_EXISTS',
        file: relativeToRoot(filePath),
        line: lineNumberAt(source, match.index),
        message: `${match[1]} shorthand duplicates exact utilities: ${suggestions.map((name) => `.${name}`).join(', ')}`
      });
    }
  }

  const gapPattern = /\b(gap|row-gap|column-gap)\s*:\s*(\d+(?:\.\d+)?)rem\s*;/g;
  while ((match = gapPattern.exec(source))) {
    const value = Number.parseFloat(match[2]);
    const suffix = Math.round(value * 100);
    if (value >= 0 && value <= 5 && Number.isInteger(value * 4)) {
      issues.push({
        code: 'CUSTOM_SPACING_WHERE_UTILITY_EXISTS',
        file: relativeToRoot(filePath),
        line: lineNumberAt(source, match.index),
        message: `${match[1]}: ${value}rem duplicates .${match[1]}-${suffix}`
      });
    }
  }
  const gapShorthandPattern = /\bgap\s*:\s*(\d+(?:\.\d+)?)rem\s+(\d+(?:\.\d+)?)rem\s*;/g;
  while ((match = gapShorthandPattern.exec(source))) {
    const row = Number.parseFloat(match[1]);
    const column = Number.parseFloat(match[2]);
    if ([row, column].every((value) => value >= 0 && value <= 5 && Number.isInteger(value * 4))) {
      issues.push({
        code: 'CUSTOM_SPACING_WHERE_UTILITY_EXISTS',
        file: relativeToRoot(filePath),
        line: lineNumberAt(source, match.index),
        message: `gap shorthand duplicates .row-gap-${Math.round(row * 100)} and .column-gap-${Math.round(column * 100)}`
      });
    }
  }
  return issues;
}

function lintPageArchitecture(files) {
  const issues = [];
  const pageNames = files
    .filter((filePath) => path.dirname(filePath) === PAGES_DIR)
    .map((filePath) => path.basename(filePath, '.scss'))
    .filter((name) => name !== '_index');
  files.forEach((filePath) => {
    const relative = path.relative(PAGES_DIR, filePath);
    const basename = path.basename(filePath);
    const name = path.basename(filePath, '.scss');
    if (relative.includes(path.sep)) {
      issues.push({
        code: 'ONE_PAGE_ONE_STYLE_FILE',
        file: relativeToRoot(filePath),
        line: 1,
        message: 'Page-specific SCSS must be a single top-level file in src/css/pages.'
      });
    }
    if (basename.startsWith('_') && basename !== '_index.scss') {
      issues.push({
        code: 'ONE_PAGE_ONE_STYLE_FILE',
        file: relativeToRoot(filePath),
        line: 1,
        message: 'Section partial SCSS is forbidden in src/css/pages; merge it into the page file.'
      });
    }
    if (name.includes('_') && name !== '_index') {
      issues.push({
        code: 'ONE_PAGE_ONE_STYLE_FILE',
        file: relativeToRoot(filePath),
        line: 1,
        message: 'Page-style filenames use one kebab-case page identity; underscore section splits are forbidden.'
      });
    }
    if (['project.scss', 'site.scss', 'style.scss'].includes(basename)) {
      issues.push({
        code: 'ONE_PAGE_ONE_STYLE_FILE',
        file: relativeToRoot(filePath),
        line: 1,
        message: 'A giant all-pages project stylesheet is forbidden; use one file per page.'
      });
    }
    const splitParent = !TEMPLATE_FAMILY_STYLE_FILES.has(name) && pageNames.find((pageName) => pageName !== name
      && (name.startsWith(`${pageName}-`) || name.startsWith(`${pageName}_`)));
    if (splitParent) {
      issues.push({
        code: 'ONE_PAGE_ONE_STYLE_FILE',
        file: relativeToRoot(filePath),
        line: 1,
        message: `This looks like a split of ${splitParent}.scss; merge page-specific sections into that page file.`
      });
    }
  });
  return issues;
}

function lintScssFormat(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  source.split(/\r?\n/).forEach((line, index) => {
    if (/\{[^}]*;[^}]*\}/.test(line) || (/;\s*[^\s/][^:]*:/.test(line) && !line.trim().startsWith('//'))) {
      issues.push({
        code: 'SCSS_MULTILINE_REQUIRED',
        file: relativeToRoot(filePath),
        line: index + 1,
        message: 'Keep one SCSS declaration per line.'
      });
    }
  });
  return issues;
}

function validateConventions() {
  const files = listFiles(PAGES_DIR).filter((filePath) => filePath.endsWith('.scss'));
  const spacingValues = readSpacingValues();
  return [
    ...lintPageArchitecture(files),
    ...files.flatMap((filePath) => lintSpacing(filePath, spacingValues)),
    ...files.flatMap(lintScssFormat)
  ];
}

function factoryValidationCheck() {
  try {
    return {
      label: 'Factory SCSS conventions',
      errors: validateConventions().map(
        (issue) => `${issue.code} ${issue.file}:${issue.line} ${issue.message}`
      )
    };
  } catch (error) {
    return { label: 'Factory SCSS conventions', errors: [error.message] };
  }
}

module.exports = {
  factoryValidationCheck,
  lintPageArchitecture,
  lintScssFormat,
  lintSpacing,
  readSpacingValues,
  TEMPLATE_FAMILY_STYLE_FILES,
  validateConventions
};
