/* 발표 응원단: original pastel cheer-squad characters drawn as layered SVG so every part can move. */
(function(){'use strict';
const INK='#4a3328';
const r1=n=>Math.round(n*10)/10;

function pom(R,fill){
  const n=11,cy=40,arc=r1(R*Math.sin(Math.PI/n));let d='';
  for(let i=0;i<=n;i++){const a=-Math.PI/2+i*2*Math.PI/n,x=r1(R*Math.cos(a)),y=r1(cy+R*Math.sin(a));d+=i?`A${arc} ${arc} 0 0 1 ${x} ${y}`:`M${x} ${y}`}
  let s='';for(let i=0;i<6;i++){const a=i*Math.PI/3+.3;s+=`M${r1(Math.cos(a)*R*.2)} ${r1(cy+Math.sin(a)*R*.2)}L${r1(Math.cos(a)*R*.7)} ${r1(cy+Math.sin(a)*R*.7)}`}
  return `<path d="${d}Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="${s}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2.6" stroke-linecap="round"/>`;
}

function arm(side,x,y,fur,pomFill){
  const base=side==='l'?26:-26;
  return `<g transform="translate(${x} ${y})"><g class="arm arm-${side}"><g transform="rotate(${base})">${pom(19,pomFill)}<ellipse cx="0" cy="17" rx="11.5" ry="19" fill="${fur}" stroke="${INK}" stroke-width="5"/></g></g></g>`;
}

function face(o){
  const L=100-o.dx,R=100+o.dx,ey=o.ey,by=o.by,bx=o.bx??16;
  const eye=x=>`<ellipse cx="${x}" cy="${ey}" rx="6.6" ry="8.2" fill="${INK}"/><circle cx="${x+2.3}" cy="${ey-3.2}" r="2.5" fill="#fff"/>`;
  const happy=x=>`<path d="M${x-8} ${ey+3}Q${x} ${ey-9} ${x+8} ${ey+3}"/>`;
  const fire=(x,s)=>`<path d="M${x-8*s} ${ey-7}L${x+7*s} ${ey}L${x-8*s} ${ey+7}"/>`;
  const blush=x=>`<ellipse cx="${x}" cy="${by}" rx="12.5" ry="7.5" fill="#ffadb8" opacity=".92"/><path d="M${x-6} ${by+3}l3-6M${x-1} ${by+3}l3-6M${x+4} ${by+3}l3-6" stroke="#f07d91" stroke-width="2" stroke-linecap="round"/>`;
  return `<g class="blush">${blush(L-bx)}${blush(R+bx)}</g>`+
    `<g class="eyes eyes-open" style="transform-origin:100px ${ey}px">${eye(L)}${eye(R)}</g>`+
    `<g class="eyes eyes-happy" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round">${happy(L)}${happy(R)}</g>`+
    `<g class="eyes eyes-fire" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${fire(L,1)}${fire(R,-1)}</g>`;
}

function softMouth(my,wide){
  const w=wide?22:12,c=wide?`M${100-w+4} ${my}Q100 ${my+13} ${100+w-4} ${my}`:`M92 ${my}q4 6 8 0q4 6 8 0`;
  const o=`M${100-w} ${my-3}Q100 ${my+(wide?26:20)} ${100+w} ${my-3}Q100 ${my+1} ${100-w} ${my-3}Z`;
  const t=wide?`M90 ${my+8}Q100 ${my+2} 110 ${my+8}Q100 ${my+13} 90 ${my+8}Z`:`M93 ${my+6}Q100 ${my+1} 107 ${my+6}Q100 ${my+9.5} 93 ${my+6}Z`;
  return `<path class="m-calm" d="${c}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`+
    `<g class="m-open"><path d="${o}" fill="#d9566b"/><path d="${t}" fill="#ff9aab"/><path d="${o}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></g>`;
}

function beak(my){
  return `<path class="m-calm" d="M90 ${my}L100 ${my-7}L110 ${my}L100 ${my+7}Z" fill="#ffa24f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`+
    `<g class="m-open" stroke="${INK}" stroke-width="4" stroke-linejoin="round"><path d="M91 ${my-2}L109 ${my-2}L107 ${my+4}L93 ${my+4}Z" fill="#d9566b" stroke-width="3"/><path d="M89 ${my-2}L100 ${my-10}L111 ${my-2}Z" fill="#ffa24f"/><path d="M92 ${my+4}L100 ${my+13}L108 ${my+4}Z" fill="#ffa24f"/></g>`;
}

const KINDS={
  mallang:{
    fur:'#ffe3d2',foot:'#ffe3d2',pom:'#ff8fa3',
    back:`<g class="sprout" style="transform-origin:100px 68px"><path d="M100 70C100 55 101 47 104 38" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M103 43C90 27 72 29 68 39C78 51 94 51 103 43Z" fill="#a8dc9c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M104 39C114 21 134 21 138 29C132 43 116 47 104 39Z" fill="#a8dc9c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M80 40Q90 42 98 42M112 34Q122 30 130 28" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/></g>`+
      `<g class="tails" style="transform-origin:166px 118px" fill="#ff6b5e" stroke="${INK}" stroke-width="4" stroke-linejoin="round"><path d="M164 112C180 100 192 108 198 96L196 120C188 126 178 118 166 122Z"/><path d="M164 120C178 124 186 138 196 134L186 150C176 148 174 134 164 128Z"/></g>`,
    body:`<path d="M100 64C152 64 174 102 174 144C174 188 141 206 100 206C59 206 26 188 26 144C26 102 48 64 100 64Z"/>`,
    belly:`<ellipse cx="100" cy="184" rx="40" ry="15" fill="#fff4ec"/>`,
    front:`<path d="M30 112Q100 84 170 112L172 128Q100 100 28 128Z" fill="#ff6b5e" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path id="hb-curve" d="M30 120Q100 92 170 120" fill="none"/><text font-family="Jua, 'Malgun Gothic', sans-serif" font-size="14.5" fill="#fff" letter-spacing="1"><textPath href="#hb-curve" startOffset="50%" text-anchor="middle" dominant-baseline="central">파이팅</textPath></text>`,
    face:{ey:141,dx:25,by:158},mouth:softMouth(156),shoulders:[[34,156],[166,156]]
  },
  chick:{
    fur:'#ffe68c',foot:'#ffb35c',pom:'#7fd3c3',
    back:`<g class="tuft" style="transform-origin:100px 76px"><path d="M93 78C86 58 95 49 100 61C102 45 116 47 108 78Z" fill="#ffe68c" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/></g>`,
    body:`<path d="M100 72C150 72 172 106 172 146C172 188 140 206 100 206C60 206 28 188 28 146C28 106 50 72 100 72Z"/>`,
    belly:`<ellipse cx="100" cy="184" rx="38" ry="16" fill="#fff4c6"/>`,
    front:`<path d="M58 92q8-6 16-4" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>`,
    face:{ey:138,dx:26,by:155},mouth:beak(152),shoulders:[[36,153],[164,153]]
  },
  frog:{
    fur:'#c9ecc3',foot:'#b3e0ad',pom:'#ffd45c',
    body:`<path d="M42 100C36 74 52 58 70 58C84 58 94 66 96 78Q100 76 104 78C106 66 116 58 130 58C148 58 164 74 158 100C172 114 178 130 178 150C178 190 144 208 100 208C56 208 22 190 22 150C22 130 28 114 42 100Z"/>`,
    belly:`<ellipse cx="100" cy="182" rx="46" ry="20" fill="#e8f8e2"/>`,
    front:`<path d="M54 70q7-5 14-4M118 68q7-4 14-2" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="3.5" stroke-linecap="round"/>`,
    face:{ey:86,dx:31,by:122,bx:6},mouth:softMouth(134,true),shoulders:[[30,152],[170,152]]
  }
};

function svg(kind){
  const k=KINDS[kind];
  return `<svg viewBox="0 0 200 230" aria-hidden="true" focusable="false">`+
    `<g class="feet" fill="${k.foot}" stroke="${INK}" stroke-width="4.5"><ellipse class="foot foot-l" cx="76" cy="206" rx="19" ry="12"/><ellipse class="foot foot-r" cx="124" cy="206" rx="19" ry="12"/></g>`+
    (k.back||'')+
    `<g class="torso" fill="${k.fur}" stroke="${INK}" stroke-width="5" stroke-linejoin="round">${k.body}</g>`+
    (k.belly||'')+(k.front||'')+
    `<g class="face">${face(k.face)}${k.mouth}</g>`+
    arm('l',...k.shoulders[0],k.fur,k.pom)+arm('r',...k.shoulders[1],k.fur,k.pom)+
    `</svg>`;
}

window.Buddies={svg,kinds:Object.keys(KINDS)};
})();
