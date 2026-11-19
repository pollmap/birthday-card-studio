(()=>{'use strict';
const $=id=>document.getElementById(id);
const card=$('card'),stage=$('stage'),world=$('world'),btn=$('play'),label=btn.querySelector('span'),canvas=$('fx'),ctx=canvas.getContext('2d'),stampEl=$('stamp'),ticker=$('ticker'),gauge=$('gauge'),fill=$('gaugeFill'),num=$('gaugeNum'),notice=$('notice');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const buddies=[...stage.querySelectorAll('.buddy')];
const B=Object.fromEntries(buddies.map(b=>[b.dataset.kind,b]));
buddies.forEach(b=>{b.querySelector('.squash').innerHTML=window.Buddies.svg(b.dataset.kind)});

const LINES=['할 수 있다!','발표 찢었다!','준비한 만큼 나와요!','떨지 마요~','목소리 쩌렁쩌렁!','쭉쭉 가자~!','청중 다 넘어온다!','재연님 최고!','질문도 다 받아친다!','PPT 장인 재연님!','무조건 된다!','심호흡 한 번~','이미 잘하고 있어요','재연님 믿어요!','박수 준비 완료!'];
const TICKS=['발표 할 수 있다!','준비한 만큼 나와요!','발표 찢자!','쭉쭉 가자!','재연님 최고!','박수 갈채 예약!'];
const IDLE=['쉿… 발표자 등장!','응원 준비 완료!','버튼 눌러 주세요!'];
const COLORS=['#ff6b5e','#ffd45c','#7fd3c3','#ff8fa3','#8ec5ff','#c3a6f0','#ffb86b'];

let timers=[],ambient=0,idleLoop=0,raf=0,last=0,particles=[],w=0,h=0,busy=false,opened=false,gaugeV=0,mega=0,sound=false,audio=null,lastLine='',ti=0,hinted=false;
const later=(fn,ms)=>{const id=setTimeout(fn,ms);timers.push(id);return id};
const pick=a=>{let s;do{s=a[Math.random()*a.length|0]}while(a.length>1&&s===lastLine);return lastLine=s};
const restart=(el,cls)=>{el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls)};
const scene=n=>{stage.dataset.scene=n};
const faces=(f,list=buddies)=>list.forEach(b=>{b.dataset.face=f});
const notify=t=>{notice.textContent=t};

function resize(){const r=stage.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0)}

