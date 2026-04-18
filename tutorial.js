// tutorial.js — NOISORE onboarding v9.8
// Uses seeded RNG + real game engine. Zero faking.
var TUT={active:false};
var _tutOrigRandom=null;
function _tutRng(seed){var s=seed;return function(){s=(s*1103515245+12345)&0x7FFFFFFF;return s/0x7FFFFFFF;};}

var TUT_GRID=[[7,4,2,7,5,3],[7,1,9,2,9,1],[3,9,2,8,5,8],[6,6,6,1,1,5],[10,2,2,6,8,5],[2,3,4,10,3,4]];
// Seed 17 produces: T1 col2 dp7 zigzag, T2 col6 dp5, T3 col5 dp10 zigzag→channel
var TUT_SEED=17;
var TUT_TURNS=[
    {col:1, dp:7, colDisplay:2, hint:'Column 2 has weak stones at the top.'},
    {col:5, dp:5, colDisplay:6, hint:'Column 6 — weaken the flank.'},
    {col:4, dp:10, colDisplay:5, hint:'Column 5 — carve through to the bottom!'}
];


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
        var handler=function(){if(!ready)return;overlay.removeEventListener('click',handler);resolve();};
        overlay.addEventListener('click',handler);
    });
}
function tutHighlightCol(col){
    for(var r=0;r<ROWS;r++){var c=document.getElementById('cell-'+r+'-'+col);if(c)c.style.outline='2px solid #f59e0b';}
    var b=document.querySelectorAll('.col-btn')[col];if(b)b.style.outline='2px solid #f59e0b';
}
function tutUnhighlightCol(col){
    for(var r=0;r<ROWS;r++){var c=document.getElementById('cell-'+r+'-'+col);if(c)c.style.outline='';}
    var b=document.querySelectorAll('.col-btn')[col];if(b)b.style.outline='';
}
function tutWaitDrop(col){
    return new Promise(function(resolve){
        var btns=document.querySelectorAll('.col-btn');
        var orig=[];
        for(var i=0;i<btns.length;i++){orig.push(btns[i].onclick);if(i!==col){btns[i].classList.add('disabled');btns[i].onclick=null;}}
        btns[col].onclick=function(){
            for(var j=0;j<btns.length;j++){btns[j].classList.remove('disabled');btns[j].onclick=orig[j];}
            sndPlay('click');playDrop(col);
            var check=setInterval(function(){if(!animating){clearInterval(check);resolve();}},100);
        };
    });
}
function tutSkip(){
    TUT.active=false;tutHide();
    if(_tutOrigRandom){Math.random=_tutOrigRandom;_tutOrigRandom=null;}
    backToLobby();
}

