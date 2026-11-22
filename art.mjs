// Original two-ink trading card illustrations, drawn in the browser at its pixel density.
const NIGHT = '#122d4a';
const SHADE = '#385c76';
const PAPER = '#fff3d8';
const ORANGE = '#f66f43';

function path(g, d, fill, stroke, width = 2) {
  const p = new Path2D(d);
  if (fill) { g.fillStyle = fill; g.fill(p); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(p); }
}
function rect(g, x, y, w, h, color) { g.fillStyle = color; g.fillRect(x, y, w, h); }
function circle(g, x, y, r, color, line, width = 1) {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  if (color) { g.fillStyle = color; g.fill(); }
  if (line) { g.strokeStyle = line; g.lineWidth = width; g.stroke(); }
}
function lines(g, points, color, width = 2) {
  path(g, points, null, color, width);
}
function sky(g, color, x = 300, y = 78) {
  rect(g, 0, 0, 420, 236, color);
  circle(g, x, y, 48, '#ffe0a5');
  g.save(); g.globalAlpha = 0.28;
  for (let j = 0; j < 15; j++) {
    const yy = 16 + j * 4;
    for (let i = 0; i < 28; i++) circle(g, 8 + i * 5 + (j % 2) * 2, yy, 0.77, NIGHT);
  }
  g.restore();
}
function land(g, water = false) {
  path(g, 'M0 154 L52 142 95 148 158 123 194 135 243 119 289 136 351 110 420 129 420 236 0 236Z', '#7694a0');
  path(g, 'M0 181 L80 158 128 166 189 149 235 165 286 143 329 160 420 139 420 236 0 236Z', SHADE);
  path(g, 'M0 194 L70 181 128 187 217 172 314 182 420 160 420 236 0 236Z', NIGHT);
  if (water) {
    rect(g, 0, 173, 420, 63, '#44828c');
    for (let i = 0; i < 28; i++) {
      const x = (i * 47) % 400, y = 180 + (i * 17) % 55;
      rect(g, x, y, 8 + (i % 7) * 4, 1, i % 3 ? '#90b3ac' : NIGHT);
    }
  }
}
function air(g, c) {
  sky(g, c, 312, 78);
  path(g, 'M0 203 Q65 178 96 184 Q126 165 151 176 Q172 164 201 171 Q225 154 250 167 Q283 157 315 167 Q357 149 420 154 L420 236 0 236Z', '#93b7ce');
  path(g, 'M0 217 Q55 201 89 204 Q131 184 180 196 Q221 179 251 188 Q306 171 352 183 Q390 169 420 173 L420 236 0 236Z', '#789eb9');
  for (let i = 0; i < 4; i++) lines(g, 'M-10 '+(174+i*12)+' L182 '+(127+i*8), i % 2 ? '#dce7df' : PAPER, i === 0 ? 3 : 1.5);
  g.save(); g.translate(208, 130); g.rotate(-0.23); g.translate(-208, -130);
  path(g, 'M182 125 L115 54 133 53 239 119 251 131Z', '#7799b0', NIGHT, 2.8);
  path(g, 'M120 59 L133 60 207 112 197 114Z', PAPER);
  path(g, 'M110 131 L67 84 77 80 141 127Z', NIGHT);
  path(g, 'M77 84 L87 90 112 117 102 115Z', ORANGE);
  path(g, 'M101 135 L126 125 Q164 121 210 119 L288 116 Q308 108 331 114 Q349 118 366 127 Q374 134 358 138 Q335 144 303 146 L167 149 Q124 149 99 140Z', PAPER, NIGHT, 2.8);
  path(g, 'M103 139 Q171 143 231 137 L319 132 Q345 129 365 128 L367 133 Q338 146 299 146 L151 148Z', NIGHT);
  path(g, 'M141 137 L300 127 291 131 139 143Z', ORANGE);
  path(g, 'M196 139 L244 135 157 197 137 198Z', '#819fb3', NIGHT, 3);
  path(g, 'M209 141 L234 138 155 191 144 193Z', PAPER);
  path(g, 'M109 134 L72 149 65 148 91 131Z', '#7393a6', NIGHT, 2);
  path(g, 'M280 119 L301 115 316 115 319 120 283 123Z', NIGHT);
  for (let i = 0; i < 14; i++) {
    const x = 145 + i * 9, y = 128 - i * 0.42;
    rect(g, x, y, 3.8, 3, NIGHT);
  }
  path(g, 'M202 160 Q211 153 225 153 L230 157 225 163 202 166Z', NIGHT);
  path(g, 'M175 175 Q184 169 195 169 L199 174 193 178 174 181Z', NIGHT);
  g.restore();
}
function oil(g, c) {
  sky(g,c); land(g);
  path(g,'M42 182 L111 157 165 164 243 138 332 145 420 125 420 169 0 213Z','#b58266');
  rect(g,75,188,222,8,NIGHT);
  path(g,'M151 185 L195 73 224 185 M161 177 L210 137 179 122 203 99 M191 92 L215 179 170 146 205 119',null,NIGHT,6);
  path(g,'M120 83 L235 46 283 47 295 59 213 73 126 99Z',NIGHT);
  path(g,'M111 79 Q128 77 142 84 L138 111 Q125 126 111 128 L101 118Z',NIGHT);
  lines(g,'M110 125 L110 186 M115 125 L115 186',NIGHT,2);
  circle(g,240,149,24,NIGHT); circle(g,240,149,14,'#b58266'); circle(g,240,149,6,NIGHT);
  lines(g,'M242 146 L274 58',NIGHT,5);
  rect(g,230,170,47,15,NIGHT); rect(g,87,178,42,9,NIGHT);
}
function ship(g,c) {
  sky(g,c); land(g,true);
  path(g,'M44 149 L119 152 138 143 292 137 351 129 328 162 309 171 79 171Z',NIGHT);
  path(g,'M68 161 L333 151 324 163 305 171 80 171Z',ORANGE);
  rect(g,96,106,45,43,PAPER); rect(g,88,105,57,7,NIGHT); rect(g,104,94,12,11,NIGHT);
  for(let i=0;i<5;i++) rect(g,99+i*8,118,5,5,NIGHT);
  for(let row=0;row<2;row++) for(let col=0;col<5-row;col++) {
    const x=151+col*32,y=130-row*17;
    rect(g,x,y,30,16,[SHADE,ORANGE,'#e1bb76',NIGHT][(col+row)%4]);
    for(let k=0;k<4;k++) rect(g,x+4+k*6,y+2,1,12,'#e3ccac');
  }
  lines(g,'M144 103 L144 86 M141 91 L158 91',NIGHT,2);
}
function chip(g,c) {
  sky(g,c,308,71);
  g.save(); g.translate(211,130); g.scale(1,.55); g.rotate(-Math.PI/4);
  for(let i=-60;i<=60;i+=15) {
    const offsets=[0,1,2,3];
    for(const quarter of offsets) {
      g.save();g.rotate(quarter*Math.PI/2);lines(g,'M'+i+' -65 L'+i+' -89 '+(i+12)+' -101 '+(i+12)+' -126',SHADE,2);
      circle(g,i+12,-126,3,NIGHT);rect(g,i-3,-86,6,14,PAPER);g.restore();
    }
  }
  rect(g,-76,-76,152,152,NIGHT);rect(g,-58,-58,116,116,'#736eae');rect(g,-46,-46,92,92,PAPER);rect(g,-36,-36,72,72,NIGHT);
  for(let i=-26;i<=26;i+=13) for(let j=-26;j<=26;j+=13) rect(g,i,j,9,9,(i+j)%3?'#92acbd':ORANGE);
  g.restore();
}
function turbine(g,x,y,s) {
  g.save();g.translate(x,y);g.scale(s,s);
  path(g,'M-3 3 L-6 103 7 103 3 3Z',PAPER,NIGHT,2);
  for(let i=0;i<3;i++){g.save();g.rotate(i*2*Math.PI/3);path(g,'M0 1 L3 -15 0 -65 -2 -63 -5 -12Z',PAPER,NIGHT,1.7);g.restore();}
  circle(g,0,0,5,ORANGE,NIGHT,2);g.restore();
}
function wind(g,c){sky(g,c);land(g,true);turbine(g,75,128,.55);turbine(g,159,99,.78);turbine(g,269,71,1.18);turbine(g,356,129,.53);}
function retail(g,c){
  sky(g,c);land(g);
  rect(g,72,86,273,105,NIGHT);rect(g,80,86,257,98,PAPER);rect(g,69,79,278,9,NIGHT);
  rect(g,94,125,149,49,SHADE);rect(g,254,124,57,60,NIGHT);rect(g,260,130,44,39,'#88a9ac');
  for(let i=0;i<12;i++){const x=69+i*23;path(g,'M'+x+' 97 l23 0 7 25 -24 0Z',i%2?PAPER:ORANGE,NIGHT,1);}
  for(let i=0;i<4;i++){rect(g,98+i*36,132,28,35,'#96b3ad');rect(g,99+i*36,160,24,5,'#bc785b');}
  rect(g,65,185,289,8,NIGHT);
}
function steel(g,c){
  sky(g,c);land(g);
  for(let i=0;i<3;i++){const x=130+i*39;path(g,'M'+x+' 143 l5 -98 14 0 6 98Z',i%2?SHADE:NIGHT);rect(g,x+4,54,16,7,ORANGE);}
  path(g,'M69 151 L112 128 112 145 157 120 157 140 207 111 207 142 248 121 248 141 320 141 320 191 69 191Z',NIGHT);
  for(let i=0;i<10;i++)rect(g,82+22*i,155,13,13,i%3?PAPER:ORANGE);
  for(let j=0;j<3;j++){const x=145+j*38;path(g,'M'+x+' 40 q-8 -13 6 -18 q15 -1 17 -12 q23 -9 35 -4 q-12 11 -26 13 q-4 11 -15 11 q-11 1 -17 10Z','#dcd4c8');}
}
function bank(g,c){
  sky(g,c);land(g);
  path(g,'M65 112 L205 48 350 112Z',NIGHT);path(g,'M95 106 L206 58 318 106Z',PAPER);
  rect(g,76,112,260,11,NIGHT);
  for(let i=0;i<6;i++){const x=92+i*42;rect(g,x,125,16,55,PAPER);rect(g,x+11,125,5,55,SHADE);rect(g,x-3,122,22,7,NIGHT);rect(g,x-3,178,22,5,NIGHT);}
  for(let i=0;i<3;i++)rect(g,79-i*7,183+i*5,253+i*14,6,i%2?SHADE:NIGHT);
  circle(g,206,88,12,ORANGE);
}
function pylon(g,x,y,s){
  g.save();g.translate(x,y);g.scale(s,s);
  lines(g,'M-31 126 L-7 36 0 0 8 36 31 126 M-21 109 L18 82 -12 58 9 39 -7 25 M21 109 L-18 82 12 58 -9 39 7 25 M-33 28 L-7 18 8 18 35 28 -33 28 M-45 48 L-10 34 10 34 45 48 -45 48',NIGHT,3);
  g.restore();
}
function grid(g,c){sky(g,c);land(g);pylon(g,77,101,.67);pylon(g,232,49,1.15);pylon(g,365,117,.54);lines(g,'M0 86 Q40 129 54 121 Q130 148 194 82 Q273 142 345 132 M0 98 Q34 143 49 134 Q132 168 181 104 Q283 162 341 144',NIGHT,1.5);}
function tower(g,c){
  sky(g,c);land(g);
  [[78,109,65,77],[137,54,86,133],[211,83,57,103],[269,120,64,65]].forEach(([x,y,w,h],i)=>{
    rect(g,x,y,w,h,i%2?NIGHT:SHADE);path(g,'M'+(x+w)+' '+y+' l14 9 0 '+(h-9)+' -14 0Z','#7490a2');
    for(let j=0;j<Math.floor((h-12)/12);j++)for(let k=0;k<Math.floor((w-9)/13);k++)rect(g,x+5+k*13,y+6+j*12,8,4,(j+k)%5?'#c1c9be':ORANGE);
  });
}
function health(g,c){
  sky(g,c);land(g);
  rect(g,71,123,270,64,SHADE);rect(g,148,80,115,107,PAPER);rect(g,158,70,95,10,NIGHT);
  rect(g,193,89,25,39,ORANGE);rect(g,186,96,39,25,ORANGE);
  for(let row=0;row<3;row++)for(let i=0;i<10;i++)rect(g,80+i*26,133+row*14,14,6,'#93b9c3');
  rect(g,187,153,39,34,NIGHT);rect(g,69,186,275,6,NIGHT);
}
function signal(g,c){
  sky(g,c);land(g);
  lines(g,'M157 183 L200 70 206 42 211 71 255 183 M171 151 L232 133 185 110 216 92 196 82 M243 155 L182 133 226 112 195 94 214 80 M205 40 L205 25',NIGHT,5);
  circle(g,205,47,8,ORANGE,NIGHT,2);
  for(let i=0;i<3;i++){const q=14+i*12;lines(g,'M'+(205-q)+' '+(46-q)+' Q'+(184-2*q)+' 46 '+(205-q)+' '+(46+q),SHADE,2);lines(g,'M'+(205+q)+' '+(46-q)+' Q'+(226+2*q)+' 46 '+(205+q)+' '+(46+q),SHADE,2);}
}
const DRAW={air,oil,ship,chip,wind,retail,steel,bank,grid,tower,health,signal};
export function paintArt(canvas,company) {
  canvas.width=840;canvas.height=472;
  const g=canvas.getContext('2d');
  if(!g)return;
  g.scale(2,2);g.lineJoin='round';g.lineCap='round';
  DRAW[company.art](g,company.color);
  g.save();g.globalAlpha=.18;
  for(let i=0;i<1500;i++){const x=(i*11939%42007)/100,y=(i*7879%23603)/100;rect(g,x,y,.68,.68,i%2?NIGHT:PAPER);}
  g.restore();
}
