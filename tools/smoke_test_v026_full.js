const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const app={innerHTML:'',querySelector(){return null;},insertAdjacentHTML(_p,h){this.innerHTML+=h;}};
const storage=new Map();
const document={getElementById(id){return id==='app'?app:null;},createElement(){return{className:'',textContent:'',remove(){},style:{},appendChild(){}};},body:{appendChild(){}}};
const context={console,Math,Date,JSON,Number,String,Array,Object,Set,Map,Promise,setTimeout(){return 0;},clearTimeout(){},document,app,window:{localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}},fetch:async url=>{const p=path.join(root,url);return fs.existsSync(p)?{ok:true,status:200,json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))}:{ok:false,status:404,json:async()=>({})};}};context.globalThis=context;vm.createContext(context);
const files=['data.js','v024-data.js','game.js','v024-expansion.js','historical-manifest.js','current-2026-major.js','staff-database.js','historical-engine.js','staff-market-v026.js','youth-market-v026.js','v026-management.js','v026-frontoffice.js'];
for(const f of files)vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f,timeout:30000});
const run=code=>vm.runInContext(code,context,{timeout:30000});
(async()=>{
  const check=(cond,msg)=>{if(!cond)throw new Error(msg)};
  check(app.innerHTML.includes('¿Qué tipo de juego quieres iniciar?'),'Primera pantalla incorrecta');
  check(run('FULL_2026_PACK_V026.teams.length')===34,'2026: equipos incompletos');
  check(run('FULL_2026_PACK_V026.riders.length')===927,'2026: corredores incompletos');
  check(run('STAFF_MARKET_V026.length')===1000,'Staff != 1000');
  check(run("STAFF_MARKET_V026.some(s=>s.sourceType==='real-verified')"),'Sin staff nominal verificado');
  check(run("STAFF_MARKET_V026.some(s=>s.sourceType==='fictional-generated')"),'Sin staff generado');
  check(run('YOUTH_MARKET_V026.length')===1000,'Jóvenes != 1000');
  check(run('Math.max(...YOUTH_MARKET_V026.map(y=>y.base))')<=77,'Base U23 > 77');
  check(run('YOUTH_MARKET_V026.filter(y=>y.potential>=94).length')===1,'Regla 0,1% incumplida');

  // Carrera no GT: 25 equipos.
  await run("chooseGameModeV026('single')");
  const omloop=run("V026Runtime.catalogRaces.find(r=>raceBaseIdV026(r)==='omloop').id");
  run(`chooseSingleRaceV026(${JSON.stringify(omloop)})`); await run('continueCompetitionV026()');
  run("selectTeam('uae')"); check(run('TEAMS.length')===25,`Carrera normal no tiene 25 equipos: ${run('TEAMS.length')}`);
  run('confirmRoster()'); check(run('Game.rosterLocked'),'No confirma roster carrera normal');

  // Staff: fichaje desde otro equipo, mercado U23 e infraestructura.
  run('Game.manager.budget=1000000000');
  const poach=run("STAFF_MARKET_V026.find(s=>staffCurrentTeamV026(s.id)&&staffCurrentTeamV026(s.id)!==Game.selectedTeamId&&!Game.manager.staff[s.id]).id");
  const oldTeam=run(`staffCurrentTeamV026(${JSON.stringify(poach)})`);
  run(`hireStaffV019(${JSON.stringify(poach)})`);
  check(run(`staffCurrentTeamV026(${JSON.stringify(poach)})===Game.selectedTeamId`),'No permite fichar staff rival');
  check(run(`!(Game.v026.teamStaff[${JSON.stringify(oldTeam)}]||[]).includes(${JSON.stringify(poach)})`),'Staff sigue en equipo anterior');
  const youth=run("YOUTH_MARKET_V026.find(y=>!Game.v026.youthSigned.includes(y.id)).id");
  const before=run('Game.riders.length'); run(`signYouthV026(${JSON.stringify(youth)})`);
  check(run('Game.riders.length')===before+1,'No ficha joven');
  const bus=run("V026_BUS_CATALOG.find(x=>!ensureClubAssetsV026().buses.includes(x.id)).id");
  run(`buyBusV026(${JSON.stringify(bus)})`); check(run(`ensureClubAssetsV026().activeBusId===${JSON.stringify(bus)}`),'No compra/activa autobús');
  const dep=run("V026_DEPARTMENTS.find(d=>(ensureClubAssetsV026().departments[d.id]||0)<d.max).id");
  const depBefore=run(`ensureClubAssetsV026().departments[${JSON.stringify(dep)}]||0`); run(`upgradeDepartmentV026(${JSON.stringify(dep)})`);
  check(run(`ensureClubAssetsV026().departments[${JSON.stringify(dep)}]`)===depBefore+1,'No mejora departamento');
  run('simulateFullStageQuick()');
  check(run('Game.lastStage.results.length')>0,'Sin resultados');
  check(!run('Game.lastStage.results.some(x=>!Number.isFinite(x.time))'),'Tiempos inválidos');

  // Tour: 22 equipos.
  run('resetWizardV026();renderHome()'); await run("chooseGameModeV026('single')");
  const tour=run("V026Runtime.catalogRaces.find(r=>raceBaseIdV026(r)==='tour').id"); run(`chooseSingleRaceV026(${JSON.stringify(tour)})`); await run('continueCompetitionV026()'); run("selectTeam('uae')");
  check(run('TEAMS.length')===22,`Tour no tiene 22 equipos: ${run('TEAMS.length')}`); run('confirmRoster()');

  // Multi-era: ventana propia, máximo 22 al contener GT, guardado/carga reconstruye catálogo.
  run('resetWizardV026();renderHome()'); await run("chooseGameModeV026('special-season')");
  run('Game.v026.wizard.selectedYears=[1992,2026];Game.v026.wizard.hostYear=2026'); await run('continueCompetitionV026()');
  check(run("Game.v026.wizard.step==='field'"),'No abre selector multi-era');
  check(run('Game.v026.wizard.selectedFieldTeamIds.length')<=22,'Auto-selección multi-era > 22');
  run('confirmFieldV026()'); const specialTeam=run('Game.v026.wizard.selectedFieldTeamIds[0]'); run(`selectTeam(${JSON.stringify(specialTeam)})`); run('confirmRoster()');
  const teamCount=run('TEAMS.length'),raceCount=run('RACES.length'); check(teamCount<=22,'Pelotón especial > 22'); check(raceCount>0,'Calendario especial vacío');
  run('saveGame(false)'); run('TEAMS.splice(0);RIDERS.splice(0);RACES.splice(0)'); await run('loadGame()');
  check(run('TEAMS.length')===teamCount,'Carga multi-era no restaura equipos');
  check(run('RACES.length')===raceCount,'Carga multi-era no restaura carreras');
  check(run('Game.rosterLocked'),'Carga multi-era pierde convocatoria');

  console.log(JSON.stringify({ok:true,teams2026:34,riders2026:927,staff:1000,youth:1000,normalRaceTeams:25,tourTeams:22,specialTeams:teamCount,specialRaces:raceCount,poachedStaff:poach,signedYouth:youth},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
