// tutorial.js — NOISORE onboarding tutorials v9.3
var TUT={active:false,mode:null,step:0};

// --- preset grids (6x6) ---
var TUT_GRID_EROSION=[
    [5,8,7,1,9,6],
    [4,7,6,1,8,5],
    [3,9,5,2,7,4],
    [6,8,4,1,9,3],
    [7,5,3,1,8,6],
    [8,6,7,2,5,4]
];
var TUT_GRID_SOIRON=[
    [7,1,8,5,9,6],
    [6,1,7,4,8,5],
    [5,2,6,3,7,4],
    [8,1,5,6,9,3],
    [9,1,4,7,8,6],
    [7,2,3,8,5,4]
];

// --- overlay helpers ---
function tutShow(rect,text,textPos){
    var hole=document.getElementById('tut-hole');
    var txt=document.getElementById('tut-text');
    var overlay=document.getElementById('tut-overlay');
    var skip=document.getElementById('tut-skip');
    overlay.classList.add('show');
    skip.style.display='block';
    if(rect){
        // highlight mode: transparent overlay, hole does the darkening
        overlay.style.background='transparent';
        hole.style.display='block';
        hole.style.left=(rect.left-6)+'px';
        hole.style.top=(rect.top-6)+'px';
        hole.style.width=(rect.width+12)+'px';
        hole.style.height=(rect.height+12)+'px';
    }else{
        // text-only mode: semi-transparent overlay
        overlay.style.background='rgba(0,0,0,0.55)';
        hole.style.display='none';
    }
    if(text){
        txt.style.display='block';
        txt.innerHTML=text;
        txt.style.top='auto';txt.style.bottom='auto';
        txt.style.transform='translateX(-50%)';
        if(textPos==='top'){txt.style.top='8%';}
        else if(textPos==='bottom'){txt.style.bottom='6%';}
        else{txt.style.top='40%';}
    }else{
        txt.style.display='none';
    }
}

function tutHide(){
    document.getElementById('tut-overlay').classList.remove('show');
    document.getElementById('tut-overlay').style.background='';
    document.getElementById('tut-hole').style.display='none';
    document.getElementById('tut-text').style.display='none';
    document.getElementById('tut-skip').style.display='none';
}

// wait for tap on overlay with minimum delay
function tutWaitTap(minDelay){
    var ms=minDelay||3000;
    return new Promise(function(resolve){
        var ready=false;
        setTimeout(function(){ready=true;},ms);
        var overlay=document.getElementById('tut-overlay');
        var handler=function(){
            if(!ready)return;
            overlay.removeEventListener('click',handler);
            resolve();
        };
        overlay.addEventListener('click',handler);
    });
}

// raise element above overlay for clicking
function tutRaise(el){
    el.style.position='relative';
    el.style.zIndex='160';
}
function tutLower(el){
    el.style.position='';
    el.style.zIndex='';
}

function tutSkip(){
    TUT.active=false;
    tutHide();
    backToLobby();
}

