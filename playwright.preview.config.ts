import {defineConfig} from '@playwright/test';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

// Izolowane kontrole nakładki. Nie łączą się z Octopusem ani CMS.
const previewDirectory=path.join(tmpdir(),'qa-browser-preview-'+randomUUID());
export default defineConfig<{qaBrowserPreview:boolean}>({
  testDir:'./checks',testMatch:'browser-preview.spec.ts',fullyParallel:true,workers:2,
  retries:0,timeout:20000,outputDir:'.artifact_build/preview-check-results',
  metadata:{qaBrowserPreviewDirectory:previewDirectory,qaBrowserPreviewPositionFile:path.join(previewDirectory,'position.json')},
  reporter:[['list'],['./shared/browser-preview-reporter.cjs']],
  use:{headless:true,channel:'msedge',qaBrowserPreview:true}
});
