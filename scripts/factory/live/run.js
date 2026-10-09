const fs = require('fs');
const path = require('path');
const { ROOT, read, write, hash, fingerprint, alive } = require('../autopilot/common');
const { loadConfig, checks, url, select } = require('./config');
const { discoverBrowser, getChromium, formatBrowserDiscoveryFailure } = require('../qa/browser');
const { capture, compare } = require('./capture');
const now = () => new Date().toISOString();
function options(argv) {
  const result = { command:argv[0] && !argv[0].startsWith('--') ? argv.shift() : 'run' };
  const allowed = ['config','route','viewport','target','check','evidence','wp-id'];
  while (argv.length) {
    const key = argv.shift()?.replace(/^--/,'');
    if (!allowed.includes(key) || !argv[0] || argv[0].startsWith('--')) throw Error(`INVALID_OPTION: ${key}`);
    result[key] = argv.shift();
  }
  if (!['validate','capture','compare','run','status','review'].includes(result.command)) throw Error('LIVE_COMMAND: validate|capture|compare|run|status|review');
  return result;
}
function fresh(config, configHash) {
  return { source:'live', project:config.project, configHash, createdAt:now(), records:{}, reviews:{}, runs:[] };
}
function record(state, route, viewport) {
  const key = `${route.id}/${viewport.id}`;
  return state.records[key] ||= { routeId:route.id, path:route.path, viewportId:viewport.id };
}
function currentReview(state, route, check, config) {
  const review = state.reviews[route.id]?.[check];
  if (!review) return false;
  if (!fs.existsSync(review.evidence) || hash(fs.readFileSync(review.evidence)) !== review.evidenceHash) return false;
  return config.viewports.every(v => {
    const local = state.records[`${route.id}/${v.id}`]?.local;
    return local?.status === 'DONE' && review.localHashes[v.id] === local.screenshotHash && local.implementationHash === fingerprint()
      && fs.existsSync(local.screenshot) && hash(fs.readFileSync(local.screenshot)) === local.screenshotHash;
  });
}
function registry(config, state) {
  const implementationHash = fingerprint();
  const verified = capture => {
    if (!capture || capture.status !== 'DONE') return capture;
    if (!capture.screenshot || !fs.existsSync(capture.screenshot) || hash(fs.readFileSync(capture.screenshot)) !== capture.screenshotHash)
      return { ...capture, status:'BLOCKED', staleReason:'CAPTURE_HASH_MISMATCH' };
    if (capture.implementationHash && capture.implementationHash !== implementationHash)
      return { ...capture, status:'BLOCKED', staleReason:'LOCAL_CAPTURE_STALE' };
    return capture;
  };
  return config.routes.map(route => {
    const statuses = Object.fromEntries(checks.map(k => [k,'TODO']));
    const rows = config.viewports.map(v => {
      const original = state.records[`${route.id}/${v.id}`];
      if (!original) return undefined;
      const row = { ...original, reference:verified(original.reference), local:verified(original.local) };
      if (row.comparison && (row.reference?.status !== 'DONE' || row.local?.status !== 'DONE'
        || row.comparison.referenceHash !== row.reference.screenshotHash || row.comparison.localHash !== row.local.screenshotHash))
        row.comparison = { ...row.comparison, status:'BLOCKED', error:'COMPARISON_STALE_OR_CAPTURE_INVALID' };
      return row;
    });
    for (const [check,side] of [['referenceCapture','reference'],['localPage','local']]) {
      statuses[check] = rows.every(r => r?.[side]?.status==='DONE') ? 'DONE'
        : rows.some(r => r?.[side]?.status==='BLOCKED') ? 'BLOCKED' : rows.some(r => r?.[side]) ? 'IN_PROGRESS':'TODO';
    }
    statuses.visualQA = rows.every(r => r?.comparison?.status==='DONE') ? 'DONE'
      : rows.some(r => r?.comparison?.status==='BLOCKED') ? 'BLOCKED' : rows.some(r => r?.comparison) ? 'IN_PROGRESS':'TODO';
    for (const check of ['template','content','wcagQA']) {
      statuses[check] = currentReview(state,route,check,config) ? 'DONE' : state.reviews[route.id]?.[check] ? 'IN_PROGRESS':'TODO';
    }
    return { ...route, sourceUrl:url(config.sourceUrl,route.path), localUrl:url(config.localUrl,route.path), statuses,
      ready:checks.every(k => statuses[k]==='DONE'), viewports:rows.map((r,i) => ({ id:config.viewports[i].id, ...r })) };
  });
}
function report(config, state, output) {
  state.updatedAt = now();
  const routes = registry(config,state);
  const summary = { generatedAt:state.updatedAt, project:config.project, source:'live', configHash:state.configHash,
    ready:routes.every(r => r.ready), routes, reviews:state.reviews, runs:state.runs };
  write(path.join(output,'state.json'),state);
  write(path.join(output,'summary.json'),summary);
  const rel = f => path.relative(output,f).replaceAll('\\','/');
  const lines = ['# LIVE migration', '', `Project: ${config.project}; ${summary.generatedAt}`, '',
    'Statuses describe evidence; a reachable local page is not proof of migrated content. WCAG requires manual review.', '',
    '| Route | Reference | Local page | Template | Content | Visual QA | WCAG QA | Ready |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const r of routes) lines.push(`| ${r.id} | ${checks.map(k => r.statuses[k]).join(' | ')} | ${r.ready} |`);
  for (const run of state.runs.filter(run => run.errors.length))
    lines.push('', `Run ${run.id}: ${run.errors.join('; ')}`);
  for (const r of routes) {
    lines.push('', `## ${r.id} ${r.path}`, '', `Source: ${r.sourceUrl}`, '', `Local: ${r.localUrl}`);
    for (const row of r.viewports) {
      lines.push('', `### ${row.id}`);
      for (const side of ['reference','local']) {
        const c = row[side];
        lines.push(`- ${side}: ${c?.status || 'TODO'}${c?.screenshot ? ` — [PNG](${rel(c.screenshot)}), [capture](${rel(c.captureFile)})` : ''}`);
        if (c) lines.push(`  HTTP ${c.httpStatus ?? 'unknown'}; final URL: ${c.finalUrl || 'unknown'}; errors: ${JSON.stringify(c.errors)}`);
        if (c?.staleReason) lines.push(`  Evidence invalid: ${c.staleReason}`);
      }
      if (row.comparison) lines.push(`- comparison: ${row.comparison.status}; ratio: ${row.comparison.ratio ?? 'unavailable'}; ${row.comparison.diff ? `[diff](${rel(row.comparison.diff)})` : row.comparison.error}`);
    }
  }
  fs.writeFileSync(path.join(output,'REPORT.md'),lines.join('\n')+'\n');
  return summary;
}
async function main(argv = process.argv.slice(2)) {
  const opts = options([...argv]);
  const { config, output, configHash } = loadConfig(opts.config);
  const routes = select(config.routes,opts.route,'ROUTE');
  const viewports = select(config.viewports,opts.viewport,'VIEWPORT');
  if (opts.command==='validate') { console.log(`LIVE CONFIG VALID: ${config.routes.length} routes, ${config.viewports.length} viewports`); return; }
  fs.mkdirSync(output,{recursive:true});
  const stateFile = path.join(output,'state.json');
  const state = fs.existsSync(stateFile) ? read(stateFile) : fresh(config,configHash);
  if (state.configHash !== configHash) throw Error('CONFIG_CHANGED: use a new reportDir to retain old references and thresholds');
  if (opts.command==='status') { const rows = registry(config,state); console.log(JSON.stringify(rows,null,2)); return rows; }
  const lock = path.join(output,'lock.json');
  if (fs.existsSync(lock)) {
    if (alive(read(lock).pid)) throw Error('LIVE_RUN_ALREADY_ACTIVE');
    fs.unlinkSync(lock);
  }
  fs.writeFileSync(lock,JSON.stringify({pid:process.pid}),{flag:'wx'});
  let browser, run;
  try {
    if (opts.command==='review') {
      if (routes.length!==1 || !['template','content','wcagQA'].includes(opts.check) || !opts.evidence) throw Error('REVIEW_REQUIRES: --route <id> --check template|content|wcagQA --evidence <file>');
      const r = routes[0];
      const localHashes = {};
      for (const v of config.viewports) {
        const local = record(state,r,v).local;
        if (local?.status!=='DONE' || local.implementationHash!==fingerprint()) throw Error('REVIEW_REQUIRES_CURRENT_LOCAL_CAPTURE_ALL_VIEWPORTS');
        if (!fs.existsSync(local.screenshot) || hash(fs.readFileSync(local.screenshot))!==local.screenshotHash) throw Error('REVIEW_CAPTURE_HASH_MISMATCH');
        localHashes[v.id] = local.screenshotHash;
      }
      if (opts.check==='content' && !opts['wp-id']) throw Error('CONTENT_REQUIRES_WP_ID');
      const evidence = path.resolve(opts.evidence);
      if (!fs.statSync(evidence).isFile() || !fs.statSync(evidence).size) throw Error('EMPTY_REVIEW_EVIDENCE');
      state.reviews[r.id] ||= {};
      state.reviews[r.id][opts.check] = { at:now(), evidence, evidenceHash:hash(fs.readFileSync(evidence)), localHashes, wpId:opts['wp-id'] || null };
      return report(config,state,output);
    }
    if (opts.target && !['reference','local','both'].includes(opts.target)) throw Error('INVALID_CAPTURE_TARGET');
    run = { id:`${new Date().toISOString().replace(/[:.]/g,'-')}-${process.pid}`, command:opts.command, startedAt:now(), routes:routes.map(r=>r.id), viewports:viewports.map(v=>v.id), errors:[] };
    state.runs.push(run);
    const runDir = path.join(output,'runs',run.id);
    const discovery = discoverBrowser();
    if (!discovery.browser) throw Error(formatBrowserDiscoveryFailure(discovery.checks));
    browser = await getChromium().launch({ executablePath:discovery.browser.executablePath, headless:true });
    run.browser = discovery.browser;
    const comparePage = await browser.newPage();
    for (const route of routes) for (const viewport of viewports) {
      const row = record(state,route,viewport);
      const dir = path.join(runDir,route.id,viewport.id);
      if (opts.command!=='compare') {
        for (const side of ['reference','local']) {
          if (opts.command==='run' && side==='reference' && row.reference?.status==='DONE') continue;
          if (opts.command==='capture' && opts.target && opts.target!=='both' && opts.target!==side) continue;
          const captureDir = path.join(dir,side);
          const before = fingerprint();
          const result = await capture(browser,url(side==='reference'?config.sourceUrl:config.localUrl,route.path),viewport,captureDir,config);
          if (side==='local') {
            result.implementationHash = before;
            if (fingerprint()!==before) { result.status='BLOCKED'; result.errors.push({type:'stale',message:'IMPLEMENTATION_CHANGED_DURING_CAPTURE'}); }
            if (result.finalUrl && new URL(result.finalUrl).pathname!==new URL(url(config.localUrl,route.path)).pathname) {
              result.status='BLOCKED'; result.errors.push({type:'routing',message:'LOCAL_PATH_REDIRECTED'});
            }
          }
          row[side] = { ...result, screenshot:result.paths.screenshot ? path.join(captureDir,result.paths.screenshot):null, captureFile:path.join(captureDir,'capture.json') };
          write(row[side].captureFile,row[side]);
          delete row.comparison;
          report(config,state,output);
        }
      }
      if (opts.command==='run' || opts.command==='compare') {
        try {
          if (!row.reference || !row.local) throw Error('REFERENCE_AND_LOCAL_CAPTURE_REQUIRED');
          if (row.local.implementationHash!==fingerprint()) throw Error('LOCAL_CAPTURE_STALE: recapture after build');
          row.comparison = await compare(comparePage,row.reference,row.local,dir,config.visual);
          if (!row.reference.metrics.fonts.ready || !row.local.metrics.fonts.ready || row.reference.metrics.brokenImages.length || row.local.metrics.brokenImages.length || row.reference.errors.length || row.local.errors.length) {
            row.comparison.status='BLOCKED'; row.comparison.error='CAPTURE_ASSET_OR_RUNTIME_ERRORS';
            write(path.join(dir,'comparison.json'),row.comparison);
          }
        } catch (e) { row.comparison={status:'BLOCKED',error:e.message}; }
        write(path.join(dir,'comparison.json'),row.comparison);
      }
      write(path.join(dir,'result.json'),row);
      report(config,state,output);
      console.log(`${route.id}/${viewport.id}: reference=${row.reference?.status || 'TODO'} local=${row.local?.status || 'TODO'} visual=${row.comparison?.status || 'TODO'}`);
    }
    run.finishedAt = now();
    const summary = report(config,state,output);
    const failed = routes.some(r => viewports.some(v => {
      const row = record(state,r,v);
      if (opts.command==='capture') return (opts.target==='reference' ? row.reference : opts.target==='local' ? row.local : {status:row.reference?.status==='DONE' && row.local?.status==='DONE'?'DONE':'BLOCKED'})?.status!=='DONE';
      return row.comparison?.status!=='DONE';
    }));
    if (failed) process.exitCode=1;
    console.log(`Report: ${path.join(output,'REPORT.md')}`);
    return summary;
  } catch (e) {
    if (run) { run.errors.push(e.message); run.finishedAt=now(); }
    if (run && !browser) for (const route of routes) for (const viewport of viewports) {
      const row = record(state,route,viewport);
      if (opts.command==='compare') row.comparison={status:'BLOCKED',error:e.message};
      else for (const side of ['reference','local']) {
        if (opts.command==='run' && side==='reference' && row.reference?.status==='DONE') continue;
        if (opts.command==='capture' && opts.target && opts.target!=='both' && opts.target!==side) continue;
        row[side]={status:'BLOCKED',url:url(side==='reference'?config.sourceUrl:config.localUrl,route.path),errors:[{type:'browser',message:e.message}]};
        delete row.comparison;
      }
    }
    report(config,state,output);
    throw e;
  } finally {
    if (browser) await browser.close().catch(()=>{});
    fs.unlinkSync(lock);
  }
}
if (require.main===module) main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports = { main, options, fresh, record, registry, report };
