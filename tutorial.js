// tutorial.js — NOISORE onboarding v9.4
var TUT={active:false};

var TUT_GRID_EROSION=[
    [5,8,7,3,9,6],
    [4,7,6,2,8,5],
    [3,9,5,3,7,4],
    [6,8,4,2,9,3],
    [7,5,3,3,8,6],
    [8,6,7,2,5,4]
];
var TUT_GRID_SOIRON=[
    [7,2,8,5,9,6],
    [6,3,7,4,8,5],
    [5,2,6,3,7,4],
    [8,3,5,6,9,3],
    [9,2,4,7,8,6],
    [7,3,3,8,5,4]
];

function tutShow(text,textPos){
    var txt=document.getElementById('tut-text');
    var overlay=document.getElementById('tut-overlay');
    var skip=document.getElementById('tut-skip');
    overlay.classList.add('show');
    overlay.style.background='rgba(0,0,0,0.55)';
    skip.style.display='block';
    txt.style.display='block';
    txt.innerHTML=text;
    txt.style.top='auto';txt.style.bottom='auto';
    txt.style.transform='translateX(-50%)';
    if(textPos==='top'){txt.style.top='5%';}
    else if(textPos==='bottom'){txt.style.bottom='5%';}
    else{txt.style.top='35%';}
}

function tutShowTarget(text,textPos){
    var txt=document.getElementById('tut-text');
    var overlay=document.getElementById('tut-overlay');
    var skip=document.getElementById('tut-skip');
    // no overlay blocking — target is directly clickable
    overlay.classList.remove('show');
    skip.style.display='block';
    txt.style.display='block';
    txt.innerHTML=text;
    txt.style.top='auto';txt.style.bottom='auto';
    txt.style.transform='translateX(-50%)';
    if(textPos==='top'){txt.style.top='5%';}
    else if(textPos==='bottom'){txt.style.bottom='5%';}
    else{txt.style.top='35%';}
}

function tutHide(){
    document.getElementById('tut-overlay').classList.remove('show');
    document.getElementById('tut-overlay').style.background='';
    document.getElementById('tut-text').style.display='none';
    document.getElementById('tut-skip').style.display='none';
    document.getElementById('tut-hole').style.display='none';
}

function tutWaitTap(ms){
    var delay=ms||3000;
    return new Promise(function(resolve){
        var ready=false;
        setTimeout(function(){ready=true;},delay);
        var overlay=document.getElementById('tut-overlay');
        var handler=function(){
            if(!ready)return;
            overlay.removeEventListener('click',handler);
            resolve();
        };
        overlay.addEventListener('click',handler);
    });
}

function tutHighlightCol(col){
    // pulse the cells in this column
    for(var r=0;r<ROWS;r++){
        var cell=document.getElementById('cell-'+r+'-'+col);
        if(cell) cell.style.outline='2px solid #f59e0b';
    }
    var btn=document.querySelectorAll('.col-btn')[col];
    if(btn) btn.style.outline='2px solid #f59e0b';
}
function tutUnhighlightCol(col){
    for(var r=0;r<ROWS;r++){
        var cell=document.getElementById('cell-'+r+'-'+col);
        if(cell) cell.style.outline='';
    }
    var btn=document.querySelectorAll('.col-btn')[col];
    if(btn) btn.style.outline='';
}

function tutWaitCol(col){
    return new Promise(function(resolve){
        // disable all columns except target
        var btns=document.querySelectorAll('.col-btn');
        for(var i=0;i<btns.length;i++){
            if(i!==col) btns[i].classList.add('disabled');
        }
        // wait for the drop to finish
        var origOnclick=btns[col].onclick;
        btns[col].onclick=function(){
            sndPlay('click');
            playDrop(col);
            // wait for animation to finish
            var check=setInterval(function(){
                if(!animating){
                    clearInterval(check);
                    for(var j=0;j<btns.length;j++) btns[j].classList.remove('disabled');
                    btns[col].onclick=origOnclick;
                    resolve();
                }
            },200);
        };
    });
}

function tutSkip(){
    TUT.active=false;
    tutHide();
    backToLobby();
}

