// beach.js — NOISORE tropical beach scene (Canvas2D)
(function(){
var canvas,ctx,W,H,frame=0;
var clouds=[],crabs=[],waves=[];

function init(){
    canvas=document.createElement('canvas');
    canvas.id='beach-canvas';
    canvas.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    document.body.insertBefore(canvas,document.body.firstChild);
    resize();
    window.addEventListener('resize',resize);
    for(var i=0;i<5;i++) clouds.push({
        x:Math.random()*W, y:H*0.05+Math.random()*H*0.15,
        w:60+Math.random()*120, h:20+Math.random()*30,
        speed:0.15+Math.random()*0.3, opacity:0.3+Math.random()*0.4
    });
    crabs.push({x:W*0.1,y:0,dir:1,speed:0.3+Math.random()*0.2,phase:0,size:12});
    crabs.push({x:W*0.7,y:0,dir:-1,speed:0.2+Math.random()*0.2,phase:Math.PI,size:10});
    crabs.push({x:W*0.4,y:0,dir:1,speed:0.15,phase:Math.PI/2,size:8});
    for(var j=0;j<6;j++) waves.push({
        y:0, amp:2+Math.random()*3, freq:0.01+Math.random()*0.005,
        speed:0.5+Math.random()*0.5, phase:Math.random()*Math.PI*2,
        alpha:0.15+Math.random()*0.2
    });
    loop();
}

function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;ctx=canvas.getContext('2d');}

function drawSky(){
    var g=ctx.createLinearGradient(0,0,0,H*0.55);
    g.addColorStop(0,'#0b1a33');g.addColorStop(0.25,'#0f3060');
    g.addColorStop(0.5,'#1a6b8a');g.addColorStop(0.75,'#2d9e9e');g.addColorStop(1,'#5ecfb0');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H*0.58);
}

function drawSun(){
    var sx=W*0.8,sy=H*0.12,r=30;
    var g=ctx.createRadialGradient(sx,sy,0,sx,sy,r*3);
    g.addColorStop(0,'rgba(255,220,100,0.6)');g.addColorStop(0.3,'rgba(255,180,60,0.2)');g.addColorStop(1,'rgba(255,180,60,0)');
    ctx.fillStyle=g;ctx.fillRect(sx-r*3,sy-r*3,r*6,r*6);
    ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fillStyle='#ffe082';ctx.fill();
    ctx.beginPath();ctx.arc(sx,sy,r*0.85,0,Math.PI*2);ctx.fillStyle='#fff3c4';ctx.fill();
}

