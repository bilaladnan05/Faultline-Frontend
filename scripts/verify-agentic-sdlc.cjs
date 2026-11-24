const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const required = ['AGENTS.md', '.agent-control/README.md', '.agent-control/handoff.md', '.agent-control/task-state.md', '.agent-control/decisions.md', '.agent-control/status.schema.json', '.agent-control/manifest.json', '.agent-control/review-state.json', '.planning/README.md', '.planning/STATE.md', '.planning/ROADMAP.md'];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.agent-control/manifest.json'), 'utf8'));
const reviewPath = fs.existsSync(path.resolve(root, '..', '.ai', 'review-state.json')) ? path.resolve(root, '..', '.ai', 'review-state.json') : path.join(root, '.agent-control/review-state.json');
const review = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
const failures = [];
if (missing.length) failures.push(`missing required files: ${missing.join(', ')}`);
if (!agents.includes('faultline-verification')) failures.push('AGENTS.md does not reference faultline-verification');
if (!agents.includes('PStack')) failures.push('AGENTS.md does not reference PStack workflows');
if (!manifest.controlPlane || !manifest.revision || !manifest.commit) failures.push('control-plane manifest is incomplete');
if (!['trivial', 'documentation', 'non_trivial'].includes(review.changeClass)) failures.push('review-state changeClass is invalid');
if (review.changeClass === 'non_trivial' && review.architecture.status !== 'complete') failures.push('non-trivial change requires complete PStack architecture evidence');
if (review.changeClass === 'non_trivial' && !['complete', 'not_applicable'].includes(review.goldfish.status)) failures.push('non-trivial change requires Goldfish review or evidence-backed not-applicable decision');
if (!review.architecture.evidence || !review.goldfish.evidence) failures.push('review-state evidence is incomplete');
if (failures.length) {
  console.error(`Agentic SDLC verification failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Agentic SDLC verification passed: required control-plane files and policy markers exist.');
}
