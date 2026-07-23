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
 if(!app.innerHTML.includes('¿Qué tipo de juego quieres iniciar?'))throw new Error('No aparece primero el selector de modo');
 if(run('FULL_2026_PACK_V026.teams.length')!==34)throw new Error('2026 no restaura 34 equipos');
 if(run('FULL_2026_PACK_V026.riders.length')!==927)throw new Error('2026 no restaura 927 corredores');
 if(run('STAFF_MARKET_V026.length')!==1000)throw new Error('Mercado staff incompleto');
 if(run('YOUTH_MARKET_V026.length')!==1000)throw new Error('Mercado joven incompleto');
 if(run('Math.max(...YOUTH_MARKET_V026.map(y=>y.base))')>77)throw new Error('Joven demasiado fuerte de inicio');
 if(run('YOUTH_MARKET_V026.filter(y=>y.potential>=94).length')!==1)throw new Error('Regla 0.1% de supertalentos incumplida');

 await run("chooseGameModeV026('single')");
 if(!app.innerHTML.includes('¿Qué carrera quieres disputar?'))throw new Error('No aparece segunda ventana carrera');
 run("chooseSingleRaceV026(V026Runtime.catalogRaces.find(r=>raceBaseIdV026(r)==='tour').id)");
 await run('continueCompetitionV026()');
 if(run('Game.v026.wizard.step')!=='team')throw new Error('No avanza a selección de equipo');
 const uae=run("V026Runtime.catalogTeams.find(t=>t.id==='uae').id");
 run(`selectTeam(${JSON.stringify(uae)})`);
 if(run('TEAMS.length')!==22)throw new Error(`Tour debe tener 22 equipos, tiene ${run('TEAMS.length')}`);
 if(!app.innerHTML.includes('Selecciona 8 corredores'))throw new Error('No aparece convocatoria');
 run('confirmRoster()');
 if(!run('Game.rosterLocked'))throw new Error('No confirma convocatoria');
 run('simulateFullStageQuick()');
 if(!run('Game.lastStage?.results?.length'))throw new Error('No hay resultados');
 if(run('Game.lastStage.results.some(x=>!Number.isFinite(x.time))'))throw new Error('Tiempos inválidos');
 run("Game.activeTab='club';renderRace()");
 if(!app.innerHTML.includes('Centro de operaciones del equipo'))throw new Error('No se renderiza infraestructura');
 run("Game.activeTab='operations';renderRace()");
 if(!app.innerHTML.includes('Mercado global de staff'))throw new Error('No se renderiza mercado staff');
 run("Game.activeTab='contracts';renderRace()");
 if(!app.innerHTML.includes('Mercado U23'))throw new Error('No se renderiza mercado joven');

 // Special multi-era season, selectable field capped at 22 due GT calendar.
 run('resetWizardV026();renderHome()');
 await run("chooseGameModeV026('special-season')");
 run("Game.v026.wizard.selectedYears=[1992,2026];Game.v026.wizard.hostYear=2026");
 await run('continueCompetitionV026()');
 if(run('Game.v026.wizard.step')!=='field')throw new Error('Multi-era no abre ventana de selección de equipos');
 if(run('Game.v026.wizard.selectedFieldTeamIds.length')>22)throw new Error('Campo multi-era excede 22');
 run('confirmFieldV026()');
 if(run('Game.v026.wizard.step')!=='team')throw new Error('No avanza de campo a equipo');
 const specialTeam=run('Game.v026.wizard.selectedFieldTeamIds[0]');
 run(`selectTeam(${JSON.stringify(specialTeam)})`);
 if(run('TEAMS.length')>22)throw new Error('Pelotón especial excede máximo');
 run('confirmRoster()');
 if(!run('Game.rosterLocked'))throw new Error('Convocatoria especial no confirmada');

 console.log(JSON.stringify({ok:true,teams2026:34,riders2026:927,staff:1000,youth:1000,tourTeams:22,specialTeams:run('TEAMS.length')},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
