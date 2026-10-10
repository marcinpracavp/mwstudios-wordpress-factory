/** Explicit source provisioning: updates existing CB records, never duplicates them. */
const {spawnSync}=require('child_process'),path=require('path'),fs=require('fs');const root=path.resolve(__dirname,'../../../..');const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);};
run('node',['scripts/projects/collegium-balticum/migrate/extract.js']);
const backup=spawnSync('docker',['compose','-p','factory-live-qa','-f','.devcontainer/docker-compose.yml','exec','-T','db','sh','-c','exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" wp'],{cwd:root,maxBuffer:256*1024*1024});if(backup.status!==0)throw Error('Local DB backup failed');fs.writeFileSync(path.join(root,'.factory-cache/live/collegium-balticum/migration/backup-'+new Date().toISOString().replaceAll(':','-')+'.sql'),backup.stdout,{mode:0o600});
run('npm',['run','cb:wp','--','eval-file','/var/www/html/wp-content/themes/mwstudios-wordpress-factory/scripts/projects/collegium-balticum/migrate/import.php']);
run('node',['scripts/projects/collegium-balticum/migrate/media.js']);
run('npm',['run','cb:wp','--','eval-file','/var/www/html/wp-content/themes/mwstudios-wordpress-factory/scripts/projects/collegium-balticum/migrate/import.php']);
run('node',['scripts/projects/collegium-balticum/migrate/styles.js']);run('npm',['run','build']);
