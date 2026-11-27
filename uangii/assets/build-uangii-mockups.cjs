const fs = require('fs');
const path = require('path');
const deps = 'C:/Users/M7NRC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const { createCanvas, loadImage } = require(deps + '@napi-rs/canvas');
const sharp = require(deps + 'sharp');
const out = __dirname;
const sourceDir = path.join(out, 'uangii-mockup-sources-v1');
const inputs = [
  ['beranda', '6ab967a5-bc44-4a5e-b877-1cb2eea21747'],
  ['investasi', '2436b0a5-a3db-4061-888b-f3b9ad6ee427'],
  ['transaksi', '5a9a6833-a1c4-4948-8b87-42780dd64e50'],
  ['fio-ai', '9a4c1c01-f5e1-46be-ba18-7ae15645cffd'],
];
function round(ctx, x,y,w,h,r) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
function panel(ctx, image, x,y,w,h,r=30) {
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.65)'; ctx.shadowBlur=65; ctx.shadowOffsetY=25;
  round(ctx,x-2,y-2,w+4,h+4,r+2); ctx.fillStyle='#304c51';ctx.fill(); ctx.restore();
  ctx.save();round(ctx,x,y,w,h,r);ctx.clip();ctx.drawImage(image,x,y,w,h);ctx.restore();
}
function phone(ctx, image, x,y,h, angle=0) {
  const sw=h*image.width/image.height, bezel=12, w=sw+bezel*2;
  ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(angle*Math.PI/180);
  ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=70;ctx.shadowOffsetY=35;
  round(ctx,-w/2,-h/2-bezel,w,h+bezel*2,48);ctx.fillStyle='#05090f';ctx.fill();
  ctx.shadowColor='transparent';ctx.strokeStyle='#47616a';ctx.lineWidth=3;ctx.stroke();
  round(ctx,-w/2+5,-h/2-bezel+5,w-10,h+bezel*2-10,43);ctx.strokeStyle='#151f2d';ctx.lineWidth=4;ctx.stroke();
  ctx.save();round(ctx,-sw/2,-h/2,sw,h,35);ctx.clip();ctx.drawImage(image,-sw/2,-h/2,sw,h);ctx.restore();
  ctx.restore();
}
async function save(canvas, name) {
  const png=canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(out,name+'.png'),png);
  await sharp(png).webp({quality:92}).toFile(path.join(out,name+'.webp'));
}
(async()=>{
  fs.mkdirSync(sourceDir,{recursive:true});
  const bgPath=path.join(sourceDir,'emerald-studio-background.png');
  if(!fs.existsSync(bgPath)) fs.copyFileSync('C:/Users/M7NRC/.codex/generated_images/01a168ad-0c47-7f60-8397-95234be68f74/exec-5b9c1334-1660-466b-bc29-edf60369d2d0.png',bgPath);
  const screens=[];
  for(const [name,id] of inputs){
    const dest=path.join(sourceDir,name+'.png');
    if(!fs.existsSync(dest))fs.copyFileSync('C:/Users/M7NRC/AppData/Local/Temp/codex-clipboard-'+id+'.png',dest);
    screens.push(await loadImage(dest));
  }
  const bg=await loadImage(bgPath);
  function base(w,h){const c=createCanvas(w,h);const ctx=c.getContext('2d');ctx.drawImage(bg,0,0,w,h);return [c,ctx];}
  let [hero,hctx]=base(2560,1440);
  phone(hctx,screens[1],555,220,1020,-7);
  phone(hctx,screens[3],1500,220,1020,7);
  phone(hctx,screens[0],991,82,1250);
  await save(hero,'uangii-hero-v1');
  const crops=[ [24,151,543,337], [24,185,543,327], [24,414,543,566], [84,548,482,330] ];
  for(let i=0;i<inputs.length;i++){
    const [canvas,ctx]=base(2000,1500);
    phone(ctx,screens[i],240,125,1240);
    const [x,y,w,h]=crops[i], detail=createCanvas(w,h),dc=detail.getContext('2d');
    dc.drawImage(screens[i],x,y,w,h,0,0,w,h);
    const dw=840,dh=dw*h/w,dy=(1500-dh)/2;
    ctx.save();ctx.strokeStyle='rgba(20,184,166,.32)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(845,750);ctx.lineTo(940,750);ctx.stroke();
    ctx.fillStyle='#14b8a6';ctx.beginPath();ctx.arc(930,750,5,0,Math.PI*2);ctx.fill();ctx.restore();
    panel(ctx,detail,960,dy,dw,dh,32);
    await save(canvas,'uangii-feature-'+inputs[i][0]+'-v1');
  }
  const names=['uangii-hero-v1',...inputs.map(([n])=>'uangii-feature-'+n+'-v1')];
  for(const name of names){const m=await sharp(path.join(out,name+'.png')).metadata();console.log(name,m.width+'x'+m.height);}
})().catch(e=>{console.error(e);process.exit(1)});
