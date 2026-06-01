'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SUMMARY_PATH = 'docs/PUBLIC_SAFE_SUMMARY.json';
const METADATA_PATH = '.repo-ai.json';
const CI_CONTRACT_PATH = 'docs/public-metadata/publish-contract.json';

const REQUIRED_SECRETS = Object.freeze([
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'R2_BUCKET_NAME'
]);

const PUBLIC_METADATA_ARTIFACTS = Object.freeze([
  {
    sourcePath: 'docs/PUBLIC_SAFE_SUMMARY.json',
    targetPath: 'PUBLIC_SAFE_SUMMARY.json',
    required: true
  },
  {
    sourcePath: 'docs/architecture/c4/rendered/render-manifest.json',
    targetPath: 'architecture/c4/rendered/render-manifest.json',
    required: false
  },
  {
    sourcePath: 'docs/architecture/c4/rendered/c1-system-context.svg',
    targetPath: 'architecture/c4/rendered/c1-system-context.svg',
    required: false
  },
  {
    sourcePath: 'docs/architecture/c4/rendered/c2-container.svg',
    targetPath: 'architecture/c4/rendered/c2-container.svg',
    required: false
  },
  {
    sourcePath: 'docs/architecture/c4/rendered/c3-component.svg',
    targetPath: 'architecture/c4/rendered/c3-component.svg',
    required: false
  }
]);

const TEMPLATE_MARKER_RE = /\{\{[^}]+\}\}|__TEMPLATE__/;
const SECRET_MARKER_RE = /(password|token|api_key|private_key|secret|credential|aws_secret_access_key)/i;
const PRIVATE_PATH_MARKER_RE = /\/Users\/|\/home\/|[A-Za-z]:\\\\Users\\\\/;
const SECRET_NAME_RE = /(_TOKEN|_SECRET|_API_KEY|_PRIVATE_KEY|PASSWORD|CREDENTIAL)/;
const CREDENTIAL_VALUE_RE = /(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk_(live|test)_[A-Za-z0-9]{16,}|-----BEGIN (?:RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----)/;
const SUSPICIOUS_ASSIGNMENT_RE = /(token|secret|api[_-]?key|private[_-]?key|credential)\s*[:=]\s*[A-Za-z0-9_\-]{16,}/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const APPROVED_SECRET_REFERENCE_NAMES = Object.freeze([
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_BASE_URL'
]);

const ALLOWED_SECRET_REFERENCE_FIELDS = new Set([
  'requiredSecrets',
  'optionalSecrets',
  'secretNames',
  'expectedSecrets'
]);

function exists(absPath) {
  return fs.existsSync(absPath);
}

function readFile(absPath) {
  return fs.readFileSync(absPath, 'utf8');
}

function readJson(absPath) {
  const raw = readFile(absPath);
  return {
    raw,
    json: JSON.parse(raw)
  };
}

function normalizeRepoName(value) {
  const input = String(value || '').trim();
  const safe = input.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return safe || 'repository';
}

function targetKeyFor(repoName, relPath) {
  return `repos/${normalizeRepoName(repoName)}/${relPath}`;
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256File(absPath) {
  return sha256Buffer(fs.readFileSync(absPath));
}

function contentTypeForArtifact(sourcePath) {
  const normalized = String(sourcePath || '').toLowerCase();
  if (normalized.endsWith('.json')) return 'application/json';
  if (normalized.endsWith('.svg')) return 'image/svg+xml';
  return '';
}

function stableSortValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stableSortValue(entry));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const sorted = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = stableSortValue(value[key]);
  }
  return sorted;
}

function stableStringify(value) {
  return JSON.stringify(stableSortValue(value));
}

function collectMarkerFindings(raw, sourcePath, options = {}) {
  const scanSecrets = options.scanSecrets !== false;
  const findings = [];
  if (TEMPLATE_MARKER_RE.test(raw)) {
    findings.push(`${sourcePath}:template-marker-detected`);
  }
  if (scanSecrets && SECRET_MARKER_RE.test(raw)) {
    findings.push(`${sourcePath}:secret-marker-detected`);
  }
  if (PRIVATE_PATH_MARKER_RE.test(raw)) {
    findings.push(`${sourcePath}:private-path-detected`);
  }
  return findings;
}

function collectStringEntries(value, keys = [], out = []) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectStringEntries(entry, keys, out);
    }
    return out;
  }

  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      collectStringEntries(entry, [...keys, key], out);
    }
    return out;
  }

  if (typeof value === 'string') {
    out.push({
      value,
      keys
    });
  }

  return out;
}

function isEnvName(value) {
  return /^[A-Z][A-Z0-9_]{2,}$/.test(value);
}

function isApprovedSecretReference(value, keys) {
  const lastKey = keys.length > 0 ? keys[keys.length - 1] : '';
  return ALLOWED_SECRET_REFERENCE_FIELDS.has(lastKey)
    && APPROVED_SECRET_REFERENCE_NAMES.includes(value);
}

