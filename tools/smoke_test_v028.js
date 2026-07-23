const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const app={
  innerHTML:'',
  querySelector(){return null;},
  querySelectorAll(){return[];},
  insertAdjacentHTML(_p,h){this.innerHTML+=h;},
  appendChild(){}
};
const storage=new Map();
const eventListeners={};
const document={
  getElementById(id){return id==='app'?app:null;},
  querySelector(){return null;},
  querySelectorAll(){return[];},
  createElement(){return{className:'',textContent:'',remove(){},style:{},appendChild(){},querySelector(){return null;}};},
  body:{appendChild(){}}
};
class MutationObserver{constructor(cb){this.cb=cb;}observe(){}disconnect(){}}
const windowObj={
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  location:{origin:'http://localhost',href:'http://localhost/index.html'},
  addEventListener(type,fn){(eventListeners[type] ||= []).push(fn);},
  removeEventListener(){},
  devicePixelRatio:1
};
const context={
  console,Math,Date,JSON,Number,String,Array,Object,Set,Map,Promise,
  setTimeout(fn){if(typeof fn==='function')fn();return 0;},clearTimeout(){},
  document,app,window:windowObj,MutationObserver,
  fetch:async url=>{const p=path.join(root,String(url).replace(/^\.\//,''));return fs.existsSync(p)?{ok:true,status:200,json:async()=>JSON.parse(fs.readFileSync(p,'utf8')),text:async()=>fs.readFileSync(p,'utf8')}:{ok:false,status:404,json:async()=>({}),text:async()=>''};}
};
context.globalThis=context;
vm.createContext(context);
const files=['data.js','v024-data.js','gpx-stage-data.js','gpx-engine.js','game.js','v024-expansion.js','historical-manifest.js','current-2026-major.js','staff-database.js','historical-engine.js','staff-market-v026.js','youth-market-v026.js','v026-management.js','v026-frontoffice.js','gpx-integration-v027.js','stage-lab-integration-v027.js','v027.js','v028.js'];
for(const f of files)vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f,timeout:120000});
const run=code=>vm.runInContext(code,context,{timeout:120000});
const check=(cond,msg)=>{if(!cond)throw new Error(msg)};
(async()=>{
  check(app.innerHTML.includes('¿Qué tipo de juego quieres iniciar?'),'No abre el asistente v0.28');
  check(app.innerHTML.includes('GRAPHITE') || app.innerHTML.includes('V0.28'),'No se aplicó la interfaz v0.28');
  check(run("FULL_2026_PACK_V026.calendar.flatMap(r=>r.stages).filter(s=>s.gpxAvailable).length")>=18,'El catálogo 2026 no conserva los GPX incluidos');
  check(run("typeof renderStageLabSetup==='function' && typeof gpxPointAtKm==='function'"),'Módulos GPX no disponibles');
  check(run("v027Diagnostics().version")==='v0.27-gpx-stage-lab','Versión v0.27 no inicializada');
  check(!run("isGrandTourFieldRaceV026(FULL_2026_PACK_V026.calendar.find(r=>r.id==='uae_tour'))"),'UAE Tour se confunde con Tour de France');
  check(run("isGrandTourFieldRaceV026(FULL_2026_PACK_V026.calendar.find(r=>r.id==='tour'))"),'Tour de France no se reconoce como gran vuelta');

  // Carrera individual: selección → Stage Lab → aceptación GPX → convocatoria.
  await run("chooseGameModeV026('single')");
  const sanremo=run("V026Runtime.catalogRaces.find(r=>raceBaseIdV026(r)==='sanremo').id");
  run(`chooseSingleRaceV026(${JSON.stringify(sanremo)})`);
  await run('continueCompetitionV026()');
  run("selectTeam('uae')");
  check(run('Game.stageLab.screenActive'),'Stage Lab no se abre antes de la convocatoria');
  check(app.innerHTML.includes('GRAND TOUR STAGE LAB'),'No se renderiza la ventana Stage Lab');
  const syntheticTour={title:'Prueba GPX v0.27',config:{mode:'australia',seed:27},stages:[{
    id:'test-stage',type:'rolling',routeLabel:'Geelong — Great Ocean Road',source:'test',routeStatus:'local',country:'Australia',regionName:'Victoria',startName:'Geelong',finishName:'Geelong',ascentM:420,summitFinish:false,seed:27,
    points:[
      {distanceKm:0,ele:20,grade:0,lat:-38.15,lon:144.36},
      {distanceKm:1,ele:55,grade:3.5,lat:-38.14,lon:144.35},
      {distanceKm:2,ele:120,grade:6.5,lat:-38.13,lon:144.34},
      {distanceKm:3,ele:70,grade:-5,lat:-38.12,lon:144.33},
      {distanceKm:4,ele:145,grade:7.5,lat:-38.11,lon:144.32},
      {distanceKm:5,ele:80,grade:-6.5,lat:-38.10,lon:144.31},
      {distanceKm:6,ele:95,grade:1.5,lat:-38.09,lon:144.30}
    ]
  }]};
  run(`acceptStageLabTour(Game.selectedRaceId,${JSON.stringify(syntheticTour)})`);
  check(!run('Game.stageLab.screenActive'),'Stage Lab no se cierra al aceptar');
  check(app.innerHTML.includes('Selecciona 8 corredores'),'No avanza a convocatoria tras aceptar GPX');
  check(run('getRace().stages[0].gpxAvailable'),'La etapa aceptada no queda marcada como GPX');
  check(run('getRace().stages[0].gpx.points.length')===7,'Puntos GPX no conservados');
  check(run('getRace().stages[0].sectors.length')>0,'No genera sectores GPX');
  check(run("getRace().stages[0].type")==='hilly','El relieve GPX no actualiza el tipo de etapa de carretera');
  run('confirmRoster()');
  check(run('Game.rosterLocked'),'No confirma la convocatoria tras Stage Lab');
  check(app.innerHTML.includes('gpx-profile-canvas'),'El perfil GPX no sustituye al perfil sintético');
  run('simulateFullStageQuick()');
  check(run('Game.lastStage.results.length')>0,'Simulación GPX sin resultados');
  check(!run('Game.lastStage.results.some(x=>!Number.isFinite(x.time))'),'Simulación GPX genera tiempos inválidos');
  check(run('Game.lastStage.telemetryV024 && Object.keys(Game.lastStage.telemetryV024).length>0'),'No conserva telemetría postetapa');

  // Modo temporada: el laboratorio debe volver a abrirse en el evento activo.
  run('resetWizardV026();renderHome()');
  await run("chooseGameModeV026('season')");
  // Reduce el test a dos eventos para verificar encadenado sin coste excesivo.
  run('Game.v026.wizard.selectedRaceIds=V026Runtime.catalogRaces.slice(0,2).map(r=>r.id)');
  await run('continueCompetitionV026()');
  run("selectTeam('uae')");
  check(run('Game.stageLab.screenActive'),'Temporada no abre Stage Lab para la primera carrera');
  run('skipStageLabForCurrentRace()');
  check(app.innerHTML.includes('Selecciona 8 corredores'),'Saltar GPX no lleva a convocatoria');
  run('confirmRoster()');
  check(run('Game.mode')==='season','Se pierde el modo temporada');

  // Multi-era: conserva selector de pelotón y abre Stage Lab tras elegir equipo.
  run('resetWizardV026();renderHome()');
  await run("chooseGameModeV026('special-single')");
  run('Game.v026.wizard.selectedYears=[1992,2026];Game.v026.wizard.hostYear=2026');
  await run('continueCompetitionV026()');
  check(run("Game.v026.wizard.step==='field'"),'Multi-era pierde selector de pelotón');
  run('confirmFieldV026()');
  const specialTeam=run('Game.v026.wizard.selectedFieldTeamIds[0]');
  run(`selectTeam(${JSON.stringify(specialTeam)})`);
  check(run('Game.stageLab.screenActive'),'Multi-era no abre Stage Lab');
  check(run('TEAMS.length')<=22,'Multi-era supera el límite de equipos en gran vuelta');

  console.log(JSON.stringify({
    ok:true,
    version:run('v027Diagnostics().version'),
    initialGpxStages:run("FULL_2026_PACK_V026.calendar.flatMap(r=>r.stages).filter(s=>s.gpxAvailable).length"),
    generatedSectors:run('Game.stageLab.screenActive ? 0 : getRace().stages[0].sectors.length'),
    teams2026:run('FULL_2026_PACK_V026.teams.length'),
    riders2026:run('FULL_2026_PACK_V026.riders.length'),
    staff:run('STAFF_MARKET_V026.length'),
    youth:run('YOUTH_MARKET_V026.length')
  },null,2));
})().catch(error=>{console.error(error);process.exit(1);});
