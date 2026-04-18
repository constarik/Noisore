// tutorial.js — NOISORE onboarding v9.7
// Uses REAL game engine (playDrop). No faking.
var TUT={active:false};

// EROSION: col 3 (0-idx) = [2,1,2,1,2,1] sum=9. Drop1=6 clears 5(2+1+2), Drop2=6 clears rest.
var TUT_GRID_EROSION=[
    [5,8,7,2,9,6],
    [4,7,6,1,8,5],
    [8,9,5,2,7,4],
    [6,8,4,1,9,3],
    [7,5,8,2,8,6],
    [9,6,7,1,5,4]
];
var TUT_COL_EROSION=3; // 0-indexed, display "column 4"

var TUT_GRID_SOIRON=[
    [7,2,8,5,9,6],
    [6,1,7,4,8,5],
    [5,2,6,8,7,4],
    [8,1,5,6,9,3],
    [9,2,4,7,8,6],
    [7,1,8,8,5,4]
];
var TUT_COL_SOIRON=1;

function tutShow(text,textPos){
    var txt=document.getElementById('tut-text');
    var overlay=document.getElementById('tut-overlay');
    overlay.classList.add('show');
    overlay.style.background='rgba(0,0,0,0.55)';
    document.getElementById('tut-skip').style.display='block';
    txt.style.display='block';
    txt.innerHTML=text;
    txt.style.top='auto';txt.style.bottom='auto';
    txt.style.transform='translateX(-50%)';
    if(textPos==='top'){txt.style.top='5%';}
    else if(textPos==='bottom'){txt.style.bottom='5%';}
    else{txt.style.top='35%';}
}

function tutShowHint(text,textPos){
    // show text WITHOUT overlay — game elements clickable
    var txt=document.getElementById('tut-text');
    document.getElementById('tut-overlay').classList.remove('show');
    document.getElementById('tut-skip').style.display='block';
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

// wait for real playDrop on specific column, block others
function tutWaitDrop(col){
    return new Promise(function(resolve){
        var btns=document.querySelectorAll('.col-btn');
        var origHandlers=[];
        for(var i=0;i<btns.length;i++){
            origHandlers.push(btns[i].onclick);
            if(i!==col){
                btns[i].classList.add('disabled');
                btns[i].onclick=null;
            }
        }
        var origClick=btns[col].onclick;
        btns[col].onclick=function(){
            // restore all handlers
            for(var j=0;j<btns.length;j++){
                btns[j].classList.remove('disabled');
                btns[j].onclick=origHandlers[j];
            }
            // call real playDrop
            sndPlay('click');
            playDrop(col);
            // wait for animation to finish
            var check=setInterval(function(){
                if(!animating){
                    clearInterval(check);
                    resolve();
                }
            },100);
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
    await sleep(800);

    // override grid
    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_EROSION[r][c];
    renderGrid();fitGrid();
    document.getElementById('payout-area').innerHTML='';
    var col=TUT_COL_EROSION;

    // Step 1: explain
    setColBtnsDisabled(true);
    tutShow(
        '<div class="tut-step">EROSION — STEP 1/4</div>'+
        'Carve a <b style="color:#f59e0b">water channel</b><br>from top to bottom!<br><br>'+
        'Drop water on a column to erode stones.<br>'+
        'Weaker stones break easier.','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();

    // Step 2: first drop
    currentDrop=6;
    document.getElementById('drop-power').textContent='6';
    document.getElementById('drop-power').className='drop-power-value dp6';
    document.getElementById('payout-area').innerHTML='';
    animating=false;
    setColBtnsDisabled(false);
    tutHighlightCol(col);
    tutShowHint(
        '<div class="tut-step">STEP 2/4</div>'+
        'Column '+(col+1)+' has weak stones (2,1,2,1,2,1).<br>'+
        '<b style="color:#f59e0b">Tap the 💧 above it!</b>','bottom');
    await tutWaitDrop(col);
    tutUnhighlightCol(col);
    document.getElementById('tut-text').style.display='none';
    await sleep(2000);
    if(!TUT.active)return;

    // Step 3: explain progress
    setColBtnsDisabled(true);
    tutShow(
        '<div class="tut-step">STEP 3/4</div>'+
        'The water carved through!<br><br>'+
        'Some stones are gone, others weakened.<br>'+
        'One more drop to finish the channel!','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();

    // Step 4: second drop
    currentDrop=8;
    document.getElementById('drop-power').textContent='8';
    document.getElementById('drop-power').className='drop-power-value dp8';
    document.getElementById('payout-area').innerHTML='';
    animating=false;
    setColBtnsDisabled(false);
    tutHighlightCol(col);
    tutShowHint(
        '<div class="tut-step">STEP 4/4</div>'+
        '<b style="color:#f59e0b">Tap column '+(col+1)+' again!</b>','bottom');
    await tutWaitDrop(col);
    tutUnhighlightCol(col);
    document.getElementById('tut-text').style.display='none';
    await sleep(3000);
    if(!TUT.active)return;

    // done
    tutShow(
        '🎉 <b style="color:#f59e0b">CHANNEL COMPLETE!</b><br><br>'+
        'Water flows top to bottom — you win!<br><br>'+
        'With rotation ON, channels can zigzag<br>'+
        'through adjacent columns.','top');
    await tutWaitTap(4000);
    TUT.active=false;
    tutHide();
    backToLobby();
}

// ========== SOIRON ==========
async function tutSoiron(){
    TUT.active=true;
    CFG.mode='pvp';CFG.gridSize=6;CFG.rotate=false;CFG.stake=0;CFG.numBots=1;
    startGame();
    await sleep(800);

    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_SOIRON[r][c];
    renderGrid();fitGrid();
    document.getElementById('payout-area').innerHTML='';
    var col=TUT_COL_SOIRON;

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
    currentDrop=8;
    document.getElementById('drop-power').textContent='8';
    document.getElementById('drop-power').className='drop-power-value dp8';
    document.getElementById('payout-area').innerHTML='';
    animating=false;
    setColBtnsDisabled(false);
    tutHighlightCol(col);
    tutShowHint(
        '<div class="tut-step">STEP 2/3</div>'+
        'Column '+(col+1)+' has weak stones.<br>'+
        '<b style="color:#f59e0b">Tap it!</b> Your opponent will also drop.','bottom');
    await tutWaitDrop(col);
    tutUnhighlightCol(col);
    document.getElementById('tut-text').style.display='none';
    await sleep(2500);
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
    tutShowHint(
        '<div class="tut-step">STEP 2/3</div>'+
        '<b style="color:#f59e0b">Pick a fighter!</b><br><br>'+
        'Higher odds = bigger payout<br>but lower chance to win.','top');
    var fBtns=document.getElementById('fighter-btns');
    await new Promise(function(resolve){
        var buttons=fBtns.querySelectorAll('button');
        var handler=function(){
            for(var i=0;i<buttons.length;i++) buttons[i].removeEventListener('click',handler);
            resolve();
        };
        for(var i=0;i<buttons.length;i++) buttons[i].addEventListener('click',handler);
    });
    document.getElementById('tut-text').style.display='none';
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

function startTutorial(){
    sndPlay('click');
    if(CFG.mode==='solo') tutErosion();
    else if(CFG.mode==='pvp') tutSoiron();
    else if(CFG.mode==='bet') tutBetwet();
}
