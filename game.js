// game.js — NOISORE v5.3 shared game logic
requireEngine(1);
var CFG={mode:'solo',gridSize:6,rotate:true,stake:0,numBots:2,fighter:'DEEP',bets:{}};
var BOT_POOL=[
    {name:'Axel',color:'#4ad',smart:false},{name:'Kira',color:'#d4a',smart:true},
    {name:'Rex',color:'#4d8',smart:false},{name:'Nova',color:'#a6f',smart:true},
    {name:'Zed',color:'#f66',smart:false},{name:'Ivy',color:'#6d6',smart:true},
    {name:'Bolt',color:'#fa0',smart:false},{name:'Luna',color:'#8af',smart:true},
    {name:'Jinx',color:'#f4a',smart:false},{name:'Sage',color:'#ad4',smart:true},
    {name:'Dex',color:'#6af',smart:false}
];
var BET_FIGHTERS=[
    {name:'Professor',strat:'DEEP',color:'#4ad'},
    {name:'Scout',strat:'LIGHT',color:'#d4a'},
    {name:'Crow',strat:'SNIPER',color:'#4d8'},
    {name:'Mole',strat:'GREEDY',color:'#a6f'},
    {name:'Colonel',strat:'POWER',color:'#fa0'},
    {name:'Daisy',strat:'RANDOM',color:'#f66'}
];
var OVERROUND=1.05;
var BET_DATA={
    '6-off':[19.9,17.0,18.7,18.8,19.8,5.9],
    '6-on': [18.8,19.2,17.9,17.8,18.1,8.2],
    '8-off':[19.8,17.5,18.8,18.8,19.7,5.5],
    '8-on': [19.4,18.7,18.5,18.4,18.9,6.1]
};
function calcOdds(){
    var key=CFG.gridSize+'-'+(CFG.rotate?'on':'off');
    var pcts=BET_DATA[key];
    for(var i=0;i<BET_FIGHTERS.length;i++){
        BET_FIGHTERS[i].pct=pcts[i];
        BET_FIGHTERS[i].odds=Math.round(100/pcts[i]/OVERROUND*10)/10;
    }
}
// === LOBBY ===
function setMode(m){
    CFG.mode=m;
    document.querySelectorAll('#lobby .lobby-section:first-child .lbtn').forEach(function(b){b.classList.remove('active');});
    document.getElementById('mode-'+m).classList.add('active');
    document.getElementById('bots-section').style.display=m==='pvp'?'':'none';
    document.getElementById('stake-section').style.display=m==='solo'?'none':'';
    document.getElementById('fighter-section').style.display=m==='bet'?'':'none';
}
function setGrid(s){CFG.gridSize=s;document.getElementById('grid-6').classList.toggle('active',s===6);document.getElementById('grid-8').classList.toggle('active',s===8);calcOdds();updateBetDisplay();}
function setRotation(on){CFG.rotate=on;document.getElementById('rot-off').classList.toggle('active',!on);document.getElementById('rot-on').classList.toggle('active',on);calcOdds();updateBetDisplay();}
function setStake(v){CFG.stake=v;document.querySelectorAll('#stake-section .lbtn').forEach(function(b){b.classList.remove('active');});var id='stake-'+String(v).replace('.','');var el=document.getElementById(id);if(el)el.classList.add('active');updateBetDisplay();}
function setBots(n){CFG.numBots=n;document.querySelectorAll('#bots-section .lbtn').forEach(function(b){b.classList.remove('active');});document.getElementById('bots-'+n).classList.add('active');}
function betAdd(name,e){if(e)e.preventDefault();var stk=CFG.stake>0?CFG.stake:1;if(!CFG.bets[name])CFG.bets[name]=0;CFG.bets[name]+=stk;updateBetDisplay();return false;}
function betRemove(name){var stk=CFG.stake>0?CFG.stake:1;if(CFG.bets[name]&&CFG.bets[name]>=stk)CFG.bets[name]-=stk;if(!CFG.bets[name]||CFG.bets[name]<0.001)delete CFG.bets[name];updateBetDisplay();}
function betClear(){CFG.bets={};updateBetDisplay();}
function updateBetDisplay(){
    BET_FIGHTERS.forEach(function(f){
        var el=document.getElementById('f-'+f.name);
        if(!el)return;
        var sum=CFG.bets[f.name]||0;
        var label=f.name+(f.odds?' \u00d7'+f.odds:'');
        el.textContent=label+(sum>0?' ('+sum.toFixed(2)+')':'');
        el.classList.toggle('active',sum>0);
    });
    var total=0;for(var k in CFG.bets)total+=CFG.bets[k];
    var el2=document.getElementById('fighter-odds');
    var isMobile='ontouchstart' in window;
    if(el2)el2.textContent='Total: '+total.toFixed(2)+' USDT'+(isMobile?'  (tap to add)':'  (click +1, right-click -1)');
}
function startGame(){
    document.getElementById('lobby').style.display='none';
    document.getElementById('game').style.display='block';
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
        BOTS=BOT_POOL.slice(0,CFG.numBots);
        document.getElementById('pool-area-wrap').style.display='flex';
        document.getElementById('game-mode-label').textContent='NOISORE';
        document.getElementById('col-btns').style.display='grid';
    }
    document.getElementById('info-left').textContent=COLS+'\u00d7'+ROWS+(ROTATE?' rotate':'')+' - stone 1-'+MAX_H;
    document.getElementById('info-right').textContent=DROP_COST>0?(DROP_COST.toFixed(2)+' USDT/drop'):'free play';
    document.getElementById('grid').style.gridTemplateColumns='repeat('+COLS+',1fr)';
    document.getElementById('col-btns').style.gridTemplateColumns='repeat('+COLS+',1fr)';
    initGame();
    if(CFG.mode==='bet') betRound();
}
function backToLobby(){document.getElementById('game').style.display='none';document.getElementById('lobby').style.display='block';animating=false;}
// === GAME STATE ===
var COLS=6,ROWS=6,MAX_H=10,MAX_DROP=10,DROP_COST=0,POOL_RATE=0.95,ANIM_DELAY=200;
var ROTATE=true,BOTS=[];
var grid=[],pool=0,balance=100,dropNum=0,roundNum=1,animating=false,currentDrop=0,turnPlayers=[];
var TAG_POS=[{top:'1px',left:'2px'},{top:'1px',right:'2px'},{bottom:'1px',left:'2px'},{bottom:'1px',right:'2px'},{top:'1px',left:'50%',tx:'-50%'},{bottom:'1px',left:'50%',tx:'-50%'},{top:'50%',left:'1px',ty:'-50%'},{top:'50%',right:'1px',ty:'-50%'},{top:'30%',left:'2px'},{top:'30%',right:'2px'},{bottom:'30%',left:'2px'},{bottom:'30%',right:'2px'}];
function randH(){return 1+Math.floor(Math.random()*MAX_H);}
function initGrid(){grid=[];for(var r=0;r<ROWS;r++){grid[r]=[];for(var c=0;c<COLS;c++)grid[r][c]=randH();}}
function newRound(){clearPowerTags();initGrid();pool=0;dropNum=0;roundNum++;document.getElementById('players-list').innerHTML='';updateUI();renderGrid();rollDrop();setColBtnsDisabled(false);}
function initGame(){initGrid();pool=0;balance=100;dropNum=0;roundNum=1;animating=false;updateUI();renderGrid();renderColBtns();rollDrop();}
function renderGrid(){var el=document.getElementById('grid');el.innerHTML='';for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){var cell=document.createElement('div');cell.className='cell h'+grid[r][c];cell.id='cell-'+r+'-'+c;cell.textContent=grid[r][c]>0?grid[r][c]:'';el.appendChild(cell);}}
function updateCell(r,c){var cell=document.getElementById('cell-'+r+'-'+c);var tags=cell.querySelectorAll('.power-tag');cell.className='cell h'+grid[r][c];cell.textContent=grid[r][c]>0?grid[r][c]:'';for(var i=0;i<tags.length;i++)cell.appendChild(tags[i]);}
function showPowerTag(r,c,remaining,color,playerIdx){var cell=document.getElementById('cell-'+r+'-'+c);var tag=document.createElement('span');tag.className='power-tag';var pos=TAG_POS[playerIdx%TAG_POS.length];if(pos.top)tag.style.top=pos.top;if(pos.bottom)tag.style.bottom=pos.bottom;if(pos.left)tag.style.left=pos.left;if(pos.right)tag.style.right=pos.right;var tf='';if(pos.tx)tf+='translateX('+pos.tx+')';if(pos.ty)tf+='translateY('+pos.ty+')';if(tf)tag.style.transform=tf;tag.style.color=color;tag.textContent=remaining;cell.appendChild(tag);}
function clearPowerTags(){document.querySelectorAll('.power-tag').forEach(function(el){el.remove();});}
function renderColBtns(){var el=document.getElementById('col-btns');el.innerHTML='';for(var c=0;c<COLS;c++){var btn=document.createElement('div');btn.className='col-btn';btn.textContent='\uD83D\uDCA7';btn.onclick=(function(col){return function(){playDrop(col);};})(c);el.appendChild(btn);}}
function updateUI(){document.getElementById('pool-value').textContent=pool.toFixed(2);document.getElementById('balance').textContent=balance.toFixed(2);document.getElementById('drop-num').textContent=dropNum;document.getElementById('round-num').textContent=roundNum;}
function renderPlayersList(players){turnPlayers=players;var el=document.getElementById('players-list');el.innerHTML='';el.classList.toggle('two-cols',players.length>6);for(var k=0;k<players.length;k++){var row=document.createElement('div');row.className='player-row';row.id='p-row-'+k;var ord=document.createElement('span');ord.className='p-order';ord.textContent=(k+1)+'.';var nm=document.createElement('span');nm.className='p-name';nm.textContent=players[k].name;nm.style.color=players[k].color;var dp=document.createElement('span');dp.className='p-drop';dp.id='p-drop-'+k;dp.style.color=players[k].color;var rem=document.createElement('span');rem.className='p-remaining';rem.id='p-rem-'+k;row.appendChild(ord);row.appendChild(nm);row.appendChild(dp);row.appendChild(rem);el.appendChild(row);}}
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
    rotateGridCW();if(hasChannel()){fillRowIfChannel();}
    clearPowerTags();renderGrid();
    document.getElementById('rotate-ind').textContent='\u21bb rotated 90\u00b0';
    await sleep(800);
    document.getElementById('rotate-ind').classList.remove('show');
}
async function doRotationAuto(){
    rotateGridCW();if(hasChannel()){fillRowIfChannel();}
    clearPowerTags();renderGrid();
    document.getElementById('rotate-ind').textContent='\u21bb rotated 90\u00b0';
    document.getElementById('rotate-ind').classList.add('show');
    await sleep(600);
    document.getElementById('rotate-ind').classList.remove('show');
}
async function animateDrop(col,dropPower,who,color,playerIdx){
    var power=dropPower,c=col,washed=0;
    showDropInfo(who,color,dropPower,power,0);if(BOTS.length>0){setPlayerActive(playerIdx);setPlayerDrop(playerIdx,dropPower);}
    for(var row=0;row<ROWS&&power>0;row++){
        var cell=document.getElementById('cell-'+row+'-'+c);
        cell.classList.remove('water-hit');void cell.offsetWidth;cell.classList.add('water-hit');
        if(grid[row][c]===0){showDropInfo(who,color,dropPower,power,0);showPowerTag(row,c,power,color,playerIdx);if(BOTS.length>0)setPlayerRemaining(playerIdx,power);await sleep(ANIM_DELAY/2);if(row<ROWS-1)c=chooseNext(row,c);continue;}
        var stoneH=grid[row][c];
        if(power>=stoneH){power-=stoneH;grid[row][c]=0;washed++;updateCell(row,c);cell.classList.add('washed');showDropInfo(who,color,dropPower,power,stoneH);showPowerTag(row,c,power,color,playerIdx);if(BOTS.length>0)setPlayerRemaining(playerIdx,power);
        }else{grid[row][c]-=power;showDropInfo(who,color,dropPower,0,power);showPowerTag(row,c,0,color,playerIdx);if(BOTS.length>0)setPlayerRemaining(playerIdx,0);power=0;updateCell(row,c);}
        await sleep(ANIM_DELAY);if(power>0&&row<ROWS-1)c=chooseNext(row,c);
    }
    if(BOTS.length>0)setPlayerDone(playerIdx);return washed;
}
async function checkWin(winner,winColor){
    var ch=findChannelCells();var keys=Object.keys(ch);
    if(keys.length===0)return false;
    for(var i=0;i<keys.length;i++){var parts=keys[i].split('-');var cell=document.getElementById('cell-'+parts[0]+'-'+parts[1]);cell.style.background=winColor;cell.style.border='3px solid '+winColor;cell.style.boxShadow='0 0 16px '+winColor;var tags=cell.querySelectorAll('.power-tag');for(var t=0;t<tags.length;t++){tags[t].style.color='#000';tags[t].style.textShadow='0 0 3px #fff, 0 0 6px #fff';}}
    var flash=document.getElementById('channel-flash');flash.classList.add('show');
    await sleep(1500);flash.classList.remove('show');
    if(winner==='YOU')balance+=pool;
    updateUI();
    var label=winner+(winner==='YOU'?' WIN':' WINS');
    document.getElementById('payout-area').innerHTML='<div style="margin-top:4px"><span style="font-family:Archivo Black,sans-serif;font-size:18px;color:'+winColor+'">'+label+'</span><br>'+(pool>0?'<span style="font-family:Archivo Black,sans-serif;font-size:28px;color:#fff">'+pool.toFixed(2)+' USDT</span><br>':'')+'<button onclick="newRound()" style="margin-top:10px;background:'+winColor+';color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:13px;padding:8px 28px;border:none;border-radius:8px;cursor:pointer;letter-spacing:2px">NEXT ROUND</button></div>';
    animating=false;setColBtnsDisabled(true);return true;
}
// === SOLO & PVP ===
async function playDrop(startCol){
    if(animating)return;animating=true;setColBtnsDisabled(true);
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
    for(var b=0;b<BOTS.length;b++){var botCol=BOTS[b].smart?pickLight():Math.floor(Math.random()*COLS);players.push({name:BOTS[b].name,color:BOTS[b].color,col:botCol,dp:randDrop(),isPlayer:false});}
    for(var i=players.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=players[i];players[i]=players[j];players[j]=tmp;}
    renderPlayersList(players);clearPowerTags();
    for(var t=0;t<players.length;t++){
        var p=players[t];
        if(p.isPlayer&&DROP_COST>0)balance-=DROP_COST;
        pool+=DROP_COST*POOL_RATE;dropNum++;updateUI();
        await animateDrop(p.col,p.dp,p.name,p.color,t);
        if(await checkWin(p.name,p.color))return;
        if(t<players.length-1)await sleep(400);
    }
    if(ROTATE)await doRotation();
    resetPlayerStates();
    rollDrop();animating=false;setColBtnsDisabled(false);
}
// === BET&WET ===
var BET_BETS={},BET_TOTAL=0;
async function betRound(){
    BET_BETS={};
    for(var k in CFG.bets)BET_BETS[k]=CFG.bets[k];
    BET_TOTAL=0;for(var k2 in BET_BETS)BET_TOTAL+=BET_BETS[k2];
    if(BET_TOTAL<0.001){document.getElementById('payout-area').innerHTML='<span style="color:#f66">place at least one bet</span>';return;}
    balance-=BET_TOTAL;
    pool=BET_TOTAL;dropNum=0;
    updateUI();
    var betList=[];for(var k3 in BET_BETS)betList.push(k3+'\u00d7'+BET_BETS[k3]);
    var fighters=BET_FIGHTERS.map(function(f,i){return{name:f.name,color:f.color,strategy:f.strat};});
    renderPlayersList(fighters);
    document.getElementById('payout-area').innerHTML='<span style="color:#f59e0b">your bets: '+betList.join(', ')+' \u2014 watching...</span>';
    animating=true;
    for(var cycle=0;cycle<100;cycle++){
        var order=[];for(var i=0;i<fighters.length;i++)order.push(i);
        for(var i2=order.length-1;i2>0;i2--){var j=Math.floor(Math.random()*(i2+1));var tmp=order[i2];order[i2]=order[j];order[j]=tmp;}
        clearPowerTags();
        for(var t=0;t<order.length;t++){
            var idx=order[t];
            var f=fighters[idx];
            var dp=randDrop();
            var col=STRATEGY_PICK[f.strategy](dp);
            dropNum++;updateUI();
            await animateDrop(col,dp,f.name,f.color,idx);
            var ch=findChannelCells();var keys=Object.keys(ch);
            if(keys.length>0){
                for(var ci=0;ci<keys.length;ci++){var parts=keys[ci].split('-');var cell=document.getElementById('cell-'+parts[0]+'-'+parts[1]);cell.style.background=f.color;cell.style.border='3px solid '+f.color;cell.style.boxShadow='0 0 16px '+f.color;var tags=cell.querySelectorAll('.power-tag');for(var tt=0;tt<tags.length;tt++){tags[tt].style.color='#000';tags[tt].style.textShadow='0 0 3px #fff, 0 0 6px #fff';}}
                var flash=document.getElementById('channel-flash');flash.classList.add('show');
                await sleep(1500);flash.classList.remove('show');
                var won=BET_BETS[f.name]&&BET_BETS[f.name]>0;
                var fdata=BET_FIGHTERS.filter(function(x){return x.name===f.name;})[0];
                var payout=0;
                if(won){payout=BET_BETS[f.name]*fdata.odds;balance+=payout;}
                updateUI();
                var msg=won?'<span style="color:#22c55e;font-family:Archivo Black,sans-serif;font-size:20px">YOU WIN</span><br><span style="color:#d4d4d8;font-size:12px">'+BET_BETS[f.name].toFixed(2)+' \u00d7 '+fdata.odds+' =</span><br><span style="font-family:Archivo Black,sans-serif;font-size:28px;color:#fff">+'+payout.toFixed(2)+' USDT</span>':'<span style="color:#f66;font-family:Archivo Black,sans-serif;font-size:16px">'+f.name+' WINS</span><br><span style="color:#d4d4d8;font-size:13px">no bet on '+f.name+'</span>';
                document.getElementById('payout-area').innerHTML='<div style="margin-top:4px">'+msg+'<br><button onclick="newBetRound()" style="margin-top:10px;background:'+f.color+';color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:13px;padding:8px 28px;border:none;border-radius:8px;cursor:pointer;letter-spacing:2px">PLACE BETS</button></div>';
                animating=false;return;
            }
            if(t<order.length-1)await sleep(150);
        }
        if(ROTATE)await doRotationAuto();
        resetPlayerStates();
    }
}
function newBetRound(){clearPowerTags();initGrid();pool=0;dropNum=0;roundNum++;document.getElementById('players-list').innerHTML='';updateUI();renderGrid();
    document.getElementById('game').style.display='none';
    document.getElementById('lobby').style.display='block';
    setMode('bet');
}
calcOdds();
