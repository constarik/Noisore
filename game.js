// game.js — NOISORE v11.2 shared game logic
requireEngine(1);
var CFG={mode:'solo',gridSize:6,rotate:true,stake:0,numBots:2,fighter:'DEEP',bets:{}};
var BOT_POOL=[
    {name:'Axel',color:'#4ad',strat:'DEEP',noise:15},
    {name:'Kira',color:'#d4a',strat:'LIGHT',noise:20},
    {name:'Rex',color:'#4d8',strat:'SNIPER',noise:25},
    {name:'Nova',color:'#a6f',strat:'GREEDY',noise:20},
    {name:'Zed',color:'#f66',strat:'RANDOM',noise:30},
    {name:'Ivy',color:'#6d6',strat:'POWER',noise:15},
    {name:'Bolt',color:'#fa0',strat:'RANDOM',noise:35},
    {name:'Luna',color:'#8af',strat:'DEEP',noise:25},
    {name:'Jinx',color:'#f4a',strat:'RANDOM',noise:40},
    {name:'Sage',color:'#ad4',strat:'LIGHT',noise:10},
    {name:'Dex',color:'#6af',strat:'RANDOM',noise:45}
];
var BET_FIGHTERS=[
    {name:'Professor',strat:'DEEP',color:'#4ad',noise:10},
    {name:'Scout',strat:'LIGHT',color:'#d4a',noise:20},
    {name:'Crow',strat:'SNIPER',color:'#4d8',noise:25},
    {name:'Mole',strat:'GREEDY',color:'#a6f',noise:25},
    {name:'Colonel',strat:'POWER',color:'#fa0',noise:15},
    {name:'Daisy',strat:'RANDOM',color:'#f66',noise:40}
];
var OVERROUND=1.05;
var SKIN_PACKS=[
    ['Professor','Scout','Crow','Mole','Colonel','Daisy'],
    ['Brains','Quickie','Thief','Rat','Bull','Rookie'],
    ['Counter','Dealer','Hustler','Shark','Bouncer','Lucky'],
    ['Navigator','Lookout','Gunner','Digger','Captain','Parrot'],
    ['Coach','Sprinter','Striker','Keeper','Enforcer','Benchman'],
    ['Analyst','Mole','Hitman','Hoarder','Commando','Decoy']
];
function randomizeFighterNames(){
    var pack=SKIN_PACKS[Math.floor(gameRng()*SKIN_PACKS.length)];
    for(var i=0;i<BET_FIGHTERS.length;i++){
        BET_FIGHTERS[i].name=pack[i];
        if(BET_FIGHTERS[i].strat==='RANDOM'){
            BET_FIGHTERS[i].noise=20+Math.floor(gameRng()*31);// 20-50
        }else{
            BET_FIGHTERS[i].noise=5+Math.floor(gameRng()*41);// 5-45
        }
    }
    updateFighterButtons();
}
function updateFighterButtons(){
    var row=document.getElementById('fighter-btns');
    if(!row)return;
    row.innerHTML='';
    CFG.bets={};
    BET_FIGHTERS.forEach(function(f){
        var btn=document.createElement('button');
        btn.className='lbtn';
        btn.style.borderColor=f.color;
        btn.style.whiteSpace='nowrap';
        btn.style.fontSize='11px';
        btn.style.padding='6px 8px';
        btn.textContent=f.name;
        btn.onclick=function(){betAdd(f.name);};btn.oncontextmenu=function(e){e.preventDefault();betRemove(f.name);return false;};
        row.appendChild(btn);
    });
    calcOdds();updateBetDisplay();
}
var BET_DATA={
    '6-off':[19.9,17.0,18.7,18.8,19.8,5.9],
    '6-on': [18.8,19.2,17.9,17.8,18.1,8.2],
    '8-off':[19.8,17.5,18.8,18.8,19.7,5.5],
    '8-on': [19.4,18.7,18.5,18.4,18.9,6.1]
};
function calcOdds(){
    var key=CFG.gridSize+'-'+(CFG.rotate?'on':'off');
    var pure=BET_DATA[key];
    var daisyIdx=5; // RANDOM is last
    var daisyPure=pure[daisyIdx];
    // avg of non-Daisy pure pcts
    var sumOthers=0;for(var j=0;j<pure.length;j++){if(j!==daisyIdx)sumOthers+=pure[j];}
    var avgOthers=sumOthers/(pure.length-1);
    // calc effective pcts
    var eff=[];
    for(var i=0;i<BET_FIGHTERS.length;i++){
        var n=BET_FIGHTERS[i].noise/100;
        if(i===daisyIdx){
            eff.push(daisyPure*(1-n)+avgOthers*n);
        }else{
            eff.push(pure[i]*(1-n)+daisyPure*n);
        }
    }
    // normalize to 100%
    var total=0;for(var k=0;k<eff.length;k++)total+=eff[k];
    for(var m=0;m<BET_FIGHTERS.length;m++){
        BET_FIGHTERS[m].pct=Math.round(eff[m]/total*1000)/10;
        BET_FIGHTERS[m].odds=Math.round(100/BET_FIGHTERS[m].pct/OVERROUND*10)/10;
    }
}
// === LOBBY ===
function setMode(m){
    sndPlay('click');
    CFG.mode=m;
    document.querySelectorAll('#lobby .lobby-section:first-child .lbtn').forEach(function(b){b.classList.remove('active');});
    document.getElementById('mode-'+m).classList.add('active');
    document.getElementById('bots-section').style.display=m==='pvp'?'':'none';
    document.getElementById('stake-section').style.display=m==='solo'?'none':'';
    document.getElementById('fighter-section').style.display=m==='bet'?'':'none';
    var stakeLabel=document.getElementById('stake-label');
    if(stakeLabel)stakeLabel.textContent=m==='bet'?'Bet size':'Stake per drop';
    var freeBtn=document.getElementById('stake-0');
    if(freeBtn)freeBtn.style.display=m==='bet'?'none':'';
    if(m==='bet'&&CFG.stake===0){setStake(1);}
    if(m==='bet'){randomizeFighterNames();}
    var pb=document.querySelector('.play-btn');
    if(pb){if(m!=='bet'){pb.style.opacity='1';pb.style.pointerEvents='auto';}else{var t=0;for(var k in CFG.bets)t+=CFG.bets[k];pb.style.opacity=t>0?'1':'0.3';pb.style.pointerEvents=t>0?'auto':'none';}}
}
function setGrid(s){sndPlay('click');CFG.gridSize=s;document.getElementById('grid-6').classList.toggle('active',s===6);document.getElementById('grid-8').classList.toggle('active',s===8);if(CFG.mode==='bet')randomizeFighterNames();else{calcOdds();updateBetDisplay();}}
function setRotation(on){sndPlay('click');CFG.rotate=on;document.getElementById('rot-off').classList.toggle('active',!on);document.getElementById('rot-on').classList.toggle('active',on);if(CFG.mode==='bet')randomizeFighterNames();else{calcOdds();updateBetDisplay();}}
function setStake(v){sndPlay('click');CFG.stake=v;document.querySelectorAll('#stake-section .lbtn').forEach(function(b){b.classList.remove('active');});var id='stake-'+String(v).replace('.','');var el=document.getElementById(id);if(el)el.classList.add('active');updateBetDisplay();}
function setBots(n){sndPlay('click');CFG.numBots=n;document.querySelectorAll('#bots-section .lbtn').forEach(function(b){b.classList.remove('active');});document.getElementById('bots-'+n).classList.add('active');}
function betAdd(name,e){if(e)e.preventDefault();var stk=CFG.stake>0?CFG.stake:1;if(!CFG.bets[name])CFG.bets[name]=0;CFG.bets[name]+=stk;sndPlay('bet');updateBetDisplay();return false;}
function betRemove(name){sndPlay('click');delete CFG.bets[name];updateBetDisplay();}
function betClear(){sndPlay('click');CFG.bets={};updateBetDisplay();}
function updateBetDisplay(){
    var row=document.getElementById('fighter-btns');
    if(row){
        var btns=row.children;
        for(var i=0;i<BET_FIGHTERS.length&&i<btns.length;i++){
            var f=BET_FIGHTERS[i];
            var sum=CFG.bets[f.name]||0;
            var label=f.name+(f.odds?' \u00d7'+f.odds:'');
            btns[i].textContent=label+(sum>0?' ('+sum.toFixed(2)+')':'');
            btns[i].classList.toggle('active',sum>0);
        }
    }
    var total=0;for(var k in CFG.bets)total+=CFG.bets[k];
    var el2=document.getElementById('fighter-odds');
    var isMobile='ontouchstart' in window;
    if(el2)el2.textContent='Total: '+total.toFixed(2)+' USDT'+(isMobile?'  (tap to add)':'  (click +1, right-click -1)');
    var pb=document.querySelector('.play-btn');
    if(pb&&CFG.mode==='bet'){pb.style.opacity=total>0?'1':'0.3';pb.style.pointerEvents=total>0?'auto':'none';}
}
function fitGrid(){
    var h1=document.querySelector('h1');var ver=document.querySelector('.version');
    if(h1)h1.style.display='none';if(ver)ver.style.display='none';
    requestAnimationFrame(function(){
        var vh=window.innerHeight;
        var grid=document.querySelector('.grid-wrap');
        var gridRect=grid.getBoundingClientRect();
        var above=gridRect.top;
        var payout=document.getElementById('payout-area');
        var info=document.querySelector('.info-bar');
        var below=(payout?payout.offsetHeight:0)+(info?info.offsetHeight:0)+12;
        var available=vh-above-below;
        var gap=3;
        var cellH=Math.floor((available-(ROWS-1)*gap)/ROWS);
        var gridW=grid.clientWidth-6;
        var cellW=Math.floor((gridW-(COLS-1)*gap)/COLS);
        var cell=Math.min(cellH,cellW);
        if(cell<20)cell=20;
        if(cell>80)return;
        var cells=document.querySelectorAll('.cell');
        for(var i=0;i<cells.length;i++){cells[i].style.height=cell+'px';cells[i].style.width=cell+'px';}
        document.getElementById('grid').style.gridTemplateColumns='repeat('+COLS+','+cell+'px)';
        document.getElementById('col-btns').style.gridTemplateColumns='repeat('+COLS+','+cell+'px)';
    });
}
function unfitGrid(){
    var h1=document.querySelector('h1');var ver=document.querySelector('.version');
    if(h1)h1.style.display='';if(ver)ver.style.display='';
}
// --- UVS SESSION ---
var UVS_SESSION=null;
function uvsStart(){
    if(typeof UVS==='undefined'||TUT.active)return;
    var arr=new Uint8Array(32);crypto.getRandomValues(arr);
    var ss='';for(var i=0;i<32;i++)ss+=arr[i].toString(16).padStart(2,'0');
    var cs='noisore-'+Date.now();
    var nonce='1';
    var combined=UVS.deriveCombinedSeed(ss,cs,nonce);
    _uvsRng=UVS.ChaCha20.fromCombinedSeed(combined);
    UVS_SESSION={serverSeed:ss,clientSeed:cs,nonce:nonce,serverSeedHash:UVS.sha256(ss),combinedSeed:combined,moves:[],startTime:Date.now()};
}
function uvsEnd(winner){
    if(!UVS_SESSION||UVS_SESSION.revealed)return;
    UVS_SESSION.revealed=true;UVS_SESSION.winner=winner;UVS_SESSION.endTime=Date.now();UVS_SESSION.rngCalls=_uvsRng?_uvsRng.calls:0;
    console.log('[UVS] Session complete:',JSON.stringify({serverSeedHash:UVS_SESSION.serverSeedHash,clientSeed:UVS_SESSION.clientSeed,rngCalls:UVS_SESSION.rngCalls,winner:winner}));
    console.log('[UVS] Reveal — serverSeed:',UVS_SESSION.serverSeed);
    console.log('[UVS] Verify: SHA-256(serverSeed) ===',UVS.sha256(UVS_SESSION.serverSeed),'===',UVS_SESSION.serverSeedHash,'?',UVS.sha256(UVS_SESSION.serverSeed)===UVS_SESSION.serverSeedHash);
    _uvsRng=null;
}
function uvsRecordMove(col){
    if(!UVS_SESSION)return;
    UVS_SESSION.moves.push({tick:UVS_SESSION.moves.length,col:col,rngCalls:_uvsRng?_uvsRng.calls:0});
}
function uvsShowVerify(){
    if(!UVS_SESSION)return;
    var s=UVS_SESSION;
    var el=document.getElementById('payout-area');
    var verified=UVS.sha256(s.serverSeed)===s.serverSeedHash;
    el.innerHTML='<div style="text-align:left;font-size:10px;line-height:1.6;padding:8px;background:#0a0a14;border:1px solid #1e1e2e;border-radius:8px;max-height:200px;overflow-y:auto">'+
        '<div style="color:#f59e0b;font-size:12px;font-weight:700;margin-bottom:4px">\uD83D\uDD12 UVS 2.0 — Provably Fair</div>'+
        '<div><span style="color:#888">Server Seed Hash:</span><br><span style="color:#d4d4d8;word-break:break-all;font-size:9px">'+s.serverSeedHash+'</span></div>'+
        '<div style="margin-top:4px"><span style="color:#888">Server Seed (revealed):</span><br><span style="color:#d4d4d8;word-break:break-all;font-size:9px">'+s.serverSeed+'</span></div>'+
        '<div style="margin-top:4px"><span style="color:#888">Client Seed:</span> <span style="color:#d4d4d8">'+s.clientSeed+'</span></div>'+
        '<div style="margin-top:4px"><span style="color:#888">RNG:</span> <span style="color:#d4d4d8">ChaCha20 RFC 8439, '+s.rngCalls+' calls</span></div>'+
        '<div style="margin-top:4px"><span style="color:#888">Moves:</span> <span style="color:#d4d4d8">'+s.moves.length+'</span></div>'+
        '<div style="margin-top:4px"><span style="color:#888">SHA-256 check:</span> <span style="color:'+(verified?'#22c55e':'#f66')+'">'+
        (verified?'\u2713 VERIFIED':'\u2717 MISMATCH')+'</span></div>'+
        '<div style="margin-top:6px;text-align:center"><button onclick="'+(CFG.mode==='bet'?'newBetRound()':'newRound()')+'" style="background:#f59e0b;color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:11px;padding:6px 20px;border:none;border-radius:6px;cursor:pointer">'+(CFG.mode==='bet'?'PLACE BETS':'NEXT ROUND')+'</button></div>'+
        '</div>';
}