function collectContractSecretFindings(contractRaw, contractJson, sourcePath) {
  const findings = [];

  if (CREDENTIAL_VALUE_RE.test(contractRaw) || SUSPICIOUS_ASSIGNMENT_RE.test(contractRaw)) {
    findings.push(`${sourcePath}:secret-marker-detected`);
  }

  if (!contractJson || typeof contractJson !== 'object') {
    return findings;
  }

  const entries = collectStringEntries(contractJson);
  for (const entry of entries) {
    const value = String(entry.value || '').trim();
    if (!value) continue;

    if (isApprovedSecretReference(value, entry.keys)) {
      continue;
    }

    if (isEnvName(value) && SECRET_NAME_RE.test(value)) {
      findings.push(`${sourcePath}:secret-marker-detected`);
      break;
    }
  }

  return findings;
}

function buildArtifactSnapshot(repoRoot, repoName) {
  return PUBLIC_METADATA_ARTIFACTS.map((artifact) => {
    const absPath = path.join(repoRoot, artifact.sourcePath);
    const artifactExists = exists(absPath);
    const stats = artifactExists ? fs.statSync(absPath) : null;

    return {
      sourcePath: artifact.sourcePath,
      targetKey: targetKeyFor(repoName, artifact.targetPath),
      required: artifact.required === true,
      exists: artifactExists,
      contentType: contentTypeForArtifact(artifact.sourcePath),
      sizeBytes: artifactExists ? Number(stats.size || 0) : 0,
      sha256: artifactExists ? sha256File(absPath) : ''
    };
  });
}

function buildCurrentManifest(repoRoot, repoName) {
  const artifacts = buildArtifactSnapshot(repoRoot, repoName)
    .filter((artifact) => artifact.exists)
    .sort((left, right) => left.targetKey.localeCompare(right.targetKey));

  const manifest = {
    schemaVersion: '1.0.0',
    manifestType: 'public-metadata-publication',
    repoName,
    publishPrefix: `repos/${repoName}/`,
    artifactCount: artifacts.length,
    artifacts
  };

  const hashBasis = {
    ...manifest,
    manifestHash: undefined
  };
  manifest.manifestHash = crypto.createHash('sha256').update(stableStringify(hashBasis)).digest('hex');

  return manifest;
}

function diffManifests(previousManifest, currentManifest) {
  const previousArtifacts = new Map();
  for (const artifact of (previousManifest && Array.isArray(previousManifest.artifacts) ? previousManifest.artifacts : [])) {
    if (!artifact || typeof artifact !== 'object') continue;
    previousArtifacts.set(String(artifact.targetKey || ''), String(artifact.sha256 || ''));
  }

  const changedArtifacts = [];
  for (const artifact of (currentManifest && Array.isArray(currentManifest.artifacts) ? currentManifest.artifacts : [])) {
    if (!artifact || typeof artifact !== 'object') continue;
    const targetKey = String(artifact.targetKey || '');
    if (!targetKey) continue;

    const nextHash = String(artifact.sha256 || '');
    const prevHash = previousArtifacts.get(targetKey) || '';
    if (nextHash !== prevHash) {
      changedArtifacts.push({
        targetKey,
        previousHash: prevHash,
        currentHash: nextHash,
        sourcePath: String(artifact.sourcePath || ''),
        contentType: String(artifact.contentType || '')
      });
    }
    previousArtifacts.delete(targetKey);
  }

  const removedArtifactKeys = Array.from(previousArtifacts.keys()).filter(Boolean).sort();
  const changedArtifactKeys = changedArtifacts.map((artifact) => artifact.targetKey).sort();
  const manifestChanged = !previousManifest
    || String(previousManifest.manifestHash || '') !== String(currentManifest.manifestHash || '');

  return {
    shouldPublish: changedArtifactKeys.length > 0 || removedArtifactKeys.length > 0 || manifestChanged || !previousManifest,
    firstPublication: !previousManifest,
    manifestChanged,
    changedArtifactCount: changedArtifactKeys.length,
    changedArtifactKeys,
    removedArtifactKeys,
    changedArtifacts
  };
}

