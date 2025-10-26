import {spawnSync} from 'node:child_process';

const {REMOTION_SITE_NAME, REMOTION_BUCKET_NAME, REMOTION_REGION} = process.env;

if (!REMOTION_SITE_NAME || !REMOTION_BUCKET_NAME || !REMOTION_REGION) {
  console.error("Missing REMOTION_* envs. Check .env.local");
  process.exit(1);
}

const args = [
  'remotion', 'lambda', 'sites', 'create',
  'remotion-build',
  '--site-name', REMOTION_SITE_NAME,
  '--bucket-name', REMOTION_BUCKET_NAME,
  '--region', REMOTION_REGION
];

const res = spawnSync('npx', args, {stdio: 'inherit', shell: true});
process.exit(res.status ?? 1);
