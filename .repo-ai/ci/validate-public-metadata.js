#!/usr/bin/env node
'use strict';

const { validatePublicationContract } = require('./public-metadata-lib');

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function main() {
  const repoRoot = process.cwd();
  const repoName = process.env.MANAGED_REPOSITORY_NAME
    || String(process.env.MANAGED_REPOSITORY || '').split('/').pop()
    || undefined;

  const result = validatePublicationContract(repoRoot, { repoName });
  const report = {
    command: 'public-metadata-ci-validate',
    repoPath: repoRoot,
    summary: {
      errors: result.errors.length,
      warnings: result.warnings.length
    },
    findings: {
      errors: result.errors,
      warnings: result.warnings
    },
    recommendations: [],
    details: {
      repoName: result.repoName,
      summaryPath: result.summaryPath,
      contractPath: result.contractPath,
      summarySha256: result.summarySha256,
      eligible: result.eligible
    }
  };

  if (hasFlag('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`public-metadata-ci validate: errors=${report.summary.errors} warnings=${report.summary.warnings}\n`);
    if (result.errors.length > 0) {
      process.stdout.write('errors:\n');
      for (const item of result.errors) {
        process.stdout.write(`- ${item}\n`);
      }
    }
    if (result.warnings.length > 0) {
      process.stdout.write('warnings:\n');
      for (const item of result.warnings) {
        process.stdout.write(`- ${item}\n`);
      }
    }
  }
}

main();
