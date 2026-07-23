const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const app={innerHTML:'',querySelector(){return null;},querySelectorAll(){return[];},insertAdjacentHTML(_p,h){this.innerHTML+=h;},appendChild(){}};
const storage=new Map();
const document={getElementById:id=>id==='app'?app:null,querySelector(){return null;},querySelectorAll(){return[];},createElement(){return{className:'',textContent:'',style:{},appendChild(){},querySelector(){return null;},querySelectorAll(){return[];},remove(){}}},body:{appendChild(){}}};
class MutationObserver{observe(){}disconnect(){}}
const context={console,Math,Date,JSON,Number,String,Array,Object,Set,Map,Promise,setTimeout(fn){if(typeof fn==='function')fn();return 0;},clearTimeout(){},document,app,MutationObserver,window:{location:{origin:'http://localhost'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},addEventListener(){},devicePixelRatio:1},fetch:async url=>{const p=path.join(root,String(url));return{ok:fs.existsSync(p),status:fs.existsSync(p)?200:404,json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))}}};context.globalThis=context;vm.createContext(context);
const files=['data.js','v024-data.js','gpx-stage-data.js','gpx-engine.js','game.js','v024-expansion.js','historical-manifest.js','current-2026-major.js','staff-database.js','historical-engine.js','staff-market-v026.js','youth-market-v026.js','v026-management.js','v026-frontoffice.js','gpx-integration-v027.js','stage-lab-integration-v027.js','v027.js'];
for(const f of files)vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f,timeout:120000});
const run=code=>vm.runInContext(code,context,{timeout:120000});
(async()=>{
  await run("chooseGameModeV026('single')");
  const id=run("V026Runtime.catalogRaces.find(r=>raceBaseIdV026(r)==='tour').id");
  run(`chooseSingleRaceV026(${JSON.stringify(id)})`);await run('continueCompetitionV026()');run("selectTeam('uae')");
  const cfg=run('stageLabEventConfig(getRace())');
  global.window=global;
  require(path.join(root,'stage-lab/config.js'));require(path.join(root,'stage-lab/catalog.js'));require(path.join(root,'stage-lab/generator.js'));
  const tour=global.StageGenerator.generateTour(cfg);
  if(tour.stages.length!==cfg.stageCount)throw new Error('StageGenerator no respeta 21 etapas');
  run(`acceptStageLabTour(Game.selectedRaceId,${JSON.stringify(tour)})`);
  const count=run('getRace().stages.filter(s=>s.gpxAvailable).length');
  if(count!==cfg.stageCount)throw new Error(`Integradas ${count}/${cfg.stageCount} etapas`);
  if(run('getRace().stages.some(s=>!s.sectors.length||!s.profilePoints.length)'))throw new Error('Etapa sin sectores/perfil');
  run('confirmRoster()');
  if(!run('Game.rosterLocked'))throw new Error('Convocatoria no confirmada');
  run('startLiveStage(false);processSector(false)');
  if(!run('Game.live || Game.lastStage'))throw new Error('Motor GPX no avanza');
  console.log(JSON.stringify({ok:true,event:run('getRace().name'),stages:count,totalPoints:run('getRace().stages.reduce((n,s)=>n+s.gpx.points.length,0)'),firstStageSectors:run('getRace().stages[0].sectors.length')},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