function say(b,text,ms=2000){const el=b.querySelector('.bubble');el.textContent=text;el.style.setProperty('--life',ms+'ms');restart(el,'show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),ms)}
function jump(b,spin=false){b.classList.remove('jump','spin');void b.offsetWidth;b.classList.add('jump');if(spin)b.classList.add('spin');clearTimeout(b._j);b._j=setTimeout(()=>b.classList.remove('jump','spin'),720)}
function stamp(html){stampEl.innerHTML=`<b>${html}</b>`;stampEl.className='stamp';void stampEl.offsetWidth;stampEl.classList.add('show')}
function hideStamp(now){if(now){stampEl.className='stamp';return}if(stampEl.classList.contains('show'))stampEl.className='stamp out'}
function shake(){if(!reduce.matches)restart(world,'shake')}
function setGauge(v){gaugeV=Math.max(0,Math.min(100,v));fill.style.width=gaugeV+'%';num.textContent=Math.round(gaugeV)+'%';gauge.setAttribute('aria-valuenow',String(Math.round(gaugeV)));gauge.classList.toggle('full',gaugeV>=100);restart(gauge,'bump')}
function centerOf(el){const a=el.getBoundingClientRect(),s=stage.getBoundingClientRect();return[a.left-s.left+a.width/2,a.top-s.top+a.height/2]}

/* ---------- particles ---------- */
function add(p){particles.push(p);if(particles.length>700)particles.splice(0,particles.length-700)}
function confetti(x,y,n=60,power=1,spread=2.4,dir=-Math.PI/2){if(reduce.matches)return;for(let i=0;i<n;i++){const a=dir+(Math.random()-.5)*spread,sp=(150+Math.random()*330)*power,r=Math.random();add({k:r<.1?'heart':r<.2?'star':r<.6?'rect':'dot',x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0,life:2+Math.random()*1.3,s:4+Math.random()*4.5,a:Math.random()*6,va:(Math.random()-.5)*12,c:COLORS[i%COLORS.length],g:520,drag:.985})}go()}
function cannons(){confetti(0,h,70,1.25,.7,-Math.PI/3.2);confetti(w,h,70,1.25,.7,-Math.PI+Math.PI/3.2)}
function firework(x=w*(.15+Math.random()*.7),y=h*(.12+Math.random()*.3)){if(reduce.matches||document.hidden)return;const c1=COLORS[Math.random()*COLORS.length|0],c2=COLORS[Math.random()*COLORS.length|0],n=44;for(let i=0;i<n;i++){const a=Math.PI*2*i/n,sp=70+Math.random()*120;add({k:'spark',x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-20,t:0,life:1.1+Math.random()*.6,s:2.2+Math.random()*1.8,a,va:0,c:i%2?c1:c2,g:70,drag:.955})}for(let i=0;i<6;i++){const a=Math.random()*7,sp=40+Math.random()*50;add({k:'star',x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0,life:1.4,s:6,a,va:4,c:'#ffd45c',g:40,drag:.97})}add({k:'flash',x,y,vx:0,vy:0,t:0,life:.35,s:46,a:0,va:0,c:'#fff7d6',g:0,drag:1});go()}
function go(){if(!raf){last=performance.now();raf=requestAnimationFrame(draw)}}
function star(s){ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?s*.45:s,a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill()}
function heart(s){ctx.beginPath();ctx.moveTo(0,s*.35);ctx.bezierCurveTo(-s*1.2,-s*.4,-s*.4,-s*1.1,0,-s*.35);ctx.bezierCurveTo(s*.4,-s*1.1,s*1.2,-s*.4,0,s*.35);ctx.fill()}
function draw(now){const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,w,h);particles=particles.filter(p=>p.t<p.life);
  for(const p of particles){p.t+=dt;const f=Math.pow(p.drag,dt*60);p.vx*=f;p.vy=p.vy*f+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.va*dt;
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=Math.max(0,Math.min(1,(p.life-p.t)*2.2));ctx.fillStyle=p.c;
    if(p.k==='rect'){ctx.rotate(p.a);ctx.scale(1,Math.cos(p.t*9+p.s));ctx.fillRect(-p.s/2,-p.s*.9,p.s,p.s*1.8)}
    else if(p.k==='dot'){ctx.beginPath();ctx.arc(0,0,p.s*.55,0,7);ctx.fill()}
    else if(p.k==='heart'){ctx.rotate(Math.sin(p.a)*.4);heart(p.s*1.2)}
    else if(p.k==='star'){ctx.rotate(p.a);star(p.s)}
    else if(p.k==='spark'){ctx.beginPath();ctx.arc(0,0,p.s*(1-p.t/p.life*.6),0,7);ctx.fill()}
    else if(p.k==='flash'){const r=p.s*(.4+p.t/p.life);ctx.globalAlpha=1-p.t/p.life;const g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,'#fffbe8');g.addColorStop(1,'#fff7d600');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill()}
    ctx.restore()}
  if(particles.length)raf=requestAnimationFrame(draw);else{raf=0;ctx.clearRect(0,0,w,h)}}