function startGame(){
    sndPlay('click');sndInit();
    uvsStart();
    document.getElementById('lobby').style.display='none';
    document.getElementById('game').style.display='block';
    document.body.style.overflow='hidden';
    if('ontouchstart' in window&&document.documentElement.requestFullscreen){try{document.documentElement.requestFullscreen();}catch(e){}}
    COLS=CFG.gridSize;ROWS=CFG.gridSize;MAX_H=10;MAX_DROP=10;
    ROTATE=CFG.rotate;
    DROP_COST=(CFG.mode==='pvp'&&CFG.stake===0)?1:CFG.stake;POOL_RATE=0.95;
    if(CFG.mode==='solo'){
        BOTS=[];
        document.getElementById('pool-area-wrap').style.display='none';
        document.getElementById('game-mode-label').textContent='EROSION';
        document.getElementById('col-btns').style.display='grid';
    }else if(CFG.mode==='bet'){
        calcOdds();
        BOTS=BET_FIGHTERS;
        document.getElementById('pool-area-wrap').style.display='flex';
        document.getElementById('game-mode-label').textContent='Bet&Wet';
        document.getElementById('col-btns').style.display='none';
        DROP_COST=CFG.stake>0?CFG.stake:1;
    }else{
        BOTS=BOT_POOL.slice().sort(function(){return gameRng()-0.5;}).slice(0,CFG.numBots);
        document.getElementById('pool-area-wrap').style.display='flex';
        document.getElementById('game-mode-label').textContent='SOIRON';
        document.getElementById('col-btns').style.display='grid';
    }
    document.getElementById('info-left').textContent=COLS+'\u00d7'+ROWS+(ROTATE?' rotate':'')+' - stone 1-'+MAX_H;
    document.getElementById('info-right').textContent=(DROP_COST>0?DROP_COST.toFixed(2)+' USDT/drop':'free play')+(UVS_SESSION?' \u2022 \uD83D\uDD12 UVS':'');
    document.getElementById('grid').style.gridTemplateColumns='repeat('+COLS+',1fr)';
    document.getElementById('col-btns').style.gridTemplateColumns='repeat('+COLS+',1fr)';
    initGame();
    fitGrid();
    if(CFG.mode==='bet') betRound();
}
function backToLobby(){sndPlay('click');_uvsRng=null;UVS_SESSION=null;unfitGrid();document.getElementById('game').style.display='none';document.getElementById('lobby').style.display='block';document.body.style.overflow='';window.scrollTo(0,0);animating=false;}
// === GAME STATE ===
var COLS=6,ROWS=6,MAX_H=10,MAX_DROP=10,DROP_COST=0,POOL_RATE=0.95,ANIM_DELAY=200;
var ROTATE=true,BOTS=[];
var grid=[],pool=0,balance=100,dropNum=0,roundNum=1,animating=false,currentDrop=0,turnPlayers=[];
var playerDropResults=[];
var playerSpent={};
var TAG_POS=[{top:'1px',left:'2px'},{top:'1px',right:'2px'},{bottom:'1px',left:'2px'},{bottom:'1px',right:'2px'},{top:'1px',left:'50%',tx:'-50%'},{bottom:'1px',left:'50%',tx:'-50%'},{top:'50%',left:'1px',ty:'-50%'},{top:'50%',right:'1px',ty:'-50%'},{top:'30%',left:'2px'},{top:'30%',right:'2px'},{bottom:'30%',left:'2px'},{bottom:'30%',right:'2px'}];
function randH(){return 1+Math.floor(gameRng()*MAX_H);}
function initGrid(){grid=[];for(var r=0;r<ROWS;r++){grid[r]=[];for(var c=0;c<COLS;c++)grid[r][c]=randH();}}
function newRound(){clearPowerTags();initGrid();uvsStart();pool=0;dropNum=0;roundNum++;playerDropResults=[];playerSpent={};document.getElementById('players-list').innerHTML='';updateUI();renderGrid();fitGrid();rollDrop();setColBtnsDisabled(false);}
function initGame(){initGrid();pool=0;balance=100;dropNum=0;roundNum=1;animating=false;updateUI();renderGrid();renderColBtns();rollDrop();}
function stoneClip(r,c){
    var s=((r*7+c*13+grid[r][c]*3+r*r*5+c*c*11)&0xFFFF);
    function rn(){s=(s*1103515245+12345)&0x7FFFFFFF;return(s%1000)/1000;}
    var d=7;var w=5;var pts=[];
    pts.push((rn()*d)+'% '+(rn()*d)+'%');
    pts.push((18+rn()*8)+'% '+(rn()*w)+'%');
    pts.push((42+rn()*16)+'% '+(rn()*w)+'%');
    pts.push((75+rn()*8)+'% '+(rn()*w)+'%');
    pts.push((100-rn()*d)+'% '+(rn()*d)+'%');
    pts.push((100-rn()*d)+'% '+(18+rn()*8)+'%');
    pts.push((100-rn()*w)+'% '+(38+rn()*12)+'%');
    pts.push((100-rn()*w)+'% '+(62+rn()*12)+'%');
    pts.push((100-rn()*d)+'% '+(100-rn()*d)+'%');
    pts.push((78+rn()*8)+'% '+(100-rn()*w)+'%');
    pts.push((55+rn()*12)+'% '+(100-rn()*w)+'%');
    pts.push((30+rn()*12)+'% '+(100-rn()*w)+'%');
    pts.push((rn()*d)+'% '+(100-rn()*d)+'%');
    pts.push((rn()*d)+'% '+(78+rn()*8)+'%');
    pts.push((rn()*w)+'% '+(55+rn()*12)+'%');
    pts.push((rn()*w)+'% '+(25+rn()*12)+'%');
    return 'polygon('+pts.join(',')+')';
}
var stoneSvgEl=null;
function ensureStoneSvg(){
    if(stoneSvgEl)stoneSvgEl.remove();
    stoneSvgEl=document.createElementNS('http://www.w3.org/2000/svg','svg');
    stoneSvgEl.setAttribute('width','0');stoneSvgEl.setAttribute('height','0');
    stoneSvgEl.style.position='absolute';
    var defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
    stoneSvgEl.appendChild(defs);
    document.body.appendChild(stoneSvgEl);
    return defs;
}
function addStoneFilter(defs,id,seed,scale){
    var f=document.createElementNS('http://www.w3.org/2000/svg','filter');
    f.setAttribute('id',id);
    var turb=document.createElementNS('http://www.w3.org/2000/svg','feTurbulence');
    turb.setAttribute('type','turbulence');
    turb.setAttribute('baseFrequency','0.05');
    turb.setAttribute('numOctaves','3');
    turb.setAttribute('seed',String(seed));
    var disp=document.createElementNS('http://www.w3.org/2000/svg','feDisplacementMap');
    disp.setAttribute('in','SourceGraphic');
    disp.setAttribute('scale',String(scale));
    disp.setAttribute('xChannelSelector','R');
    disp.setAttribute('yChannelSelector','G');
    f.appendChild(turb);f.appendChild(disp);defs.appendChild(f);
}
function renderGrid(){var el=document.getElementById('grid');el.innerHTML='';var defs=ensureStoneSvg();for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){var cell=document.createElement('div');cell.className='cell h'+grid[r][c];cell.id='cell-'+r+'-'+c;cell.textContent=grid[r][c]>0?grid[r][c]:'';if(grid[r][c]>0){var fid='sf-'+r+'-'+c;var seed=r*137+c*311+grid[r][c]*53;addStoneFilter(defs,fid,seed,3);cell.style.filter='url(#'+fid+')';cell.style.clipPath=stoneClip(r,c);}el.appendChild(cell);}}
function updateCell(r,c){var cell=document.getElementById('cell-'+r+'-'+c);var tags=cell.querySelectorAll('.power-tag');cell.className='cell h'+grid[r][c];cell.textContent=grid[r][c]>0?grid[r][c]:'';for(var i=0;i<tags.length;i++)cell.appendChild(tags[i]);}
function showPowerTag(r,c,remaining,color,playerIdx){var cell=document.getElementById('cell-'+r+'-'+c);var tag=document.createElement('span');tag.className='power-tag';var pos=TAG_POS[playerIdx%TAG_POS.length];if(pos.top)tag.style.top=pos.top;if(pos.bottom)tag.style.bottom=pos.bottom;if(pos.left)tag.style.left=pos.left;if(pos.right)tag.style.right=pos.right;var tf='';if(pos.tx)tf+='translateX('+pos.tx+')';if(pos.ty)tf+='translateY('+pos.ty+')';if(tf)tag.style.transform=tf;tag.style.color=color;tag.textContent=remaining;cell.appendChild(tag);}
function clearPowerTags(){document.querySelectorAll('.power-tag').forEach(function(el){el.remove();});}
function renderColBtns(){var el=document.getElementById('col-btns');el.innerHTML='';for(var c=0;c<COLS;c++){var btn=document.createElement('div');btn.className='col-btn';btn.textContent='\uD83D\uDCA7';btn.onclick=(function(col){return function(){sndPlay('click');playDrop(col);};})(c);el.appendChild(btn);}}
function updateUI(){document.getElementById('pool-value').textContent=pool.toFixed(2);document.getElementById('balance').textContent=balance.toFixed(2);document.getElementById('drop-num').textContent=dropNum;document.getElementById('round-num').textContent=roundNum;}
function renderPlayersList(players){turnPlayers=players;var el=document.getElementById('players-list');el.innerHTML='';el.classList.toggle('two-cols',players.length>6);var poolWrap=document.getElementById('pool-area-wrap');if(poolWrap)poolWrap.classList.toggle('vertical',players.length>6);for(var k=0;k<players.length;k++){var row=document.createElement('div');row.className='player-row';row.id='p-row-'+k;var ord=document.createElement('span');ord.className='p-order';ord.textContent=(k+1)+'.';var nm=document.createElement('span');nm.className='p-name';nm.textContent=players[k].name;nm.style.color=players[k].color;var dp=document.createElement('span');dp.className='p-drop';dp.id='p-drop-'+k;dp.style.color=players[k].color;var rem=document.createElement('span');rem.className='p-remaining';rem.id='p-rem-'+k;row.appendChild(ord);row.appendChild(nm);row.appendChild(dp);row.appendChild(rem);el.appendChild(row);}}
function setPlayerActive(idx){for(var k=0;k<turnPlayers.length;k++){document.getElementById('p-row-'+k).classList.remove('active','done');}document.getElementById('p-row-'+idx).classList.add('active');}
function setPlayerDrop(idx,dp){var el=document.getElementById('p-drop-'+idx);el.textContent=dp;el.classList.add('show');}
function setPlayerRemaining(idx,rem){document.getElementById('p-rem-'+idx).textContent='\u2192'+rem;}
function setPlayerDone(idx){document.getElementById('p-row-'+idx).classList.remove('active');document.getElementById('p-row-'+idx).classList.add('done');}
function resetPlayerStates(){document.querySelectorAll('.player-row').forEach(function(r){r.classList.remove('active','done');});}
function rollDrop(){currentDrop=randDrop();var el=document.getElementById('drop-power');el.textContent=currentDrop;el.className='drop-power-value dp'+currentDrop;document.getElementById('drop-who').innerHTML='YOUR<br>DROP';document.getElementById('drop-who').style.color='#d4d4d8';document.getElementById('drop-remaining').innerHTML='';document.getElementById('payout-area').innerHTML='<span style="color:#f59e0b">choose a column \u2191</span>';}
function showDropInfo(who,color,power,remaining,spent){document.getElementById('drop-who').innerHTML=who;document.getElementById('drop-who').style.color=color;var dpEl=document.getElementById('drop-power');dpEl.textContent=power;dpEl.className='drop-power-value dp'+power;var remEl=document.getElementById('drop-remaining');if(spent>0)remEl.innerHTML='\u2212'+spent+' \u2192 <span class="rem">'+remaining+'</span>';else remEl.innerHTML='<span class="rem">'+remaining+'</span>';}
function setColBtnsDisabled(d){document.querySelectorAll('.col-btn').forEach(function(b){if(d)b.classList.add('disabled');else b.classList.remove('disabled');});}
function waitForRotate(){return new Promise(function(resolve){var timer=setTimeout(function(){document.getElementById('grid').onclick=null;resolve();},5000);document.getElementById('grid').onclick=function(){clearTimeout(timer);document.getElementById('grid').onclick=null;resolve();};});}
async function doRotation(){
    document.getElementById('rotate-ind').textContent='\u21bb 5s or click grid';
    document.getElementById('rotate-ind').classList.add('show');
    await waitForRotate();
    sndPlay('rotate');
    var g=document.getElementById('grid');g.style.transition='transform 1.2s ease-in-out';g.style.transform='rotate(90deg)';
    await sleep(1200);
    g.style.transition='none';g.style.transform='';
    rotateGridCW();if(hasChannel()){fillRowIfChannel();}
    clearPowerTags();renderGrid();
    document.getElementById('rotate-ind').textContent='\u21bb rotated 90\u00b0';
    await sleep(400);
    document.getElementById('rotate-ind').classList.remove('show');
}
async function doRotationAuto(){
    sndPlay('rotate');
    var g=document.getElementById('grid');g.style.transition='transform 1.2s ease-in-out';g.style.transform='rotate(90deg)';
    await sleep(1200);
    g.style.transition='none';g.style.transform='';
    rotateGridCW();if(hasChannel()){fillRowIfChannel();}
    clearPowerTags();renderGrid();
    document.getElementById('rotate-ind').textContent='\u21bb rotated 90\u00b0';
    document.getElementById('rotate-ind').classList.add('show');
    await sleep(400);
    document.getElementById('rotate-ind').classList.remove('show');
}
async function animateDrop(col,dropPower,who,color,playerIdx){
    var power=dropPower,c=col,washed=0;
    showDropInfo(who,color,dropPower,power,0);if(BOTS.length>0){setPlayerActive(playerIdx);setPlayerDrop(playerIdx,dropPower);}
    for(var row=0;row<ROWS&&power>0;row++){
        var cell=document.getElementById('cell-'+row+'-'+c);
        cell.classList.remove('water-hit','trail');void cell.offsetWidth;cell.classList.add('water-hit');
        cell.style.setProperty('--trail-color',color);cell.classList.add('trail');
        if(grid[row][c]===0){sndPlay('flow');showDropInfo(who,color,dropPower,power,0);showPowerTag(row,c,power,color,playerIdx);if(BOTS.length>0)setPlayerRemaining(playerIdx,power);await sleep(ANIM_DELAY/2);if(row<ROWS-1)c=chooseNext(row,c);continue;}
        var stoneH=grid[row][c];
        if(power>=stoneH){power-=stoneH;grid[row][c]=0;washed++;updateCell(row,c);cell.classList.add('washed');sndPlay('wash');showDropInfo(who,color,dropPower,power,stoneH);showPowerTag(row,c,power,color,playerIdx);if(BOTS.length>0)setPlayerRemaining(playerIdx,power);
        }else{sndPlay('drop');grid[row][c]-=power;showDropInfo(who,color,dropPower,0,power);showPowerTag(row,c,0,color,playerIdx);if(BOTS.length>0)setPlayerRemaining(playerIdx,0);power=0;updateCell(row,c);}
        await sleep(ANIM_DELAY);if(power>0&&row<ROWS-1)c=chooseNext(row,c);
    }
    if(BOTS.length>0)setPlayerDone(playerIdx);return power;
}
async function checkWin(winner,winColor){
    var ch=findChannelCells();var keys=Object.keys(ch);
    if(keys.length===0)return false;
    for(var i=0;i<keys.length;i++){var parts=keys[i].split('-');var cell=document.getElementById('cell-'+parts[0]+'-'+parts[1]);cell.style.background=winColor;cell.style.border='3px solid '+winColor;cell.style.boxShadow='0 0 16px '+winColor;var tags=cell.querySelectorAll('.power-tag');for(var t=0;t<tags.length;t++){tags[t].style.color='#000';tags[t].style.textShadow='0 0 3px #fff, 0 0 6px #fff';}}
    var flash=document.getElementById('channel-flash');flash.classList.add('show');
    sndPlay('win');
    resetPlayerStates();
    await sleep(1500);flash.classList.remove('show');
    if(winner==='YOU')balance+=pool;
    uvsEnd(winner);
    updateUI();
    var label=winner+(winner==='YOU'?' WIN':' WINS');
    if(turnPlayers.length>0&&DROP_COST>0){
        var dropsPerPlayer=Math.ceil(dropNum/turnPlayers.length);
        var lossCost=dropsPerPlayer*DROP_COST;
        for(var pi=0;pi<turnPlayers.length;pi++){
            var pn=turnPlayers[pi].name;
            var remEl=document.getElementById('p-rem-'+pi);
            if(remEl){
                if(pn===winner) remEl.textContent='+'+pool.toFixed(2);
                else remEl.textContent='-'+lossCost.toFixed(2);
            }
        }
    }
    document.getElementById('payout-area').innerHTML='<div style="margin-top:4px"><span style="font-family:Archivo Black,sans-serif;font-size:18px;color:'+winColor+'">'+label+'</span><br>'+(pool>0?'<span style="font-family:Archivo Black,sans-serif;font-size:28px;color:#fff">'+pool.toFixed(2)+' USDT</span><br>':'')+'<button onclick="newRound()" style="margin-top:10px;background:'+winColor+';color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:13px;padding:8px 28px;border:none;border-radius:8px;cursor:pointer;letter-spacing:2px">NEXT ROUND</button>'+(UVS_SESSION?' <button onclick="uvsShowVerify()" style="margin-top:10px;background:none;border:1px solid #f59e0b;color:#f59e0b;font-family:Archivo Black,sans-serif;font-size:11px;padding:8px 16px;border-radius:8px;cursor:pointer">\uD83D\uDD12 Verify</button>':'')+'</div>';
    animating=false;setColBtnsDisabled(true);return true;
}
// === SOLO & PVP ===
function botPickCol(bot,dp){
    var n=(bot.noise||0)/100;
    var strat=bot.strat||'RANDOM';
    if(strat==='RANDOM'){
        if(gameRng()<n){var alts=['DEEP','LIGHT','SNIPER','GREEDY','POWER'];return STRATEGY_PICK[alts[Math.floor(gameRng()*alts.length)]](dp);}
        return STRATEGY_PICK['RANDOM'](dp);
    }
    if(gameRng()<n)return STRATEGY_PICK['RANDOM'](dp);
    return STRATEGY_PICK[strat](dp);
}
async function playDrop(startCol){
    if(animating)return;animating=true;setColBtnsDisabled(true);
    uvsRecordMove(startCol);
    if(DROP_COST>0&&balance<DROP_COST){document.getElementById('payout-area').innerHTML='<span style="color:#f66">insufficient balance</span>';animating=false;setColBtnsDisabled(false);return;}
    if(BOTS.length===0){
        clearPowerTags();
        if(DROP_COST>0)balance-=DROP_COST;
        pool+=DROP_COST*POOL_RATE;dropNum++;updateUI();
        await animateDrop(startCol,currentDrop,'YOU','#f59e0b',0);
        if(await checkWin('YOU','#f59e0b'))return;
        if(ROTATE)await doRotation();
        rollDrop();animating=false;setColBtnsDisabled(false);
        return;
    }
    var players=[{name:'YOU',color:'#f59e0b',col:startCol,dp:currentDrop,isPlayer:true}];
    for(var b=0;b<BOTS.length;b++){var botDp=randDrop();var botCol=botPickCol(BOTS[b],botDp);players.push({name:BOTS[b].name,color:BOTS[b].color,col:botCol,dp:botDp,isPlayer:false});}
    for(var i=players.length-1;i>0;i--){var j=Math.floor(gameRng()*(i+1));var tmp=players[i];players[i]=players[j];players[j]=tmp;}
    renderPlayersList(players);clearPowerTags();playerDropResults=[];
    for(var t=0;t<players.length;t++){
        var p=players[t];
        if(!playerSpent[p.name])playerSpent[p.name]=0;
        playerSpent[p.name]+=DROP_COST;
        if(p.isPlayer&&DROP_COST>0)balance-=DROP_COST;
        pool+=DROP_COST*POOL_RATE;dropNum++;updateUI();
        var rem=await animateDrop(p.col,p.dp,p.name,p.color,t);
        playerDropResults.push({name:p.name,color:p.color,dp:p.dp,remaining:rem});
        if(await checkWin(p.name,p.color))return;
        if(t<players.length-1)await sleep(400);
    }
    if(ROTATE)await doRotation();
    resetPlayerStates();
    rollDrop();animating=false;setColBtnsDisabled(false);
}
// === BET&WET ===
var BET_BETS={},BET_TOTAL=0;
function betPickCol(fighter,dp){
    var n=(fighter.noise||0)/100;
    var strat=fighter.strat||fighter.strategy;
    if(strat==='RANDOM'){
        if(gameRng()<n)return STRATEGY_PICK['DEEP'](dp);
        return STRATEGY_PICK['RANDOM'](dp);
    }
    if(gameRng()<n)return STRATEGY_PICK['RANDOM'](dp);
    return STRATEGY_PICK[strat](dp);
}
async function betRound(){
    BET_BETS={};
    for(var k in CFG.bets)BET_BETS[k]=CFG.bets[k];
    BET_TOTAL=0;for(var k2 in BET_BETS)BET_TOTAL+=BET_BETS[k2];
    if(BET_TOTAL<0.001){document.getElementById('payout-area').innerHTML='<span style="color:#f66">place at least one bet</span>';return;}
    balance-=BET_TOTAL;
    pool=BET_TOTAL;dropNum=0;
    updateUI();
    var betList=[];for(var k3 in BET_BETS)betList.push(k3+'\u00d7'+BET_BETS[k3]);
    var fighters=BET_FIGHTERS.map(function(f,i){return{name:f.name,color:f.color,strategy:f.strat,noise:f.noise};});
    renderPlayersList(fighters);
    document.getElementById('payout-area').innerHTML='<span style="color:#f59e0b">your bets: '+betList.join(', ')+' \u2014 watching...</span>';
    animating=true;
    for(var cycle=0;cycle<100;cycle++){
        var order=[];for(var i=0;i<fighters.length;i++)order.push(i);
        for(var i2=order.length-1;i2>0;i2--){var j=Math.floor(gameRng()*(i2+1));var tmp=order[i2];order[i2]=order[j];order[j]=tmp;}
        var shuffled=order.map(function(idx){return fighters[idx];});
        renderPlayersList(shuffled);
        clearPowerTags();
        for(var t=0;t<order.length;t++){
            var idx=order[t];
            var f=fighters[idx];
            var dp=randDrop();
            var col=betPickCol(f,dp);
            dropNum++;updateUI();
            await animateDrop(col,dp,f.name,f.color,t);
            var ch=findChannelCells();var keys=Object.keys(ch);
            if(keys.length>0){
                for(var ci=0;ci<keys.length;ci++){var parts=keys[ci].split('-');var cell=document.getElementById('cell-'+parts[0]+'-'+parts[1]);cell.style.background=f.color;cell.style.border='3px solid '+f.color;cell.style.boxShadow='0 0 16px '+f.color;var tags=cell.querySelectorAll('.power-tag');for(var tt=0;tt<tags.length;tt++){tags[tt].style.color='#000';tags[tt].style.textShadow='0 0 3px #fff, 0 0 6px #fff';}}
                var flash=document.getElementById('channel-flash');flash.classList.add('show');
                sndPlay('win');
                resetPlayerStates();
                await sleep(1500);flash.classList.remove('show');
                var won=BET_BETS[f.name]&&BET_BETS[f.name]>0;
                var fdata=BET_FIGHTERS.filter(function(x){return x.name===f.name;})[0];
                var payout=0;
                if(won){payout=BET_BETS[f.name]*fdata.odds;balance+=payout;}
                uvsEnd(f.name);
                updateUI();
                var msg=won?'<span style="color:#22c55e;font-family:Archivo Black,sans-serif;font-size:20px">YOU WIN</span><br><span style="color:#d4d4d8;font-size:12px">'+BET_BETS[f.name].toFixed(2)+' \u00d7 '+fdata.odds+' =</span><br><span style="font-family:Archivo Black,sans-serif;font-size:28px;color:#fff">+'+payout.toFixed(2)+' USDT</span>':'<span style="color:#f66;font-family:Archivo Black,sans-serif;font-size:16px">'+f.name+' WINS</span><br><span style="color:#d4d4d8;font-size:13px">no bet on '+f.name+'</span>';
                document.getElementById('payout-area').innerHTML='<div style="margin-top:4px">'+msg+'<br><button onclick="newBetRound()" style="margin-top:10px;background:'+f.color+';color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:13px;padding:8px 28px;border:none;border-radius:8px;cursor:pointer;letter-spacing:2px">PLACE BETS</button>'+(UVS_SESSION?' <button onclick="uvsShowVerify()" style="margin-top:10px;background:none;border:1px solid #f59e0b;color:#f59e0b;font-family:Archivo Black,sans-serif;font-size:11px;padding:8px 16px;border-radius:8px;cursor:pointer">\uD83D\uDD12 Verify</button>':'')+'</div>';
                animating=false;return;
            }
            if(t<order.length-1)await sleep(150);
        }
        if(ROTATE)await doRotationAuto();
        resetPlayerStates();
    }
}
function newBetRound(){clearPowerTags();initGrid();pool=0;dropNum=0;roundNum++;document.getElementById('players-list').innerHTML='';updateUI();renderGrid();fitGrid();
    document.getElementById('game').style.display='none';
    document.getElementById('lobby').style.display='block';
    unfitGrid();
    document.body.style.overflow='';
    window.scrollTo(0,0);
    randomizeFighterNames();
    setMode('bet');
}
// === SOUND ===
var SND_MUTED=true,SND_CTX=null;
function sndInit(){if(!SND_CTX)SND_CTX=new(window.AudioContext||window.webkitAudioContext)();if(SND_CTX.state==='suspended')SND_CTX.resume();}
function sndToggle(){sndInit();SND_MUTED=!SND_MUTED;var btn=document.getElementById('mute-btn');if(btn)btn.innerHTML=SND_MUTED?'&#128263;':'&#128266;';}
function sndPlay(type){
    if(SND_MUTED||!SND_CTX)return;
    var ctx=SND_CTX,now=ctx.currentTime;
    var osc,gain;
    if(type==='drop'){
        osc=ctx.createOscillator();gain=ctx.createGain();
        osc.type='sine';osc.frequency.setValueAtTime(400,now);osc.frequency.exponentialRampToValueAtTime(150,now+0.12);
        gain.gain.setValueAtTime(0.15,now);gain.gain.exponentialRampToValueAtTime(0.001,now+0.12);
        osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+0.12);
    }else if(type==='wash'){
        var buf=ctx.createBuffer(1,ctx.sampleRate*0.08,ctx.sampleRate);
        var d=buf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
        var src=ctx.createBufferSource();gain=ctx.createGain();
        gain.gain.setValueAtTime(0.12,now);gain.gain.exponentialRampToValueAtTime(0.001,now+0.08);
        src.buffer=buf;src.connect(gain);gain.connect(ctx.destination);src.start(now);
    }else if(type==='flow'){
        osc=ctx.createOscillator();gain=ctx.createGain();
        osc.type='sine';osc.frequency.setValueAtTime(800,now);osc.frequency.exponentialRampToValueAtTime(1200,now+0.06);
        gain.gain.setValueAtTime(0.04,now);gain.gain.exponentialRampToValueAtTime(0.001,now+0.06);
        osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+0.06);
    }else if(type==='win'){
        [523,659,784,1047].forEach(function(f,i){
            osc=ctx.createOscillator();gain=ctx.createGain();
            osc.type='triangle';osc.frequency.value=f;
            gain.gain.setValueAtTime(0,now+i*0.12);gain.gain.linearRampToValueAtTime(0.15,now+i*0.12+0.05);gain.gain.exponentialRampToValueAtTime(0.001,now+i*0.12+0.4);
            osc.connect(gain);gain.connect(ctx.destination);osc.start(now+i*0.12);osc.stop(now+i*0.12+0.4);
        });
    }else if(type==='rotate'){
        // long creaky rotation ~1.2s
        var dur=1.2;
        // rusty mechanism: noise burst + modulated tone
        var nBuf=ctx.createBuffer(1,ctx.sampleRate*dur,ctx.sampleRate);
        var nd=nBuf.getChannelData(0);
        for(var ni=0;ni<nd.length;ni++){
            var t=ni/ctx.sampleRate;
            var env=Math.min(t*5,1)*Math.max(0,1-t/(dur*0.9));
            nd[ni]=(Math.random()*2-1)*env*0.5*Math.sin(t*40)*Math.sin(t*7);
        }
        var nSrc=ctx.createBufferSource();nSrc.buffer=nBuf;
        var nGain=ctx.createGain();nGain.gain.value=0.1;
        nSrc.connect(nGain);nGain.connect(ctx.destination);nSrc.start(now);
        // tonal creak
        osc=ctx.createOscillator();gain=ctx.createGain();
        var lfo=ctx.createOscillator();var lfoGain=ctx.createGain();
        lfo.type='triangle';lfo.frequency.value=12;lfoGain.gain.value=50;
        lfo.connect(lfoGain);lfoGain.connect(osc.frequency);
        osc.type='sawtooth';osc.frequency.setValueAtTime(50,now);osc.frequency.linearRampToValueAtTime(100,now+dur*0.7);osc.frequency.linearRampToValueAtTime(70,now+dur);
        gain.gain.setValueAtTime(0.05,now);gain.gain.linearRampToValueAtTime(0.04,now+dur*0.5);gain.gain.exponentialRampToValueAtTime(0.001,now+dur);
        osc.connect(gain);gain.connect(ctx.destination);
        osc.start(now);osc.stop(now+dur);lfo.start(now);lfo.stop(now+dur);
    }else if(type==='bet'){
        osc=ctx.createOscillator();gain=ctx.createGain();
        osc.type='square';osc.frequency.value=2400;
        gain.gain.setValueAtTime(0.08,now);gain.gain.exponentialRampToValueAtTime(0.001,now+0.04);
        osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+0.04);
    }else if(type==='click'){
        osc=ctx.createOscillator();gain=ctx.createGain();
        osc.type='sine';osc.frequency.value=1000;
        gain.gain.setValueAtTime(0.06,now);gain.gain.exponentialRampToValueAtTime(0.001,now+0.03);
        osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+0.03);
    }
}
calcOdds();updateFighterButtons();
