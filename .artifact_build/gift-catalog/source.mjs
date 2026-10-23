import { request } from '@playwright/test';
import { ensureSession } from '../../scripts/auth.mjs';
import { writeFile } from 'node:fs/promises';
const session=await ensureSession();
const api=await request.newContext({storageState:session.storageState});
const response=await api.get('https://octopus.gwodev.pl');
const html=await response.text();
const sources=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
console.log(response.status(),sources);
for(const [i,src] of sources.entries()) {const r=await api.get(new URL(src,'https://octopus.gwodev.pl').href);await writeFile(new URL(`bundle-${i}.js`,import.meta.url),await r.text());}
await api.dispose();