/* ---------- sound (off by default) ---------- */
const ac=()=>sound&&audio&&audio.state==='running'?audio:null;
function tone(fq,at,dur,type='sine',vol=.06,slide){const a=ac();if(!a)return;const t=a.currentTime+at,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(fq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur*.8);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.05)}
function clap(at){const a=ac();if(!a)return;const t=a.currentTime+at,len=a.sampleRate*.12|0,buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,4);const s=a.createBufferSource(),bp=a.createBiquadFilter(),g=a.createGain();s.buffer=buf;bp.type='bandpass';bp.frequency.value=1400;bp.Q.value=.8;g.gain.value=.3;s.connect(bp).connect(g).connect(a.destination);s.start(t)}
const SFX={
  pop:i=>tone(520+i*110,0,.14,'sine',.08,1000+i*140),
  run:()=>{for(let i=0;i<9;i++)tone(280+(i%2)*70,i*.17,.06,'triangle',.04)},
  hey:()=>[659,784,988].forEach((f,i)=>tone(f,i*.07,.18,'triangle',.055)),
  fanfare:()=>{[[392,0],[392,.14],[392,.28]].forEach(([f,t])=>tone(f,t,.11,'square',.03));[523,659,784].forEach(f=>tone(f,.42,.7,'triangle',.05));[.42,.57,.72,.87].forEach(clap)},
  jingle:()=>{[784,880,988,1175,988,1175,1568].forEach((f,i)=>tone(f,i*.11,.22,'square',.022));[0,.22,.44,.66,.88].forEach(clap)},
  boom:()=>tone(170,0,.4,'sine',.09,55)
};
const sfx=(n,...a)=>{if(ac())SFX[n](...a)};

/* ---------- show ---------- */
function clean(){timers.forEach(clearTimeout);timers=[];clearInterval(ambient);clearInterval(idleLoop);ambient=idleLoop=0;particles=[];cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,w,h);buddies.forEach(b=>{b.classList.remove('jump','spin');b.querySelector('.bubble').classList.remove('show')});hideStamp(true)}

function play(){
  if(busy)return;clean();busy=true;opened=true;btn.disabled=true;label.textContent='응원단 출동 중…';card.dataset.phase='playing';stage.classList.remove('deco-on');setGauge(0);faces('calm');notify('');
  if(reduce.matches){stage.classList.add('deco-on');setGauge(100);finish();return}
  scene('enter');sfx('run');
  later(()=>{scene('ready');faces('happy');say(B.mallang,'재연님!!',1500);sfx('hey')},1750);
  later(()=>{scene('shout');faces('fire');stamp('발표 찢자!');setGauge(40)},2750);
  later(()=>{shake();const[x,y]=centerOf(stampEl);confetti(x,y,120,1.1,6.3);sfx('fanfare');sfx('boom')},3000);
  later(()=>{scene('cheer');faces('happy');hideStamp();say(B.chick,'떨지 마요~ 할 수 있어!',1700);setGauge(70);sfx('pop',0)},4350);
  later(()=>{say(B.frog,'준비한 만큼 나와요!',1700);sfx('pop',2)},4950);
  later(()=>{say(B.mallang,'발표 찢었다!',1700);sfx('pop',1)},5550);
  later(()=>{scene('finale');faces('fire');stage.classList.add('deco-on');setGauge(100);sfx('jingle');cannons()},6250);
  later(()=>faces('happy'),7000);
  [6750,7200,7650,8100].forEach(t=>later(()=>{firework();sfx('boom')},t));
  later(finish,8800);
}
function finish(){
  busy=false;btn.disabled=false;label.textContent=btn.dataset.again;card.dataset.phase='done';scene('done');faces('calm');stage.classList.add('deco-on');
  later(()=>{setGauge(0);notify(hinted?'':'캐릭터를 톡톡 눌러서 파이팅 게이지를 채워 주세요!');hinted=true},1100);
  startAmbient();
}
function startAmbient(){clearInterval(ambient);if(reduce.matches||document.hidden)return;let n=0;
  ambient=setInterval(()=>{if(busy)return;n++;const b=buddies[Math.random()*3|0];b.dataset.face='happy';say(b,pick(LINES),2100);if(n%2)jump(b);setTimeout(()=>{if(!busy&&!b.classList.contains('jump'))b.dataset.face='calm'},2000);if(n%2===0)firework()},2600)}