// --- EROSION tutorial ---
async function tutErosion(){
    TUT.active=true;TUT.mode='solo';
    CFG.mode='solo';CFG.gridSize=6;CFG.rotate=false;CFG.stake=0;
    startGame();
    await sleep(600);

    // override grid with easy column 3
    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_EROSION[r][c];
    renderGrid();fitGrid();

    // Step 1: explain the goal
    tutShow(null,
        '<div class="tut-step">EROSION — STEP 1/4</div>'+
        'Your goal: carve a <b style="color:#f59e0b">water channel</b> from top to bottom!<br><br>'+
        'Drop water on columns to erode stones.<br>'+
        'Stones with <b style="color:#f59e0b">smaller numbers</b> break easier.<br><br>'+
        '<span style="color:#666;font-size:11px">tap to continue</span>','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;

    // Step 2: highlight weakest column (col 3)
    var col=3;
    currentDrop=6;
    document.getElementById('drop-power').textContent='6';
    document.getElementById('drop-power').className='drop-power-value dp6';

    var btn=document.querySelectorAll('.col-btn')[col];
    var rect=btn.getBoundingClientRect();
    tutRaise(btn);
    // disable other columns
    document.querySelectorAll('.col-btn').forEach(function(b,i){if(i!==col)b.classList.add('disabled');});

    tutShow(rect,
        '<div class="tut-step">STEP 2/4</div>'+
        'Column 4 has the weakest stones (1,1,2,1,1,2).<br><br>'+
        '<b style="color:#f59e0b">Tap the 💧 button</b> to drop water!','top');

    // wait for player to click the correct column
    await new Promise(function(resolve){
        btn.onclick=function(){
            sndPlay('click');
            playDrop(col);
            resolve();
        };
    });
    tutLower(btn);
    document.querySelectorAll('.col-btn').forEach(function(b){b.classList.remove('disabled');});

    // wait for animation
    await sleep(2000);
    if(!TUT.active)return;

    // Step 3: show progress
    tutShow(null,
        '<div class="tut-step">STEP 3/4</div>'+
        'The water eroded the stones! 💧<br><br>'+
        'Your drop of <b style="color:#f59e0b">power 6</b> carved through the weak column.<br>'+
        'Now finish the channel — clear what remains!<br><br>'+
        '<span style="color:#666;font-size:11px">tap to continue</span>','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;

    // Step 4: one more drop to finish
    currentDrop=8;
    document.getElementById('drop-power').textContent='8';
    document.getElementById('drop-power').className='drop-power-value dp8';

    var btn2=document.querySelectorAll('.col-btn')[col];
    var rect2=btn2.getBoundingClientRect();
    tutRaise(btn2);
    document.querySelectorAll('.col-btn').forEach(function(b,i){if(i!==col)b.classList.add('disabled');});

    tutShow(rect2,
        '<div class="tut-step">STEP 4/4</div>'+
        '<b style="color:#f59e0b">Tap again</b> to finish the channel!','top');

    await new Promise(function(resolve){
        btn2.onclick=function(){
            sndPlay('click');
            playDrop(col);
            resolve();
        };
    });
    tutLower(btn2);
    document.querySelectorAll('.col-btn').forEach(function(b){b.classList.remove('disabled');});
    await sleep(2500);
    if(!TUT.active)return;

    // done
    tutShow(null,
        '🎉 <b style="color:#f59e0b">CHANNEL COMPLETE!</b><br><br>'+
        'You carved a path from top to bottom —<br>that\'s how you win EROSION!<br><br>'+
        '<span style="color:#666;font-size:11px">tap to return to lobby</span>','middle');
    await tutWaitTap(3000);
    TUT.active=false;
    tutHide();
    backToLobby();
}

// --- SOIRON tutorial ---
async function tutSoiron(){
    TUT.active=true;TUT.mode='pvp';
    CFG.mode='pvp';CFG.gridSize=6;CFG.rotate=false;CFG.stake=0;CFG.numBots=1;
    startGame();
    await sleep(600);

    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_SOIRON[r][c];
    renderGrid();fitGrid();

    // Step 1: explain
    tutShow(null,
        '<div class="tut-step">SOIRON — STEP 1/3</div>'+
        'Race against opponents!<br>'+
        'Everyone drops water each turn.<br><br>'+
        'First to carve a channel <b style="color:#f59e0b">wins the pool</b>!<br><br>'+
        '<span style="color:#666;font-size:11px">tap to continue</span>','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;

    // Step 2: drop on weak column (col 1 has 1,1,2,1,1,2)
    var col=1;
    currentDrop=7;
    document.getElementById('drop-power').textContent='7';
    document.getElementById('drop-power').className='drop-power-value dp7';

    var btn=document.querySelectorAll('.col-btn')[col];
    var rect=btn.getBoundingClientRect();
    tutRaise(btn);
    document.querySelectorAll('.col-btn').forEach(function(b,i){if(i!==col)b.classList.add('disabled');});

    tutShow(rect,
        '<div class="tut-step">STEP 2/3</div>'+
        'Column 2 is weak (1,1,2,1,1,2).<br><br>'+
        '<b style="color:#f59e0b">Tap it!</b><br>'+
        'Your opponent will also drop water.','top');

    await new Promise(function(resolve){
        btn.onclick=function(){
            sndPlay('click');
            playDrop(col);
            resolve();
        };
    });
    tutLower(btn);
    document.querySelectorAll('.col-btn').forEach(function(b){b.classList.remove('disabled');});
    await sleep(2500);
    if(!TUT.active)return;

    // Step 3: explain
    tutShow(null,
        '<div class="tut-step">STEP 3/3</div>'+
        'You both dropped water!<br><br>'+
        'Your opponent is carving <b style="color:#f59e0b">their own</b> channel.<br>'+
        'First to complete a top-to-bottom path wins!<br><br>'+
        '🎉 Now you know SOIRON!<br>'+
        '<span style="color:#666;font-size:11px">tap to return</span>','middle');
    await tutWaitTap(3000);
    TUT.active=false;
    tutHide();
    backToLobby();
}

// --- BET&WET tutorial ---
async function tutBetwet(){
    TUT.active=true;TUT.mode='bet';
    CFG.mode='bet';CFG.gridSize=6;CFG.rotate=false;CFG.stake=1;CFG.bets={};
    setMode('bet');
    randomizeFighterNames();
    await sleep(300);

    // Step 1: explain
    tutShow(null,
        '<div class="tut-step">BET & WET — STEP 1/3</div>'+
        'Six fighters race to carve a channel.<br><br>'+
        'Pick a fighter, place your bet,<br>'+
        'watch the race!<br><br>'+
        '<span style="color:#666;font-size:11px">tap to continue</span>','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;

    // Step 2: highlight fighter buttons
    var fBtns=document.getElementById('fighter-btns');
    var rect=fBtns.getBoundingClientRect();
    tutRaise(fBtns);

    tutShow(rect,
        '<div class="tut-step">STEP 2/3</div>'+
        '<b style="color:#f59e0b">Pick a fighter!</b><br><br>'+
        'Higher odds = bigger payout but lower chance.','bottom');

    await new Promise(function(resolve){
        var buttons=fBtns.querySelectorAll('button');
        var handler=function(){
            for(var i=0;i<buttons.length;i++) buttons[i].removeEventListener('click',handler);
            resolve();
        };
        for(var i=0;i<buttons.length;i++) buttons[i].addEventListener('click',handler);
    });
    tutLower(fBtns);
    await sleep(500);
    if(!TUT.active)return;

    // Step 3: explain play
    tutShow(null,
        '<div class="tut-step">STEP 3/3</div>'+
        'Bet placed! Now hit <b style="color:#f59e0b">▶ PLAY</b> to start the race.<br><br>'+
        'Fighters compete automatically.<br>'+
        'If yours wins — you get the payout!<br><br>'+
        '🎉 Now you know Bet&Wet!<br>'+
        '<span style="color:#666;font-size:11px">tap to return</span>','middle');
    await tutWaitTap(3000);
    TUT.active=false;
    tutHide();
    CFG.bets={};
}

// --- entry point ---
function startTutorial(){
    sndPlay('click');
    var mode=CFG.mode;
    if(mode==='solo') tutErosion();
    else if(mode==='pvp') tutSoiron();
    else if(mode==='bet') tutBetwet();
}