// ========== EROSION ==========
async function tutErosion(){
    TUT.active=true;
    // seed Math.random
    _tutOrigRandom=Math.random;
    Math.random=_tutRng(TUT_SEED);
    
    CFG.mode='solo';CFG.gridSize=6;CFG.rotate=true;CFG.stake=0;
    startGame(); // consumes 36+1 rng calls (initGrid + rollDrop)
    await sleep(800);
    
    // override grid with our preset
    for(var r=0;r<6;r++)for(var c=0;c<6;c++) grid[r][c]=TUT_GRID[r][c];
    renderGrid();fitGrid();
    document.getElementById('payout-area').innerHTML='';
    
    // Step 1: explain
    setColBtnsDisabled(true);
    document.getElementById('col-btns').style.visibility='hidden';
    tutShow(
        '<div class="tut-step">EROSION — STEP 1/'+(TUT_TURNS.length+2)+'</div>'+
        'Carve a <b style="color:#f59e0b">water channel</b><br>from top to bottom!<br><br>'+
        'Drops flow down and zigzag<br>toward weaker stones.<br><br>'+
        'After each turn the grid <b style="color:#f59e0b">rotates 90°</b>.','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();
    document.getElementById('col-btns').style.visibility='';
    
    // Play turns
    for(var t=0;t<TUT_TURNS.length;t++){
        var turn=TUT_TURNS[t];
        currentDrop=turn.dp;
        document.getElementById('drop-power').textContent=String(turn.dp);
        document.getElementById('drop-power').className='drop-power-value dp'+turn.dp;
        document.getElementById('payout-area').innerHTML='';
        animating=false;
        setColBtnsDisabled(false);
        tutHighlightCol(turn.col);
        var stepNum=t+2;
        var totalSteps=TUT_TURNS.length+2;
        tutShowHint(
            '<div class="tut-step">STEP '+stepNum+'/'+totalSteps+'</div>'+
            turn.hint+'<br><b style="color:#f59e0b">Tap column '+turn.colDisplay+'!</b>'+
            '<br><span style="color:#888;font-size:10px">drop power: '+turn.dp+'</span>','bottom');
        await tutWaitDrop(turn.col);
        setColBtnsDisabled(true);
        tutUnhighlightCol(turn.col);
        document.getElementById('tut-text').style.display='none';
        // wait for animation + possible rotation + possible win
        await sleep(3000);
        if(!TUT.active)return;
    }
    
    // Final step
    await sleep(1000);
    tutShow(
        '🎉 <b style="color:#f59e0b">CHANNEL COMPLETE!</b><br><br>'+
        'Water zigzagged through weak stones<br>'+
        'and the grid rotated between turns!<br><br>'+
        'That\'s how you win EROSION.','top');
    await tutWaitTap(4000);
    TUT.active=false;tutHide();
    Math.random=_tutOrigRandom;_tutOrigRandom=null;
    backToLobby();
}

// ========== SOIRON ==========
var TUT_SOIRON_SEED=9;
var TUT_SOIRON_TURNS=[
    {col:1, colDisplay:2, hint:'Column 2 has weak stones.'},
    {col:4, colDisplay:5, hint:'Column 5 — press the attack!'},
    {col:3, colDisplay:4, hint:'Column 4 — finish them off!'}
];

async function tutSoiron(){
    TUT.active=true;
    _tutOrigRandom=Math.random;
    Math.random=_tutRng(TUT_SOIRON_SEED);
    
    CFG.mode='pvp';CFG.gridSize=6;CFG.rotate=true;CFG.stake=0;CFG.numBots=3;
    startGame();
    await sleep(800);

    // Step 1: explain
    setColBtnsDisabled(true);
    document.getElementById('col-btns').style.visibility='hidden';
    tutShow(
        '<div class="tut-step">SOIRON — STEP 1/'+(TUT_SOIRON_TURNS.length+2)+'</div>'+
        'Race against <b style="color:#f59e0b">3 opponents</b>!<br><br>'+
        'Each turn, all 4 players drop water.<br>'+
        'After each turn the grid rotates.<br><br>'+
        'First to carve a channel<br><b style="color:#f59e0b">wins the pool!</b>','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();
    document.getElementById('col-btns').style.visibility='';

    // Play turns
    for(var t=0;t<TUT_SOIRON_TURNS.length;t++){
        var turn=TUT_SOIRON_TURNS[t];
        document.getElementById('payout-area').innerHTML='';
        animating=false;
        setColBtnsDisabled(false);
        tutHighlightCol(turn.col);
        var stepNum=t+2;
        var totalSteps=TUT_SOIRON_TURNS.length+2;
        tutShowHint(
            '<div class="tut-step">STEP '+stepNum+'/'+totalSteps+'</div>'+
            turn.hint+'<br><b style="color:#f59e0b">Tap column '+turn.colDisplay+'!</b><br>'+
            '<span style="color:#888;font-size:10px">Your opponents will also drop.</span>','bottom');
        await tutWaitDrop(turn.col);
        setColBtnsDisabled(true);
        tutUnhighlightCol(turn.col);
        document.getElementById('tut-text').style.display='none';
        // wait for all 4 players animation + rotation + possible win
        await sleep(5000);
        if(!TUT.active)return;
        // check if game ended (checkWin showed NEXT ROUND button)
        if(document.querySelector('#payout-area button')){
            // someone won
            await sleep(2000);
            tutShow(
                '🎉 <b style="color:#f59e0b">RACE OVER!</b><br><br>'+
                'A channel was carved!<br>'+
                'The winner takes the pool.<br><br>'+
                'That\'s SOIRON — multiplayer water racing!','top');
            await tutWaitTap(4000);
            TUT.active=false;tutHide();
            Math.random=_tutOrigRandom;_tutOrigRandom=null;
            backToLobby();
            return;
        }
    }
    
    // no win in 3 turns — explain
    tutShow(
        '<div class="tut-step">STEP '+(TUT_SOIRON_TURNS.length+2)+'/'+(TUT_SOIRON_TURNS.length+2)+'</div>'+
        'The race continues until someone<br>carves a full channel top to bottom!<br><br>'+
        'With 4 players and rotation,<br>every turn changes the board.<br><br>'+
        '🎉 Now you know SOIRON!','middle');
    await tutWaitTap(3000);
    TUT.active=false;tutHide();
    Math.random=_tutOrigRandom;_tutOrigRandom=null;
    backToLobby();
}

// ========== BET&WET ==========
var TUT_BET_SEED=42;

async function tutBetwet(){
    TUT.active=true;
    CFG.mode='bet';CFG.gridSize=6;CFG.rotate=true;CFG.stake=1;CFG.bets={};
    setMode('bet');randomizeFighterNames();
    await sleep(300);

    // Step 1: explain
    tutShow(
        '<div class="tut-step">BET & WET — STEP 1/4</div>'+
        '<b style="color:#f59e0b">6 fighters</b> race to carve a channel.<br><br>'+
        'Each fighter has a strategy and <b style="color:#f59e0b">odds</b>.<br>'+
        'Higher odds = bigger payout, lower chance.<br><br>'+
        'You pick a fighter and bet on it.','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();

    // Step 2: pick fighter
    tutShowHint(
        '<div class="tut-step">STEP 2/4</div>'+
        '<b style="color:#f59e0b">Tap a fighter to bet on them!</b><br><br>'+
        'The number after × is the payout multiplier.<br>'+
        'Example: ×5.2 means bet 1.00 → win 5.20','top');
    var fBtns=document.getElementById('fighter-btns');
    await new Promise(function(resolve){
        var buttons=fBtns.querySelectorAll('button');
        var h=function(){for(var i=0;i<buttons.length;i++)buttons[i].removeEventListener('click',h);resolve();};
        for(var i=0;i<buttons.length;i++)buttons[i].addEventListener('click',h);
    });
    document.getElementById('tut-text').style.display='none';
    await sleep(500);
    if(!TUT.active)return;

    // Step 3: explain what happens next, then start race
    tutShow(
        '<div class="tut-step">STEP 3/4</div>'+
        'Bet placed! Now watch the race.<br><br>'+
        'All 6 fighters drop water automatically.<br>'+
        'First to carve a channel <b style="color:#f59e0b">wins</b>!<br><br>'+
        '<span style="color:#888;font-size:11px">tap to start the race</span>','middle');
    await tutWaitTap(3000);
    if(!TUT.active)return;
    tutHide();

    // Seed RNG and start game
    _tutOrigRandom=Math.random;
    Math.random=_tutRng(TUT_BET_SEED);
    startGame(); // triggers betRound automatically

    // wait for race to finish
    await sleep(2000); // let it start
    var maxWait=60;
    while(animating && maxWait>0){await sleep(1000);maxWait--;}
    await sleep(3000); // let user see the result
    if(!TUT.active){Math.random=_tutOrigRandom;_tutOrigRandom=null;return;}

    // Step 4: explain result
    tutShow(
        '🎉 <b style="color:#f59e0b">RACE OVER!</b><br><br>'+
        'The winner carved a channel first.<br>'+
        'If you bet on the winner — you get<br>'+
        'your bet × the odds!<br><br>'+
        'That\'s Bet&Wet — virtual water racing!','top');
    await tutWaitTap(4000);
    TUT.active=false;tutHide();
    Math.random=_tutOrigRandom;_tutOrigRandom=null;
    CFG.bets={};
    backToLobby();
}

function startTutorial(){
    sndPlay('click');
    if(CFG.mode==='solo') tutErosion();
    else if(CFG.mode==='pvp') tutSoiron();
    else if(CFG.mode==='bet') tutBetwet();
}