function validatePublicationContract(repoRoot, options = {}) {
  const repoName = normalizeRepoName(options.repoName || path.basename(path.resolve(repoRoot)));
  const errors = [];
  const warnings = [];

  const metadataAbs = path.join(repoRoot, METADATA_PATH);
  if (!exists(metadataAbs)) {
    errors.push('.repo-ai.json:missing');
  }

  let metadata = null;
  if (exists(metadataAbs)) {
    try {
      metadata = JSON.parse(readFile(metadataAbs));
    } catch (error) {
      errors.push(`.repo-ai.json:json-parse-error:${error.message}`);
    }
  }

  const identity = metadata && metadata.repositoryIdentity && typeof metadata.repositoryIdentity === 'object'
    ? metadata.repositoryIdentity
    : {};

  const identityId = String(identity.id || '').trim();
  const identityTitle = String(identity.title || '').trim();
  if (!UUID_RE.test(identityId)) {
    errors.push('repo-local-identity:id-invalid');
  }
  if (!identityTitle) {
    errors.push('repo-local-identity:title-missing');
  }

  const summaryAbs = path.join(repoRoot, SUMMARY_PATH);
  let summaryRaw = '';
  let summaryJson = null;
  if (!exists(summaryAbs)) {
    errors.push(`${SUMMARY_PATH}:missing`);
  } else {
    try {
      const parsed = readJson(summaryAbs);
      summaryRaw = parsed.raw;
      summaryJson = parsed.json;
    } catch (error) {
      errors.push(`${SUMMARY_PATH}:json-parse-error:${error.message}`);
    }
  }

  if (summaryRaw) {
    errors.push(...collectMarkerFindings(summaryRaw, SUMMARY_PATH, { scanSecrets: true }));
  }

  if (summaryJson && summaryJson.governance && summaryJson.governance.publicSafeApproved !== true) {
    errors.push('public-safe-summary:governance.publicSafeApproved-must-be-true');
  }

  const contractAbs = path.join(repoRoot, CI_CONTRACT_PATH);
  let contractRaw = '';
  let contractJson = null;
  if (!exists(contractAbs)) {
    errors.push(`${CI_CONTRACT_PATH}:missing`);
  } else {
    try {
      const parsed = readJson(contractAbs);
      contractRaw = parsed.raw;
      contractJson = parsed.json;
    } catch (error) {
      errors.push(`${CI_CONTRACT_PATH}:json-parse-error:${error.message}`);
    }
  }

  if (contractRaw) {
    errors.push(...collectMarkerFindings(contractRaw, CI_CONTRACT_PATH, { scanSecrets: false }));
    errors.push(...collectContractSecretFindings(contractRaw, contractJson, CI_CONTRACT_PATH));
  }

  if (contractJson && String(contractJson.contractType || '') !== 'repo-ai-public-metadata-ci') {
    errors.push('publish-contract:type-invalid');
  }

  if (contractJson && contractJson.plan && typeof contractJson.plan === 'object') {
    if (contractJson.plan.eligible !== true) {
      errors.push('publish-contract:plan-not-eligible');
    }
  }

  const summarySha = summaryRaw ? sha256Buffer(Buffer.from(summaryRaw, 'utf8')) : '';
  if (contractJson && contractJson.summary && typeof contractJson.summary === 'object') {
    const expectedSha = String(contractJson.summary.sha256 || '');
    if (summarySha && expectedSha && summarySha !== expectedSha) {
      errors.push('publish-contract:summary-sha-mismatch');
    }
    if (contractJson.summary.publicSafeApproved !== true) {
      errors.push('publish-contract:public-safe-approval-invalid');
    }
  }

  if (contractJson && contractJson.identity && typeof contractJson.identity === 'object') {
    if (String(contractJson.identity.id || '') !== identityId) {
      errors.push('publish-contract:identity-id-mismatch');
    }
    if (contractJson.identity.valid !== true) {
      errors.push('publish-contract:identity-not-valid');
    }
  }

  const requiredSecrets = Array.isArray(contractJson && contractJson.plan && contractJson.plan.requiredSecrets)
    ? contractJson.plan.requiredSecrets.map((entry) => String(entry || ''))
    : [];

  for (const secret of REQUIRED_SECRETS) {
    if (!requiredSecrets.includes(secret)) {
      errors.push(`publish-contract:required-secret-missing:${secret}`);
    }
  }

  const currentManifest = buildCurrentManifest(repoRoot, repoName);
  const contractManifest = contractJson && contractJson.publicationManifest && typeof contractJson.publicationManifest === 'object'
    ? contractJson.publicationManifest
    : null;

  if (!contractManifest) {
    errors.push('publish-contract:publication-manifest-missing');
  } else {
    const contractArtifacts = Array.isArray(contractManifest.artifacts) ? contractManifest.artifacts : [];
    const contractMap = new Map(contractArtifacts.map((entry) => [String(entry.targetKey || ''), String(entry.sha256 || '')]));

    for (const artifact of currentManifest.artifacts) {
      const expectedHash = contractMap.get(String(artifact.targetKey || ''));
      if (!expectedHash) {
        errors.push(`publish-contract:artifact-missing:${artifact.targetKey}`);
        continue;
      }
      if (expectedHash !== String(artifact.sha256 || '')) {
        errors.push(`publish-contract:artifact-sha-mismatch:${artifact.targetKey}`);
      }
      contractMap.delete(String(artifact.targetKey || ''));
    }

    for (const leftover of contractMap.keys()) {
      errors.push(`publish-contract:artifact-not-staged:${leftover}`);
    }
  }

  const optionalRenderManifest = path.join(repoRoot, 'docs/architecture/c4/rendered/render-manifest.json');
  if (!exists(optionalRenderManifest)) {
    warnings.push('C4 rendered assets not found; metadata-only publish.');
  }

  return {
    repoName,
    errors,
    warnings,
    eligible: errors.length === 0,
    summarySha256: summarySha,
    contractPath: CI_CONTRACT_PATH,
    summaryPath: SUMMARY_PATH,
    currentManifest,
    contract: contractJson
  };
}

module.exports = {
  CI_CONTRACT_PATH,
  SUMMARY_PATH,
  REQUIRED_SECRETS,
  normalizeRepoName,
  buildCurrentManifest,
  diffManifests,
  validatePublicationContract
};
