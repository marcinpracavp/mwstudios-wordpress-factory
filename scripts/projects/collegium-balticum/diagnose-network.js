// Read-only, sequential probes. Does not disable TLS verification or bypass access controls.
const dns = require('dns').promises;
const net = require('net');
const tls = require('tls');
const fs = require('fs');
const source = new URL(require('../../../docs/projects/collegium-balticum/live.json').sourceUrl);
async function probe(host, port) {
  const record = {host,port,connected:false,tls:false};
  try { record.addresses = await dns.lookup(host,{all:true}); }
  catch (error) { record.dnsError = error.code; return record; }
  try { record.ipv6 = await dns.resolve6(host); }
  catch (error) { record.ipv6 = []; record.ipv6Lookup = error.code; }
  const started = Date.now();
  await new Promise(resolve => {
    const socket = port === 443 ? tls.connect({host,port,servername:host}) : net.connect({host,port});
    socket.setTimeout(6000);
    socket.on('connect', () => {
      record.connected = true;
      if (port === 80) { socket.end(); resolve(); }
    });
    socket.on('secureConnect', () => {
      record.tls = true; record.authorized = socket.authorized;
      socket.end(); resolve();
    });
    socket.on('error', error => { record.error = error.code; resolve(); });
    socket.on('timeout', () => { record.error = record.connected ? 'TLS_TIMEOUT' : 'TCP_TIMEOUT'; socket.destroy(); resolve(); });
  });
  record.elapsedMs = Date.now()-started;
  record.http = record.connected ? 'NOT_PROBED_BY_TCP_TEST' : 'NOT_REACHED';
  return record;
}
(async () => {
  const report = {at:new Date().toISOString(),timeoutMs:6000,probes:[]};
  for (const host of [...new Set([source.hostname,source.hostname.replace(/^www\./,'')])]) {
    for (const port of [80,443]) {
      const record = await probe(host,port);
      report.probes.push(record); console.log(JSON.stringify(record));
    }
  }
  fs.writeFileSync('docs/projects/collegium-balticum/TASK-3A-NETWORK.json',JSON.stringify(report,null,2)+'\n');
})().catch(error => { console.error(error.message); process.exitCode=1; });
