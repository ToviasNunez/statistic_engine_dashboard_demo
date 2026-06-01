#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  normalizeRepoName,
  buildCurrentManifest,
  diffManifests
} = require('./public-metadata-lib');

function readJsonIfExists(absPath) {
  if (!absPath || !fs.existsSync(absPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(absPath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

function writeJson(absPath, value) {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function appendGithubOutput(line) {
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (!githubOutput) return;
  fs.appendFileSync(githubOutput, `${line}\n`);
}

function main() {
  const repoRoot = process.cwd();
  const repoName = normalizeRepoName(
    process.env.MANAGED_REPOSITORY_NAME
      || String(process.env.MANAGED_REPOSITORY || '').split('/').pop()
      || path.basename(repoRoot)
  );

  const previousManifestPath = process.env.PREVIOUS_MANIFEST_PATH || '';
  const currentManifestPath = process.env.CURRENT_MANIFEST_PATH || '';
  const diffPath = process.env.DIFF_PATH || '';

  const previousManifest = readJsonIfExists(previousManifestPath);
  const currentManifest = buildCurrentManifest(repoRoot, repoName);
  const diff = diffManifests(previousManifest, currentManifest);

  if (currentManifestPath) writeJson(currentManifestPath, currentManifest);
  if (diffPath) writeJson(diffPath, diff);

  appendGithubOutput(`should_publish=${diff.shouldPublish ? 'true' : 'false'}`);
  appendGithubOutput(`changed_artifact_count=${diff.changedArtifactCount}`);

  process.stdout.write(`publication should publish: ${diff.shouldPublish ? 'yes' : 'no'}\n`);
  process.stdout.write(`changed artifact count: ${diff.changedArtifactCount}\n`);
  process.stdout.write(`manifest changed: ${diff.manifestChanged ? 'yes' : 'no'}\n`);
}

main();
