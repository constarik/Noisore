(function(root){
'use strict';
// @constarik/uvs-sdk v2.0.0 Browser Bundle — UVS v2
// SHA-256
var SHA256_K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function sha256r(x,n){return(x>>>n)|(x<<(32-n));}
function sha256(str){
  var i,j,W=new Array(64),H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var bytes=[];for(i=0;i<str.length;i++){var c=str.charCodeAt(i);if(c<128)bytes.push(c);else if(c<2048){bytes.push(192|(c>>6));bytes.push(128|(c&63));}else{bytes.push(224|(c>>12));bytes.push(128|((c>>6)&63));bytes.push(128|(c&63));}}
  var l=bytes.length*8;bytes.push(0x80);while(bytes.length%64!==56)bytes.push(0);
  bytes.push(0,0,0,0,(l>>>24)&0xff,(l>>>16)&0xff,(l>>>8)&0xff,l&0xff);
  for(var off=0;off<bytes.length;off+=64){
    for(i=0;i<16;i++)W[i]=(bytes[off+i*4]<<24)|(bytes[off+i*4+1]<<16)|(bytes[off+i*4+2]<<8)|bytes[off+i*4+3];
    for(i=16;i<64;i++){var s0=sha256r(W[i-15],7)^sha256r(W[i-15],18)^(W[i-15]>>>3);var s1=sha256r(W[i-2],17)^sha256r(W[i-2],19)^(W[i-2]>>>10);W[i]=(W[i-16]+s0+W[i-7]+s1)|0;}
    var a=H[0],b=H[1],c2=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(i=0;i<64;i++){var S1=sha256r(e,6)^sha256r(e,11)^sha256r(e,25);var ch=(e&f)^((~e)&g);var t1=(h+S1+ch+SHA256_K[i]+W[i])|0;var S0=sha256r(a,2)^sha256r(a,13)^sha256r(a,22);var maj=(a&b)^(a&c2)^(b&c2);var t2=(S0+maj)|0;h=g;g=f;f=e;e=(d+t1)|0;d=c2;c2=b;b=a;a=(t1+t2)|0;}
    H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c2)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;
  }
  var hex='';for(i=0;i<8;i++)for(j=24;j>=0;j-=8)hex+=((H[i]>>>j)&0xff).toString(16).padStart(2,'0');
  return hex;
}
// SHA-512
function sha512(str){
  function i64(h,l){return{h:h|0,l:l|0};}
  function a64(a,b){var lo=(a.l>>>0)+(b.l>>>0);return i64((a.h+b.h+(lo>0xFFFFFFFF?1:0))|0,lo|0);}
  function a65(a,b,c,d,e){return a64(a64(a64(a,b),a64(c,d)),e);}
  function r64(x,n){if(n<32)return i64((x.h>>>n)|(x.l<<(32-n)),(x.l>>>n)|(x.h<<(32-n)));return i64((x.l>>>(n-32))|(x.h<<(64-n)),(x.h>>>(n-32))|(x.l<<(64-n)));}
  function s64(x,n){if(n<32)return i64(x.h>>>n,(x.l>>>n)|(x.h<<(32-n)));return i64(0,x.h>>>(n-32));}
  function x64(a,b){return i64(a.h^b.h,a.l^b.l);}function n64(a,b){return i64(a.h&b.h,a.l&b.l);}function t64(a){return i64(~a.h,~a.l);}
  var K=[i64(0x428a2f98,0xd728ae22),i64(0x71374491,0x23ef65cd),i64(0xb5c0fbcf,0xec4d3b2f),i64(0xe9b5dba5,0x8189dbbc),i64(0x3956c25b,0xf348b538),i64(0x59f111f1,0xb605d019),i64(0x923f82a4,0xaf194f9b),i64(0xab1c5ed5,0xda6d8118),i64(0xd807aa98,0xa3030242),i64(0x12835b01,0x45706fbe),i64(0x243185be,0x4ee4b28c),i64(0x550c7dc3,0xd5ffb4e2),i64(0x72be5d74,0xf27b896f),i64(0x80deb1fe,0x3b1696b1),i64(0x9bdc06a7,0x25c71235),i64(0xc19bf174,0xcf692694),i64(0xe49b69c1,0x9ef14ad2),i64(0xefbe4786,0x384f25e3),i64(0x0fc19dc6,0x8b8cd5b5),i64(0x240ca1cc,0x77ac9c65),i64(0x2de92c6f,0x592b0275),i64(0x4a7484aa,0x6ea6e483),i64(0x5cb0a9dc,0xbd41fbd4),i64(0x76f988da,0x831153b5),i64(0x983e5152,0xee66dfab),i64(0xa831c66d,0x2db43210),i64(0xb00327c8,0x98fb213f),i64(0xbf597fc7,0xbeef0ee4),i64(0xc6e00bf3,0x3da88fc2),i64(0xd5a79147,0x930aa725),i64(0x06ca6351,0xe003826f),i64(0x14292967,0x0a0e6e70),i64(0x27b70a85,0x46d22ffc),i64(0x2e1b2138,0x5c26c926),i64(0x4d2c6dfc,0x5ac42aed),i64(0x53380d13,0x9d95b3df),i64(0x650a7354,0x8baf63de),i64(0x766a0abb,0x3c77b2a8),i64(0x81c2c92e,0x47edaee6),i64(0x92722c85,0x1482353b),i64(0xa2bfe8a1,0x4cf10364),i64(0xa81a664b,0xbc423001),i64(0xc24b8b70,0xd0f89791),i64(0xc76c51a3,0x0654be30),i64(0xd192e819,0xd6ef5218),i64(0xd6990624,0x5565a910),i64(0xf40e3585,0x5771202a),i64(0x106aa070,0x32bbd1b8),i64(0x19a4c116,0xb8d2d0c8),i64(0x1e376c08,0x5141ab53),i64(0x2748774c,0xdf8eeb99),i64(0x34b0bcb5,0xe19b48a8),i64(0x391c0cb3,0xc5c95a63),i64(0x4ed8aa4a,0xe3418acb),i64(0x5b9cca4f,0x7763e373),i64(0x682e6ff3,0xd6b2b8a3),i64(0x748f82ee,0x5defb2fc),i64(0x78a5636f,0x43172f60),i64(0x84c87814,0xa1f0ab72),i64(0x8cc70208,0x1a6439ec),i64(0x90befffa,0x23631e28),i64(0xa4506ceb,0xde82bde9),i64(0xbef9a3f7,0xb2c67915),i64(0xc67178f2,0xe372532b),i64(0xca273ece,0xea26619c),i64(0xd186b8c7,0x21c0c207),i64(0xeada7dd6,0xcde0eb1e),i64(0xf57d4f7f,0xee6ed178),i64(0x06f067aa,0x72176fba),i64(0x0a637dc5,0xa2c898a6),i64(0x113f9804,0xbef90dae),i64(0x1b710b35,0x131c471b),i64(0x28db77f5,0x23047d84),i64(0x32caab7b,0x40c72493),i64(0x3c9ebe0a,0x15c9bebc),i64(0x431d67c4,0x9c100d4c),i64(0x4cc5d4be,0xcb3e42b6),i64(0x597f299c,0xfc657e2a),i64(0x5fcb6fab,0x3ad6faec),i64(0x6c44198c,0x4a475817)];
  var bytes=[];for(var i=0;i<str.length;i++){var cc=str.charCodeAt(i);if(cc<128)bytes.push(cc);else if(cc<2048){bytes.push(192|(cc>>6));bytes.push(128|(cc&63));}else{bytes.push(224|(cc>>12));bytes.push(128|((cc>>6)&63));bytes.push(128|(cc&63));}}
  var bl=bytes.length*8;bytes.push(0x80);while(bytes.length%128!==112)bytes.push(0);
  for(var p=0;p<16;p++)bytes.push(0);bytes[bytes.length-4]=(bl>>>24)&0xff;bytes[bytes.length-3]=(bl>>>16)&0xff;bytes[bytes.length-2]=(bl>>>8)&0xff;bytes[bytes.length-1]=bl&0xff;
  var H=[i64(0x6a09e667,0xf3bcc908),i64(0xbb67ae85,0x84caa73b),i64(0x3c6ef372,0xfe94f82b),i64(0xa54ff53a,0x5f1d36f1),i64(0x510e527f,0xade682d1),i64(0x9b05688c,0x2b3e6c1f),i64(0x1f83d9ab,0xfb41bd6b),i64(0x5be0cd19,0x137e2179)];
  for(var off=0;off<bytes.length;off+=128){
    var W=[];for(i=0;i<16;i++)W[i]=i64((bytes[off+i*8]<<24)|(bytes[off+i*8+1]<<16)|(bytes[off+i*8+2]<<8)|bytes[off+i*8+3],(bytes[off+i*8+4]<<24)|(bytes[off+i*8+5]<<16)|(bytes[off+i*8+6]<<8)|bytes[off+i*8+7]);
    for(i=16;i<80;i++){var s0=x64(x64(r64(W[i-15],1),r64(W[i-15],8)),s64(W[i-15],7));var s1=x64(x64(r64(W[i-2],19),r64(W[i-2],61)),s64(W[i-2],6));W[i]=a64(a64(W[i-16],s0),a64(W[i-7],s1));}
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(i=0;i<80;i++){var S1=x64(x64(r64(e,14),r64(e,18)),r64(e,41));var ch=x64(n64(e,f),n64(t64(e),g));var t1=a65(h,S1,ch,K[i],W[i]);var S0=x64(x64(r64(a,28),r64(a,34)),r64(a,39));var mj=x64(x64(n64(a,b),n64(a,c)),n64(b,c));var t2=a64(S0,mj);h=g;g=f;f=e;e=a64(d,t1);d=c;c=b;b=a;a=a64(t1,t2);}
    H[0]=a64(H[0],a);H[1]=a64(H[1],b);H[2]=a64(H[2],c);H[3]=a64(H[3],d);H[4]=a64(H[4],e);H[5]=a64(H[5],f);H[6]=a64(H[6],g);H[7]=a64(H[7],h);
  }
  var hex='';for(i=0;i<8;i++){hex+=((H[i].h>>>0).toString(16)).padStart(8,'0');hex+=((H[i].l>>>0).toString(16)).padStart(8,'0');}
  return hex;
}
// ChaCha20
function ccr(v,n){return((v<<n)|(v>>>(32-n)))>>>0;}
function ccq(s,a,b,c,d){s[a]=(s[a]+s[b])>>>0;s[d]=ccr(s[d]^s[a],16);s[c]=(s[c]+s[d])>>>0;s[b]=ccr(s[b]^s[c],12);s[a]=(s[a]+s[b])>>>0;s[d]=ccr(s[d]^s[a],8);s[c]=(s[c]+s[d])>>>0;s[b]=ccr(s[b]^s[c],7);}
function ccBlock(key,nonce,ctr){
  var k=new Uint32Array(8),n=new Uint32Array(3),i;
  for(i=0;i<8;i++)k[i]=key[i*4]|(key[i*4+1]<<8)|(key[i*4+2]<<16)|(key[i*4+3]<<24);
  for(i=0;i<3;i++)n[i]=nonce[i*4]|(nonce[i*4+1]<<8)|(nonce[i*4+2]<<16)|(nonce[i*4+3]<<24);
  var s=new Uint32Array([0x61707865,0x3320646e,0x79622d32,0x6b206574,k[0],k[1],k[2],k[3],k[4],k[5],k[6],k[7],ctr>>>0,n[0],n[1],n[2]]);
  var w=new Uint32Array(s);
  for(i=0;i<10;i++){ccq(w,0,4,8,12);ccq(w,1,5,9,13);ccq(w,2,6,10,14);ccq(w,3,7,11,15);ccq(w,0,5,10,15);ccq(w,1,6,11,12);ccq(w,2,7,8,13);ccq(w,3,4,9,14);}
  var out=new Uint32Array(16);for(i=0;i<16;i++)out[i]=(w[i]+s[i])>>>0;return out;
}
function ChaCha20(kb,nb){this._k=kb;this._n=nb;this._c=0;this._b=[];this._t=0;}
ChaCha20.prototype.nextUint32=function(){if(!this._b.length){var bl=ccBlock(this._k,this._n,this._c++);for(var i=0;i<16;i++)this._b.push(bl[i]);}this._t++;return this._b.shift();};
ChaCha20.prototype.nextFloat=function(){return this.nextUint32()/0x100000000;};
ChaCha20.prototype.nextInt=function(mn,mx){return mn+(this.nextUint32()%(mx-mn+1));};
ChaCha20.prototype.nextIndex=function(len){return this.nextUint32()%len;};
ChaCha20.prototype.reset=function(){this._c=0;this._b=[];this._t=0;};
Object.defineProperty(ChaCha20.prototype,'calls',{get:function(){return this._t;}});
function hexToBytes(h){var b=[];for(var i=0;i<h.length;i+=2)b.push(parseInt(h.substr(i,2),16));return b;}
ChaCha20.fromCombinedSeed=function(hs){var b=hexToBytes(hs);return new ChaCha20(b.slice(0,32),b.slice(32,44));};
// Canonical JSON
function canonicalJSON(o){if(o===null||o===undefined)return'null';if(typeof o==='boolean'||typeof o==='number')return JSON.stringify(o);if(typeof o==='string')return JSON.stringify(o);if(Array.isArray(o))return'['+o.map(canonicalJSON).join(',')+']';if(typeof o==='object'){var ks=Object.keys(o).sort();return'{'+ks.map(function(k){return JSON.stringify(k)+':'+canonicalJSON(o[k]);}).join(',')+'}';}throw new Error('unsupported');}
// Seed Protocol
function uvsCommit(ss){return{serverSeed:ss,serverSeedHash:sha256(ss)};}
function uvsDerive(ss,cs,n){return sha512(ss+':'+cs+':'+n);}
function uvsRng(ss,cs,n){return ChaCha20.fromCombinedSeed(uvsDerive(ss,cs,n));}
function uvsVerify(ss,h){return sha256(ss)===h;}
function uvsSessId(h,cs,n){return sha256(h+':'+cs+':'+n);}
function uvsSH(st){return sha256(canonicalJSON(st));}
function uvsNeg(cv,sv){var cs={},ss={};cv.forEach(function(v){cs[v]=1;});sv.forEach(function(v){ss[v]=1;});var r=[];for(var v in cs)if(ss[v])r.push(Number(v));if(!r.length)return{accepted:false};return{accepted:true,negotiated:Math.max.apply(null,r)};}
// Export
root.UVS={sha256:sha256,sha512:sha512,ChaCha20:ChaCha20,hexToBytes:hexToBytes,canonicalJSON:canonicalJSON,commit:uvsCommit,deriveCombinedSeed:uvsDerive,createRng:uvsRng,verify:uvsVerify,sessionId:uvsSessId,stateHash:uvsSH,negotiate:uvsNeg,VERSION:2};
})(typeof window!=='undefined'?window:typeof global!=='undefined'?global:this);
