#!/usr/bin/env node
'use strict';

const {
  REQUIRED_SECRETS,
  validatePublicationContract
} = require('./public-metadata-lib');

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
    command: 'public-metadata-ci-plan',
    repoPath: repoRoot,
    summary: {
      errors: result.errors.length,
      warnings: result.warnings.length
    },
    details: {
      eligible: result.eligible,
      repoName: result.repoName,
      publishPrefix: `repos/${result.repoName}/`,
      requiredSecrets: REQUIRED_SECRETS,
      warnings: result.warnings,
      errors: result.errors,
      artifacts: result.currentManifest.artifacts
    }
  };

  if (hasFlag('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`public-metadata-ci plan: eligible=${result.eligible ? 'yes' : 'no'} errors=${result.errors.length} warnings=${result.warnings.length}\n`);
  }

  if (hasFlag('--assert-eligible') && !result.eligible) {
    process.exit(1);
  }
}

main();
