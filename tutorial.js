// tutorial.js — NOISORE onboarding tutorials
var TUT={active:false,mode:null,step:0,resolve:null};

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
function tutShow(el,rect,text,textPos){
    var hole=document.getElementById('tut-hole');
    var txt=document.getElementById('tut-text');
    var overlay=document.getElementById('tut-overlay');
    var skip=document.getElementById('tut-skip');
    overlay.classList.add('show');
    skip.style.display='block';
    if(rect){
        hole.style.display='block';
        hole.style.left=(rect.left-4)+'px';
        hole.style.top=(rect.top-4)+'px';
        hole.style.width=(rect.width+8)+'px';
        hole.style.height=(rect.height+8)+'px';
    }else{
        hole.style.display='none';
    }
    if(text){
        txt.style.display='block';
        txt.innerHTML=text;
        if(textPos==='top') txt.style.top='10%'; else txt.style.top='auto';
        if(textPos==='bottom') txt.style.bottom='8%'; else txt.style.bottom='auto';
        if(!textPos||textPos==='middle'){txt.style.top='50%';txt.style.bottom='auto';txt.style.transform='translate(-50%,-50%)';}
        else{txt.style.transform='translateX(-50%)';}
    }else{
        txt.style.display='none';
    }
}
function tutHide(){
    document.getElementById('tut-overlay').classList.remove('show');
    document.getElementById('tut-hole').style.display='none';
    document.getElementById('tut-text').style.display='none';
    document.getElementById('tut-skip').style.display='none';
}
function tutWaitClick(targetEl){
    return new Promise(function(resolve){
        TUT.resolve=resolve;
        var handler=function(e){
            e.stopPropagation();
            targetEl.removeEventListener('click',handler,true);
            resolve();
        };
        targetEl.addEventListener('click',handler,true);
    });
}
function tutWaitColClick(col){
    return new Promise(function(resolve){
        TUT.resolve=resolve;
        var btns=document.querySelectorAll('.col-btn');
        // block all except target
        var overlay=document.getElementById('tut-overlay');
        overlay.style.pointerEvents='none';
        for(var i=0;i<btns.length;i++){
            if(i===col){
                btns[i].style.position='relative';
                btns[i].style.zIndex='160';
            }else{
                btns[i].classList.add('disabled');
            }
        }
        var origPlayDrop=window._origPlayDrop||null;
        // wait for the game to process the drop
        var check=setInterval(function(){
            if(!animating){
                clearInterval(check);
                for(var j=0;j<btns.length;j++){
                    btns[j].style.position='';
                    btns[j].style.zIndex='';
                    btns[j].classList.remove('disabled');
                }
                overlay.style.pointerEvents='auto';
                resolve();
            }
        },200);
    });
}
function tutSkip(){
    TUT.active=false;
    tutHide();
    backToLobby();
}

// --- EROSION tutorial ---
async function tutErosion(){
    TUT.active=true;TUT.mode='solo';TUT.step=0;
    // setup game
    CFG.mode='solo';CFG.gridSize=6;CFG.rotate=false;CFG.stake=0;
    startGame();
    await sleep(500);
    // override grid
    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_EROSION[r][c];
    renderGrid();fitGrid();

    // Step 1: explain the goal
    tutShow(null,null,
        '<div class="tut-step">EROSION — STEP 1/4</div>'+
        'Carve a <b style="color:#f59e0b">water channel</b> from top to bottom!<br><br>'+
        'Drop water on columns to erode stones. Stones with <b style="color:#f59e0b">smaller numbers</b> break easier.<br><br>'+
        '<span style="color:#888">tap anywhere to continue</span>','middle');
    await new Promise(function(r){document.getElementById('tut-overlay').onclick=function(){this.onclick=null;r();};});

    // Step 2: highlight weakest column
    var col=3;
    var btn=document.querySelectorAll('.col-btn')[col];
    var rect=btn.getBoundingClientRect();
    // also highlight the column cells
    currentDrop=6;
    document.getElementById('drop-power').textContent='6';
    document.getElementById('drop-power').className='drop-power-value dp6';
    tutShow(btn,rect,
        '<div class="tut-step">STEP 2/4</div>'+
        'Column 4 has the weakest stones (1,1,2,1,1,2).<br><br>'+
        '<b style="color:#f59e0b">Tap the drop button</b> above that column!','top');
    // raise button above overlay
    btn.style.position='relative';btn.style.zIndex='160';
    await tutWaitColClick(col);
    await sleep(800);
    if(!TUT.active)return;

    // Step 3: show progress
    tutShow(null,null,
        '<div class="tut-step">STEP 3/4</div>'+
        'The water eroded the stones!<br>Your drop of <b style="color:#f59e0b">power 6</b> carved through the weak column.<br><br>'+
        'Keep going — clear the whole column top to bottom!<br><br>'+
        '<span style="color:#888">tap to continue</span>','middle');
    await new Promise(function(r){document.getElementById('tut-overlay').onclick=function(){this.onclick=null;r();};});

    // Step 4: one more drop to finish
    currentDrop=8;
    document.getElementById('drop-power').textContent='8';
    document.getElementById('drop-power').className='drop-power-value dp8';
    var btn2=document.querySelectorAll('.col-btn')[col];
    var rect2=btn2.getBoundingClientRect();
    tutShow(btn2,rect2,
        '<div class="tut-step">STEP 4/4</div>'+
        '<b style="color:#f59e0b">Tap again</b> to finish the channel!','top');
    btn2.style.position='relative';btn2.style.zIndex='160';
    await tutWaitColClick(col);
    await sleep(1500);
    if(!TUT.active)return;

    // done
    tutShow(null,null,
        '🎉 <b style="color:#f59e0b">CHANNEL COMPLETE!</b><br><br>'+
        'You carved a path from top to bottom — that\'s how you win EROSION!<br><br>'+
        '<span style="color:#888">tap to return to lobby</span>','middle');
    await new Promise(function(r){document.getElementById('tut-overlay').onclick=function(){this.onclick=null;r();};});
    TUT.active=false;
    tutHide();
    backToLobby();
}

