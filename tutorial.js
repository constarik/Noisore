// tutorial.js — NOISORE onboarding v9.6
var TUT={active:false};

// EROSION grid — channel path will zigzag through cols 2→3→4
var TUT_GRID_EROSION=[
    [5,8,3,7,9,6],
    [4,7,2,6,8,5],
    [3,9,4,5,7,4],
    [6,8,5,3,9,3],
    [7,5,6,5,2,6],
    [8,6,7,6,3,4]
];
// channel path: (0,2)(1,2)(2,2) → (2,3)(3,3) → (3,4)(4,4)(5,4)
var TUT_PATH=[
    {step:0,cells:[[0,2],[1,2],[2,2]]},
    {step:1,cells:[[2,3],[3,3]]},
    {step:2,cells:[[3,4],[4,4],[5,4]]}
];
var TUT_COLS=[2,3,4]; // which col button to click at each step

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
    overlay.classList.remove('show');
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

// animate cells to 0 one by one with sound
async function tutAnimatePath(cells){
    for(var i=0;i<cells.length;i++){
        var r=cells[i][0],c=cells[i][1];
        grid[r][c]=0;
        updateCell(r,c);
        sndPlay('wash');
        await sleep(400);
    }
}

// wait for click on specific col button
function tutWaitCol(col){
    return new Promise(function(resolve){
        var btns=document.querySelectorAll('.col-btn');
        for(var i=0;i<btns.length;i++){
            if(i!==col) btns[i].classList.add('disabled');
        }
        btns[col].onclick=function(){
            sndPlay('click');
            for(var j=0;j<btns.length;j++) btns[j].classList.remove('disabled');
            resolve();
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

    // set tutorial grid
    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_EROSION[r][c];
    renderGrid();fitGrid();
    document.getElementById('payout-area').innerHTML='';

    // Step 1: explain goal
    setColBtnsDisabled(true);
    tutShow(
        '<div class="tut-step">EROSION — STEP 1/5</div>'+
        'Carve a <b style="color:#f59e0b">water channel</b><br>from top to bottom!<br><br>'+
        'Drop water on columns to erode stones.<br>'+
        'The channel can zigzag through the grid.','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();

    // Step 2: first drop — col 3 (index 2)
    setColBtnsDisabled(false);
    tutHighlightCol(TUT_COLS[0]);
    tutShowTarget(
        '<div class="tut-step">STEP 2/5</div>'+
        'Column 3 has weak stones.<br>'+
        '<b style="color:#f59e0b">Tap the 💧 above it!</b>','bottom');
    await tutWaitCol(TUT_COLS[0]);
    tutUnhighlightCol(TUT_COLS[0]);
    document.getElementById('tut-text').style.display='none';
    setColBtnsDisabled(true);
    // animate stones breaking
    await tutAnimatePath(TUT_PATH[0].cells);
    await sleep(1000);
    if(!TUT.active)return;

    // Step 3: second drop — col 4 (index 3)
    setColBtnsDisabled(false);
    tutHighlightCol(TUT_COLS[1]);
    tutShowTarget(
        '<div class="tut-step">STEP 3/5</div>'+
        'Now the water needs to turn right.<br>'+
        '<b style="color:#f59e0b">Tap column 4!</b>','bottom');
    await tutWaitCol(TUT_COLS[1]);
    tutUnhighlightCol(TUT_COLS[1]);
    document.getElementById('tut-text').style.display='none';
    setColBtnsDisabled(true);
    await tutAnimatePath(TUT_PATH[1].cells);
    await sleep(1000);
    if(!TUT.active)return;

    // Step 4: third drop — col 5 (index 4)
    setColBtnsDisabled(false);
    tutHighlightCol(TUT_COLS[2]);
    tutShowTarget(
        '<div class="tut-step">STEP 4/5</div>'+
        'Almost there! Finish the channel.<br>'+
        '<b style="color:#f59e0b">Tap column 5!</b>','bottom');
    await tutWaitCol(TUT_COLS[2]);
    tutUnhighlightCol(TUT_COLS[2]);
    document.getElementById('tut-text').style.display='none';
    setColBtnsDisabled(true);
    await tutAnimatePath(TUT_PATH[2].cells);
    // channel flash
    sndPlay('win');
    var flash=document.getElementById('channel-flash');
    flash.classList.add('show');
    await sleep(2000);
    flash.classList.remove('show');
    if(!TUT.active)return;

    // Step 5: done — show at TOP so channel is visible
    tutShow(
        '🎉 <b style="color:#f59e0b">CHANNEL COMPLETE!</b><br><br>'+
        'Water flows from top to bottom<br>'+
        'through the empty cells — you win!','top');
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
    await sleep(600);

    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID_SOIRON[r][c];
    renderGrid();fitGrid();
    document.getElementById('payout-area').innerHTML='';

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

    // Step 2: player drops, then bot drops
    var col=1;
    setColBtnsDisabled(false);
    tutHighlightCol(col);
    tutShowTarget(
        '<div class="tut-step">STEP 2/3</div>'+
        'Column 2 looks weak.<br>'+
        '<b style="color:#f59e0b">Tap it!</b>','bottom');
    await tutWaitCol(col);
    tutUnhighlightCol(col);
    document.getElementById('tut-text').style.display='none';
    setColBtnsDisabled(true);
    // animate player drop
    await tutAnimatePath([[0,1],[1,1]]);
    await sleep(500);
    // animate bot drop on col 4
    showDropInfo('Bot','#4ad',5,0,0);
    await sleep(300);
    grid[0][4]=0;updateCell(0,4);sndPlay('wash');
    await sleep(400);
    grid[1][4]=0;updateCell(1,4);sndPlay('wash');
    await sleep(1500);
    if(!TUT.active)return;

    // Step 3
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