function startIdle(){clearInterval(idleLoop);let k=0;const t=()=>{if(!opened&&!document.hidden)say(B.mallang,IDLE[k++%IDLE.length],2600)};later(t,700);idleLoop=setInterval(t,3800)}

function react(b){b.dataset.face=Math.random()<.35?'fire':'happy';jump(b,b===B.mallang&&Math.random()<.3);say(b,pick(LINES),1800);sfx('pop',buddies.indexOf(b));clearTimeout(b._f);b._f=setTimeout(()=>{if(!busy)b.dataset.face='calm'},1500)}
function addGauge(v){setGauge(gaugeV+v);if(gaugeV>=100){busy=true;later(megaCheer,300)}}
function megaCheer(){
  busy=true;btn.disabled=true;mega++;notify('');scene('mega');faces('fire');stamp('재연님<br>발표 대성공!!');sfx('fanfare');
  later(()=>{shake();const[x,y]=centerOf(stampEl);confetti(x,y,140,1.2,6.3);cannons();sfx('boom')},250);
  [[B.chick,'기립 박수!!'],[B.frog,'앵콜 앵콜!'],[B.mallang,'재연님 짱!!']].forEach(([b,t],i)=>later(()=>say(b,t,1700),450+i*420));
  for(let i=0;i<5;i++)later(()=>{firework();sfx('boom')},500+i*380);
  later(()=>faces('happy'),1900);
  later(()=>{hideStamp();busy=false;btn.disabled=false;scene('done');faces('calm');setGauge(0);notify(`파이팅 충전 ${mega}번 완료! 계속 톡톡~`)},3900);
}

/* ---------- input ---------- */
btn.addEventListener('click',play);
stage.addEventListener('pointerdown',e=>{
  const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,b=e.target.closest('.buddy');
  confetti(x,y,b?34:24,.65,6.3);
  if(busy)return;
  if(!opened){say(B.mallang,b===B.mallang?'아직이에요~ 버튼!':'버튼을 눌러 주세요!',1800);return}
  if(b){react(b);addGauge(10)}else addGauge(5);
});
$('sound').addEventListener('click',async()=>{try{audio??=new(window.AudioContext||window.webkitAudioContext)();sound=!sound;if(sound){await audio.resume();sfx('hey')}else await audio.suspend();$('sound').textContent=sound?'소리 끄기':'소리 켜기';$('sound').setAttribute('aria-pressed',String(sound))}catch{notify('이 브라우저에서는 소리를 재생할 수 없어요.')}});
$('share').addEventListener('click',async()=>{const url=document.querySelector('link[rel=canonical]').href;try{await navigator.clipboard.writeText(url);notify('링크를 복사했어요! 재연님께 보내 주세요.')}catch{notify('주소창의 링크를 복사해 주세요.')}});

setInterval(()=>{if(document.hidden)return;ti=(ti+1)%TICKS.length;ticker.textContent=TICKS[ti];if(!reduce.matches)restart(ticker,'flip')},2300);
document.addEventListener('visibilitychange',()=>{stage.classList.toggle('paused',document.hidden);if(document.hidden){clearInterval(ambient);particles=[];if(busy&&!stage.dataset.scene.startsWith('mega')){clean();finish();clearInterval(ambient)}audio?.suspend()}else{if(opened&&!busy)startAmbient();if(sound)audio?.resume().catch(()=>{})}});
reduce.addEventListener?.('change',()=>{if(reduce.matches){clearInterval(ambient);particles=[];if(busy){clean();finish()}}else if(opened)startAmbient()});
window.addEventListener('resize',resize,{passive:true});
if(window.ResizeObserver)new ResizeObserver(resize).observe(stage);
window.addEventListener('pagehide',()=>{clearInterval(ambient);clean()});
resize();scene('idle');startIdle();
})();