function drawCloud(c){
    ctx.globalAlpha=c.opacity;ctx.fillStyle='#c8dde8';
    ctx.beginPath();ctx.ellipse(c.x,c.y,c.w*0.5,c.h*0.5,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(c.x-c.w*0.25,c.y+c.h*0.1,c.w*0.35,c.h*0.4,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(c.x+c.w*0.3,c.y+c.h*0.05,c.w*0.3,c.h*0.35,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(c.x+c.w*0.1,c.y-c.h*0.2,c.w*0.25,c.h*0.3,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
}

function drawOcean(){
    var g=ctx.createLinearGradient(0,H*0.5,0,H*0.62);
    g.addColorStop(0,'#1a7a8a');g.addColorStop(0.5,'#2da89a');g.addColorStop(1,'#4ec6a0');
    ctx.fillStyle=g;ctx.fillRect(0,H*0.5,W,H*0.12);
}

function drawWaves(t){
    var shoreY=H*0.6;
    for(var i=0;i<waves.length;i++){
        var w=waves[i],waveY=shoreY-8+i*3;
        ctx.beginPath();ctx.moveTo(0,waveY);
        for(var x=0;x<=W;x+=4){ctx.lineTo(x,waveY+Math.sin(x*w.freq+t*w.speed+w.phase)*w.amp);}
        ctx.lineTo(W,waveY+10);ctx.lineTo(0,waveY+10);ctx.closePath();
        ctx.fillStyle='rgba(255,255,255,'+w.alpha+')';ctx.fill();
    }
    ctx.beginPath();ctx.moveTo(0,shoreY);
    for(var fx=0;fx<=W;fx+=3){ctx.lineTo(fx,shoreY+Math.sin(fx*0.02+t*0.8)*2+Math.sin(fx*0.05+t*1.2)*1);}
    ctx.lineTo(W,shoreY+4);ctx.lineTo(0,shoreY+4);ctx.closePath();
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fill();
}

function drawSand(){
    var sandTop=H*0.6;
    var g=ctx.createLinearGradient(0,sandTop,0,H);
    g.addColorStop(0,'#d4c49a');g.addColorStop(0.3,'#c2b280');g.addColorStop(0.7,'#a89060');g.addColorStop(1,'#7a6840');
    ctx.fillStyle=g;ctx.fillRect(0,sandTop,W,H-sandTop);
    ctx.fillStyle='rgba(0,0,0,0.03)';
    for(var i=0;i<80;i++){var sx=((i*137+43)%W),sy=sandTop+((i*97+17)%(H-sandTop));
        ctx.beginPath();ctx.arc(sx,sy,1+((i*13)%3),0,Math.PI*2);ctx.fill();}
}

function drawPalmTree(px,py,lean,scale){
    var s=scale||1;ctx.save();ctx.translate(px,py);ctx.scale(s,s);
    var trunkH=120,lx=lean*40;
    // trunk shadow
    ctx.beginPath();ctx.moveTo(3,2);
    ctx.bezierCurveTo(5,-trunkH*0.3,lx*0.5+3,-trunkH*0.6,lx+3,-trunkH+2);
    ctx.lineWidth=12;ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.stroke();
    // trunk
    ctx.beginPath();ctx.moveTo(0,0);
    ctx.bezierCurveTo(2,-trunkH*0.3,lx*0.5,-trunkH*0.6,lx,-trunkH);
    ctx.lineWidth=10;ctx.strokeStyle='#5a3a1a';ctx.stroke();
    // trunk highlight
    ctx.beginPath();ctx.moveTo(-2,-5);
    ctx.bezierCurveTo(0,-trunkH*0.3,lx*0.5-2,-trunkH*0.6,lx-2,-trunkH);
    ctx.lineWidth=3;ctx.strokeStyle='#7a5a3a';ctx.stroke();
    // trunk rings
    for(var i=1;i<8;i++){var t=i/8,tx=lx*t*t*t,ty=-trunkH*t;
        ctx.beginPath();ctx.moveTo(tx-5,ty);ctx.lineTo(tx+5,ty);
        ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.stroke();}
    // coconuts
    var topX=lx,topY=-trunkH;ctx.fillStyle='#3a2810';
    for(var c=0;c<3;c++){ctx.beginPath();ctx.arc(topX+[-4,3,0][c],topY+[2,3,-1][c],3.5,0,Math.PI*2);ctx.fill();}
    // leaves
    for(var j=0;j<7;j++){drawPalmLeaf(topX,topY-5,-Math.PI+j*(Math.PI*2/7)+Math.sin(frame*0.02+j)*0.06,50+((j*13)%10));}
    ctx.restore();
}

function drawPalmLeaf(ox,oy,angle,len){
    ctx.save();ctx.translate(ox,oy);ctx.rotate(angle);
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(len*0.5,-8,len,5);
    ctx.lineWidth=2;ctx.strokeStyle='#2a6e2a';ctx.stroke();
    for(var i=0;i<12;i++){var t=0.1+i*0.075,sx=len*t,sy=-8*t*(1-t)*4+5*t*t,ll=12-i*0.5;
        ctx.fillStyle=i<6?'#3a8a3a':'#2d7a2d';
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+ll*0.5,sy-ll*0.8,sx+ll,sy-ll*0.3);
        ctx.quadraticCurveTo(sx+ll*0.5,sy-ll*0.1,sx,sy);ctx.fill();
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+ll*0.5,sy+ll*0.8,sx+ll,sy+ll*0.3);
        ctx.quadraticCurveTo(sx+ll*0.5,sy+ll*0.1,sx,sy);ctx.fill();}
    ctx.restore();
}

function drawCrab(cx,cy,size,phase,t){
    var bobY=Math.sin(t*3+phase)*1.5,legP=t*5+phase;
    ctx.save();ctx.translate(cx,cy+bobY);var s=size/12;ctx.scale(s,s);
    // shadow
    ctx.beginPath();ctx.ellipse(2,10,12,4,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,0.1)';ctx.fill();
    // legs
    ctx.strokeStyle='#c0392b';ctx.lineWidth=2;
    for(var i=0;i<3;i++){var la=Math.sin(legP+i*1.2)*8;
        ctx.beginPath();ctx.moveTo(-6,2+i*3);ctx.lineTo(-14-i*2,6+i*3+la);ctx.stroke();
        ctx.beginPath();ctx.moveTo(6,2+i*3);ctx.lineTo(14+i*2,6+i*3-la);ctx.stroke();}
    // body
    ctx.beginPath();ctx.ellipse(0,4,10,7,0,0,Math.PI*2);ctx.fillStyle='#e74c3c';ctx.fill();
    ctx.strokeStyle='#c0392b';ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.ellipse(-2,2,5,3,0,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fill();
    // claws
    var ca=Math.sin(t*2+phase)*0.3;
    ctx.save();ctx.translate(-10,-2);ctx.rotate(-0.5+ca);
    ctx.beginPath();ctx.ellipse(0,0,8,4,0,0,Math.PI*2);ctx.fillStyle='#e74c3c';ctx.fill();ctx.strokeStyle='#c0392b';ctx.stroke();
    ctx.beginPath();ctx.moveTo(-6,-2);ctx.lineTo(-10,-5);ctx.moveTo(-6,2);ctx.lineTo(-10,5);ctx.lineWidth=2;ctx.strokeStyle='#c0392b';ctx.stroke();
    ctx.restore();
    ctx.save();ctx.translate(10,-2);ctx.rotate(0.5-ca);
    ctx.beginPath();ctx.ellipse(0,0,8,4,0,0,Math.PI*2);ctx.fillStyle='#e74c3c';ctx.fill();ctx.strokeStyle='#c0392b';ctx.stroke();
    ctx.beginPath();ctx.moveTo(6,-2);ctx.lineTo(10,-5);ctx.moveTo(6,2);ctx.lineTo(10,5);ctx.lineWidth=2;ctx.strokeStyle='#c0392b';ctx.stroke();
    ctx.restore();
    // eyes on stalks
    ctx.strokeStyle='#c0392b';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-4,-6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(3,0);ctx.lineTo(4,-6);ctx.stroke();
    ctx.fillStyle='#1a1a1a';
    ctx.beginPath();ctx.arc(-4,-7,2.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(4,-7,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(-3.5,-7.5,1,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(4.5,-7.5,1,0,Math.PI*2);ctx.fill();
    ctx.restore();
}

function drawBirds(t){
    ctx.strokeStyle='rgba(20,20,40,0.3)';ctx.lineWidth=1.5;
    for(var i=0;i<3;i++){var bx=(W*0.3+i*120+t*0.5*(i+1))%W,by=H*0.08+i*15+Math.sin(t*2+i)*5,wing=Math.sin(t*4+i*2)*4;
        ctx.beginPath();ctx.moveTo(bx-8,by+wing);ctx.quadraticCurveTo(bx-3,by-3,bx,by);
        ctx.quadraticCurveTo(bx+3,by-3,bx+8,by+wing);ctx.stroke();}
}

function updateCrabs(t){
    var sandTop=H*0.6;
    for(var i=0;i<crabs.length;i++){var c=crabs[i];c.x+=c.dir*c.speed;c.y=sandTop+15+i*25+Math.sin(t*0.5+c.phase)*5;
        if(c.x>W+30)c.dir=-1;if(c.x<-30)c.dir=1;}
}

function updateClouds(){for(var i=0;i<clouds.length;i++){clouds[i].x+=clouds[i].speed;if(clouds[i].x>W+clouds[i].w)clouds[i].x=-clouds[i].w;}}

function loop(){
    frame++;var t=frame*0.016;ctx.clearRect(0,0,W,H);
    drawSky();drawSun();updateClouds();
    for(var i=0;i<clouds.length;i++)drawCloud(clouds[i]);
    drawBirds(t);drawOcean();drawWaves(t);drawSand();
    drawPalmTree(W*0.06,H*0.62,-0.3,0.9);
    drawPalmTree(W*0.94,H*0.63,0.25,0.85);
    if(W>600){drawPalmTree(W*0.02,H*0.65,0.1,0.5);drawPalmTree(W*0.97,H*0.66,-0.15,0.55);}
    updateCrabs(t);
    for(var j=0;j<crabs.length;j++)drawCrab(crabs[j].x,crabs[j].y,crabs[j].size,crabs[j].phase,t);
    requestAnimationFrame(loop);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