// ========== EROSION ==========
async function tutErosion(){
    TUT.active=true;
    CFG.mode='solo';CFG.gridSize=6;CFG.rotate=false;CFG.stake=0;
    startGame();
    await sleep(600);

    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_EROSION[r][c];
    renderGrid();fitGrid();

    // Step 1: explain goal
    setColBtnsDisabled(true);
    tutShow(
        '<div class="tut-step">EROSION — STEP 1/4</div>'+
        'Your goal: carve a <b style="color:#f59e0b">water channel</b><br>from top to bottom!<br><br>'+
        'Drop water on columns to erode stones.<br>'+
        'Weaker stones break easier.','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();

    // Step 2: highlight column 3 (weakest: 3,2,3,2,3,2 = sum 15)
    var col=3;
    currentDrop=7;
    document.getElementById('drop-power').textContent='7';
    document.getElementById('drop-power').className='drop-power-value dp7';
    document.getElementById('payout-area').innerHTML='';
    setColBtnsDisabled(false);
    tutHighlightCol(col);
    tutShowTarget(
        '<div class="tut-step">STEP 2/4</div>'+
        'Column 4 is the weakest path.<br><br>'+
        '<b style="color:#f59e0b">Tap the 💧 above it!</b>','bottom');
    await tutWaitCol(col);
    tutUnhighlightCol(col);
    await sleep(1500);
    if(!TUT.active)return;

    // Step 3: explain what happened
    setColBtnsDisabled(true);
    tutShow(
        '<div class="tut-step">STEP 3/4</div>'+
        'The water carved through!<br><br>'+
        'Your drop of <b style="color:#f59e0b">power 7</b> eroded<br>'+
        'multiple stones in a row.<br>'+
        'Now finish the channel!','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();

    // Step 4: finish
    currentDrop=9;
    document.getElementById('drop-power').textContent='9';
    document.getElementById('drop-power').className='drop-power-value dp9';
    document.getElementById('payout-area').innerHTML='';
    setColBtnsDisabled(false);
    tutHighlightCol(col);
    tutShowTarget(
        '<div class="tut-step">STEP 4/4</div>'+
        '<b style="color:#f59e0b">Tap column 4 again</b><br>to complete the channel!','bottom');
    await tutWaitCol(col);
    tutUnhighlightCol(col);
    await sleep(2000);
    if(!TUT.active)return;

    // done
    setColBtnsDisabled(true);
    tutShow(
        '🎉 <b style="color:#f59e0b">CHANNEL COMPLETE!</b><br><br>'+
        'You carved water from top to bottom —<br>'+
        'that\'s how you win EROSION!','middle');
    await tutWaitTap(3000);
    TUT.active=false;
    tutHide();
    backToLobby();
}

// ========== SOIRON ==========
async function tutSoiron(){
    TUT.active=true;
    CFG.mode='pvp';CFG.gridSize=6;CFG.rotate=false;CFG.stake=0;CFG.numBots=1;
    startGame();
    await sleep(600);

    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_SOIRON[r][c];
    renderGrid();fitGrid();

    // Step 1
    setColBtnsDisabled(true);
    tutShow(
        '<div class="tut-step">SOIRON — STEP 1/3</div>'+
        'Race against opponents!<br>'+
        'Everyone drops water each turn.<br><br>'+
        'First to carve a channel<br>'+
        '<b style="color:#f59e0b">wins the pool!</b>','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();

    // Step 2: drop
    var col=1;
    currentDrop=8;
    document.getElementById('drop-power').textContent='8';
    document.getElementById('drop-power').className='drop-power-value dp8';
    document.getElementById('payout-area').innerHTML='';
    setColBtnsDisabled(false);
    tutHighlightCol(col);
    tutShowTarget(
        '<div class="tut-step">STEP 2/3</div>'+
        'Column 2 looks weak.<br><br>'+
        '<b style="color:#f59e0b">Tap it!</b><br>'+
        'Your opponent will also drop.','bottom');
    await tutWaitCol(col);
    tutUnhighlightCol(col);
    await sleep(2000);
    if(!TUT.active)return;

    // Step 3
    setColBtnsDisabled(true);
    tutShow(
        '<div class="tut-step">STEP 3/3</div>'+
        'You both dropped water!<br><br>'+
        'Your opponent is carving<br>'+
        '<b style="color:#f59e0b">their own</b> channel.<br>'+
        'First to finish wins!<br><br>'+
        '🎉 Now you know SOIRON!','middle');
    await tutWaitTap(3000);
    TUT.active=false;
    tutHide();
    backToLobby();
}

// ========== BET&WET ==========
async function tutBetwet(){
    TUT.active=true;
    CFG.mode='bet';CFG.gridSize=6;CFG.rotate=false;CFG.stake=1;CFG.bets={};
    setMode('bet');
    randomizeFighterNames();
    await sleep(300);

    // Step 1
    tutShow(
        '<div class="tut-step">BET & WET — STEP 1/3</div>'+
        'Six fighters race to carve a channel.<br><br>'+
        'Pick a fighter, place your bet,<br>'+
        'watch the race!','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();

    // Step 2: pick fighter
    var fBtns=document.getElementById('fighter-btns');
    tutShowTarget(
        '<div class="tut-step">STEP 2/3</div>'+
        '<b style="color:#f59e0b">Pick a fighter!</b><br><br>'+
        'Higher odds = bigger payout<br>but lower chance to win.','top');
    await new Promise(function(resolve){
        var buttons=fBtns.querySelectorAll('button');
        var handler=function(){
            for(var i=0;i<buttons.length;i++) buttons[i].removeEventListener('click',handler);
            resolve();
        };
        for(var i=0;i<buttons.length;i++) buttons[i].addEventListener('click',handler);
    });
    await sleep(500);
    if(!TUT.active)return;

    // Step 3
    tutShow(
        '<div class="tut-step">STEP 3/3</div>'+
        'Bet placed!<br><br>'+
        'Hit <b style="color:#f59e0b">▶ PLAY</b> to start the race.<br>'+
        'Fighters compete automatically.<br>'+
        'If yours wins — you get the payout!<br><br>'+
        '🎉 Now you know Bet&Wet!','middle');
    await tutWaitTap(3000);
    TUT.active=false;
    tutHide();
    CFG.bets={};
}

// --- entry ---
function startTutorial(){
    sndPlay('click');
    if(CFG.mode==='solo') tutErosion();
    else if(CFG.mode==='pvp') tutSoiron();
    else if(CFG.mode==='bet') tutBetwet();
}
