const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const app={innerHTML:'',querySelector(){return null;},querySelectorAll(){return[];},insertAdjacentHTML(_p,h){this.innerHTML+=h;},appendChild(){}};
const storage=new Map();
const classList={add(){},remove(){},contains(){return false;}};
const document={
  documentElement:{classList},
  getElementById(id){return id==='app'?app:null;},querySelector(){return null;},querySelectorAll(){return[];},
  createElement(){return{className:'',textContent:'',remove(){},style:{},appendChild(){},querySelector(){return null;}}},
  body:{appendChild(){},classList}
};
class MutationObserver{constructor(cb){this.cb=cb;}observe(){}disconnect(){}}
const windowObj={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{origin:'http://localhost',href:'http://localhost/index.html'},addEventListener(){},removeEventListener(){},devicePixelRatio:1};
const context={console,Math,Date,Intl,JSON,Number,String,Array,Object,Set,Map,Promise,setTimeout(fn){if(typeof fn==='function')fn();return 0;},clearTimeout(){},document,app,window:windowObj,MutationObserver,fetch:async url=>{const p=path.join(root,String(url).replace(/^\.\//,''));return fs.existsSync(p)?{ok:true,status:200,json:async()=>JSON.parse(fs.readFileSync(p,'utf8')),text:async()=>fs.readFileSync(p,'utf8')}:{ok:false,status:404,json:async()=>({}),text:async()=>''};}};
context.globalThis=context;vm.createContext(context);
const files=['data.js','v024-data.js','gpx-stage-data.js','gpx-engine.js','game.js','v024-expansion.js','historical-manifest.js','current-2026-major.js','staff-database.js','historical-engine.js','staff-market-v026.js','youth-market-v026.js','v026-management.js','v026-frontoffice.js','gpx-integration-v027.js','stage-lab-integration-v027.js','v027.js','v028.js'];
for(const f of files)vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f,timeout:120000});
const run=code=>vm.runInContext(code,context,{timeout:120000});
const check=(v,m)=>{if(!v)throw new Error(m)};
(async()=>{
  check(app.innerHTML.includes('v028-mode-card'),'No renderiza cards v0.28');
  check((app.innerHTML.match(/v028-mode-card/g)||[]).length>=4,'Faltan modos visuales');
  check(run('v028Diagnostics().graphiteUI')===true,'Diagnóstico visual no activo');
  await run("chooseGameModeV026('single')");
  check(app.innerHTML.includes('v028-race-grid'),'No renderiza grid de carreras v0.28');
  check(app.innerHTML.includes('v028-race-profile'),'No genera perfiles visuales de carreras');
  run("setV028RaceFilter('grand')");
  check(app.innerHTML.includes('GRAN VUELTA'),'Filtro de grandes vueltas no funciona');
  run("setV028RaceFilter('all')");
  const raceId=run('V026Runtime.catalogRaces[0].id');
  run(`chooseSingleRaceV026(${JSON.stringify(raceId)})`);
  await run('continueCompetitionV026()');
  check(app.innerHTML.includes('v028-team-grid'),'No renderiza selector visual de equipos');
  run("setV028TeamLevelFilter('wt')");
  check(app.innerHTML.includes('v028-team-card'),'Filtro WT vacía el selector');
  const teamId=run('filteredWizardTeamsV026()[0].id');
  run(`chooseManagedTeamV028(${JSON.stringify(teamId)})`);
  check(run('Game.v026.wizard.selectedManagedTeamId')===teamId,'No selecciona equipo visual');
  run('confirmManagedTeamV028()');
  check(run('Game.stageLab.screenActive'),'Confirmar equipo no abre Stage Lab');
  run('skipStageLabForCurrentRace()');
  check(app.innerHTML.includes('v028-roster-grid'),'No renderiza convocatoria v0.28');
  run('confirmRoster()');
  check(run('Game.rosterLocked'),'No confirma convocatoria');
  run('simulateFullStageQuick()');
  check(run('Game.lastStage.results.length')>0,'Simulación sin resultados');
  check(!run('Game.lastStage.results.some(x=>!Number.isFinite(x.time))'),'Tiempos inválidos');
  console.log(JSON.stringify({ok:true,ui:run('v028Diagnostics().version'),teams:run('FULL_2026_PACK_V026.teams.length'),riders:run('FULL_2026_PACK_V026.riders.length'),staff:run('STAFF_MARKET_V026.length'),youth:run('YOUTH_MARKET_V026.length')},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