// --- SOIRON tutorial ---
async function tutSoiron(){
    TUT.active=true;TUT.mode='pvp';TUT.step=0;
    CFG.mode='pvp';CFG.gridSize=6;CFG.rotate=false;CFG.stake=0;CFG.numBots=1;
    startGame();
    await sleep(500);
    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_SOIRON[r][c];
    renderGrid();fitGrid();

    // Step 1: explain
    tutShow(null,null,
        '<div class="tut-step">SOIRON — STEP 1/3</div>'+
        'Race against opponents!<br>Everyone drops water each turn.<br><br>'+
        'First to carve a channel <b style="color:#f59e0b">wins the pool</b>!<br><br>'+
        '<span style="color:#888">tap to continue</span>','middle');
    await new Promise(function(r){document.getElementById('tut-overlay').onclick=function(){this.onclick=null;r();};});

    // Step 2: drop on weak column (col 1 has 1,1,2,1,1,2)
    var col=1;
    currentDrop=7;
    document.getElementById('drop-power').textContent='7';
    document.getElementById('drop-power').className='drop-power-value dp7';
    var btn=document.querySelectorAll('.col-btn')[col];
    var rect=btn.getBoundingClientRect();
    tutShow(btn,rect,
        '<div class="tut-step">STEP 2/3</div>'+
        'Column 2 is weak. <b style="color:#f59e0b">Tap it!</b><br><br>'+
        'Your opponent will also make a move.','top');
    btn.style.position='relative';btn.style.zIndex='160';
    await tutWaitColClick(col);
    await sleep(1500);
    if(!TUT.active)return;

    // Step 3: explain what happened
    tutShow(null,null,
        '<div class="tut-step">STEP 3/3</div>'+
        'You both dropped water!<br><br>'+
        'Your opponent is carving <b style="color:#f59e0b">their own</b> channel.<br>'+
        'First to complete wins!<br><br>'+
        '🎉 Now you know SOIRON!<br><span style="color:#888">tap to return</span>','middle');
    await new Promise(function(r){document.getElementById('tut-overlay').onclick=function(){this.onclick=null;r();};});
    TUT.active=false;
    tutHide();
    backToLobby();
}

// --- BET&WET tutorial ---
async function tutBetwet(){
    TUT.active=true;TUT.mode='bet';TUT.step=0;
    CFG.mode='bet';CFG.gridSize=6;CFG.rotate=false;CFG.stake=1;CFG.bets={};
    randomizeFighterNames();

    // Step 1: explain
    tutShow(null,null,
        '<div class="tut-step">BET & WET — STEP 1/3</div>'+
        'Six fighters race to carve a channel.<br>'+
        'Pick a fighter, place your bet, watch the race!<br><br>'+
        '<span style="color:#888">tap to continue</span>','middle');
    await new Promise(function(r){document.getElementById('tut-overlay').onclick=function(){this.onclick=null;r();};});

    // Step 2: highlight fighter buttons
    var fSection=document.getElementById('fighter-section');
    var fBtns=document.getElementById('fighter-btns');
    var rect=fBtns.getBoundingClientRect();
    fBtns.style.position='relative';fBtns.style.zIndex='160';
    tutShow(fBtns,rect,
        '<div class="tut-step">STEP 2/3</div>'+
        '<b style="color:#f59e0b">Pick a fighter!</b><br>'+
        'Higher odds = bigger payout but lower chance.','bottom');
    // wait for any fighter click
    await new Promise(function(resolve){
        var buttons=fBtns.querySelectorAll('button');
        var handler=function(){
            for(var i=0;i<buttons.length;i++) buttons[i].removeEventListener('click',handler);
            resolve();
        };
        for(var i=0;i<buttons.length;i++) buttons[i].addEventListener('click',handler);
    });
    fBtns.style.position='';fBtns.style.zIndex='';
    await sleep(300);
    if(!TUT.active)return;

    // Step 3: start the race
    tutShow(null,null,
        '<div class="tut-step">STEP 3/3</div>'+
        'Your bet is placed! Now hit <b style="color:#f59e0b">▶ PLAY</b> to start the race.<br><br>'+
        'The fighters will compete automatically.<br>If your fighter wins — you get the payout!<br><br>'+
        '🎉 Now you know Bet&Wet!<br><span style="color:#888">tap to return</span>','middle');
    await new Promise(function(r){document.getElementById('tut-overlay').onclick=function(){this.onclick=null;r();};});
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
