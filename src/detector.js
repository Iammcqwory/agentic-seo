import { join } from 'node:path';
import { fileExists } from './utils.js';

/**
 * Framework definitions with config file patterns and default output directories.
 */
const FRAMEWORKS = [
  {
    name: 'Next.js',
    configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    outputDirs: ['out', '.next/server/pages', 'build'],
  },
  {
    name: 'Docusaurus',
    configFiles: ['docusaurus.config.js', 'docusaurus.config.ts'],
    outputDirs: ['build'],
  },
  {
    name: 'Eleventy',
    configFiles: ['.eleventy.js', 'eleventy.config.js', 'eleventy.config.mjs', 'eleventy.config.cjs'],
    outputDirs: ['_site'],
  },
  {
    name: 'Astro',
    configFiles: ['astro.config.mjs', 'astro.config.js', 'astro.config.ts'],
    outputDirs: ['dist'],
  },
  {
    name: 'Hugo',
    configFiles: ['hugo.toml', 'hugo.yaml', 'hugo.json', 'config.toml'],
    outputDirs: ['public'],
  },
  {
    name: 'Jekyll',
    configFiles: ['_config.yml', '_config.yaml'],
    outputDirs: ['_site'],
  },
  {
    name: 'Gatsby',
    configFiles: ['gatsby-config.js', 'gatsby-config.ts'],
    outputDirs: ['public'],
  },
  {
    name: 'VitePress',
    configFiles: ['.vitepress/config.js', '.vitepress/config.ts', '.vitepress/config.mts'],
    outputDirs: ['.vitepress/dist'],
  },
  {
    name: 'MkDocs',
    configFiles: ['mkdocs.yml', 'mkdocs.yaml'],
    outputDirs: ['site'],
  },
  {
    name: 'Sphinx',
    configFiles: ['conf.py'],
    outputDirs: ['_build/html', 'build/html'],
  },
  {
    name: 'Vite',
    configFiles: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'],
    outputDirs: ['dist'],
  },
];

/**
 * Common static site output directory names to check as fallback.
 */
const FALLBACK_OUTPUT_DIRS = ['_site', 'build', 'dist', 'public', 'out', 'site', 'docs'];

/**
 * Detect the framework used in a project directory.
 * Returns { name, outputDir } or null if detection fails.
 */
export async function detectFramework(projectDir) {
  for (const framework of FRAMEWORKS) {
    for (const configFile of framework.configFiles) {
      if (await fileExists(join(projectDir, configFile))) {
        // Find the first existing output directory
        for (const outputDir of framework.outputDirs) {
          const outputPath = join(projectDir, outputDir);
          if (await fileExists(outputPath)) {
            return { name: framework.name, outputDir: outputPath };
          }
        }
        // Framework detected but no build output found
        return {
          name: framework.name,
          outputDir: null,
          suggestedDirs: framework.outputDirs,
        };
      }
    }
  }
  return null;
}

/**
 * Find the build output directory for a project.
 * Tries framework detection first, then falls back to common directory names.
 */
export async function findOutputDir(projectDir) {
  // Try framework detection
  const framework = await detectFramework(projectDir);
  if (framework?.outputDir) {
    return { framework: framework.name, dir: framework.outputDir };
  }

  // Fallback: look for common output directories
  for (const dir of FALLBACK_OUTPUT_DIRS) {
    const fullPath = join(projectDir, dir);
    if (await fileExists(fullPath)) {
      // Check if it contains HTML files (basic validation)
      return { framework: null, dir: fullPath };
    }
  }

  // Check if the directory itself contains HTML files (already a build output)
  if (await fileExists(join(projectDir, 'index.html'))) {
    return { framework: null, dir: projectDir };
  }

  return {
    framework: framework?.name || null,
    dir: null,
    suggestedDirs: framework?.suggestedDirs || FALLBACK_OUTPUT_DIRS,
  };
}

/**
 * Determine if a given directory is likely a built static site.
 */
export async function isBuiltSite(dir) {
  return fileExists(join(dir, 'index.html'));
}
