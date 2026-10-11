// Builds an InDesign IDML package (IDML + Links) from the rendered guide pages and downloads it as a zip.
export async function exportIDML(onStep = () => {}, opts = {}) {
const _ap=getComputedStyle(document.querySelector('.app'));const VW=parseFloat(_ap.getPropertyValue('--pgvw'))||1,VH=parseFloat(_ap.getPropertyValue('--pgvh'))||1;
const W=270*VW,H=360*VH,BL=9;
const f=n=>{let s=(+n).toFixed(3).replace(/\.?0+$/,'');return (s===''||s==='-0')?'0':s;};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let uidN=0;const uid=()=>'u'+(++uidN).toString(16);
const colors=new Map();const col=h=>{h=h.toUpperCase();if(!colors.has(h))colors.set(h,[0,2,4].map(i=>parseInt(h.substr(i,2),16)));return 'Color/C'+h;};
const prgb=s=>{const m=s&&s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[,\s/]+/).filter(Boolean).map(Number);return{hex:p.slice(0,3).map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''),a:p.length>3?p[3]:1};};
const links=new Map();const assets=[];
const canvasPNG=c=>new Promise(r=>c.toBlob(r,'image/png'));
const canvasJPG=c=>new Promise(r=>c.toBlob(r,'image/jpeg',.92));
function dpiOf(b){let i=2;while(i<b.length-4&&b[i]===0xFF){const m=b[i+1],len=(b[i+2]<<8)|b[i+3];
 if(m===0xE0&&String.fromCharCode(...b.slice(i+4,i+8))==='JFIF'){const u=b[i+11],x=(b[i+12]<<8)|b[i+13];if(u===1&&x)return x;if(u===2&&x)return x*2.54;}
 if(m===0xE1&&String.fromCharCode(...b.slice(i+4,i+8))==='Exif'){const t=i+10,le=b[t]===0x49;const u16=o=>le?(b[o]|(b[o+1]<<8)):((b[o]<<8)|b[o+1]);const u32=o=>le?((b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0):(((b[o]<<24)|(b[o+1]<<16)|(b[o+2]<<8)|b[o+3])>>>0);
  const ifd=t+u32(t+4),n=u16(ifd);let xr=null,un=2;for(let k=0;k<n;k++){const e=ifd+2+k*12,tag=u16(e);if(tag===0x011A){const o=t+u32(e+8);xr=u32(o)/u32(o+4);}if(tag===0x0128)un=u16(e+8);}if(xr)return un===3?xr*2.54:xr;}
 if(m===0xDA)break;i+=2+len;}return 72;}
const loadImg=u=>new Promise((r,j)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>r(i);i.onerror=j;i.src=u;});
async function photoLink(src,gray){
 let u=src;const rm=src.match(/urban-field-guide\/images\/(\w+)\.jpg/);if(rm)u=new URL('species-images/'+rm[1]+'.jpg',location.href).href;
 const key=u+(gray?'#g':'');if(links.has(key))return links.get(key);
 let base=decodeURIComponent(u.split('/').pop().split('?')[0]);
 const blob=await (await fetch(u)).blob();const im=await loadImg(URL.createObjectURL(blob));
 let L;
 if(gray||/\.webp$/i.test(base)){const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');if(gray)x.filter='grayscale(1)';x.drawImage(im,0,0);
  if(gray){base=base.replace(/\.\w+$/,'')+'-gray.jpg';assets.push(['Links/'+base,await canvasJPG(c)]);L={uri:'Links/'+base,fmt:'$ID/JPEG',w:im.naturalWidth,h:im.naturalHeight,ppi:72};}
  else{base=base.replace(/\.\w+$/,'')+'.png';assets.push(['Links/'+base,await canvasPNG(c)]);L={uri:'Links/'+base,fmt:'$ID/Portable Network Graphics (PNG)',w:im.naturalWidth,h:im.naturalHeight,ppi:72};}}
 else{const bytes=new Uint8Array(await blob.arrayBuffer());const png=/\.png$/i.test(base);const ppi=png?72:dpiOf(bytes);assets.push(['Links/'+base,blob]);
  L={uri:'Links/'+base,fmt:png?'$ID/Portable Network Graphics (PNG)':'$ID/JPEG',w:im.naturalWidth*72/ppi,h:im.naturalHeight*72/ppi,ppi};}
 links.set(key,L);return L;}
let genN=0;
async function genPNG(c,key){if(key&&links.has(key))return links.get(key);const name='Links/gen-'+(++genN)+'.png';assets.push([name,await canvasPNG(c)]);const L={uri:name,fmt:'$ID/Portable Network Graphics (PNG)',w:c.width,h:c.height,ppi:72};if(key)links.set(key,L);return L;}
function splitTop(s){const out=[];let d=0,cur='';for(const ch of s){if(ch==='(')d++;if(ch===')')d--;if(ch===','&&d===0){out.push(cur.trim());cur='';}else cur+=ch;}if(cur.trim())out.push(cur.trim());return out;}
async function gradPNG(bi,wpx,hpx){const m=bi.match(/linear-gradient\((.*)\)$/);if(!m)return null;const parts=splitTop(m[1]);let ang=180;
 if(/deg$/.test(parts[0])){ang=parseFloat(parts.shift());}else if(/^to /.test(parts[0])){const t=parts.shift();ang={'to top':0,'to right':90,'to bottom':180,'to left':270}[t]??180;}
 const stops=parts.map(p=>{const cm=p.match(/rgba?\([^)]+\)/);const pos=p.replace(cm?cm[0]:'','').trim();return{c:cm?cm[0]:p,p:pos?parseFloat(pos)/100:null};});
 stops.forEach((s,i)=>{if(s.p==null)s.p=stops.length>1?i/(stops.length-1):0;});
 const key='g'+bi+Math.round(wpx)+'x'+Math.round(hpx);if(links.has(key))return links.get(key);
 const sc=Math.min(2,1200/Math.max(wpx,hpx));const cw=Math.max(2,Math.round(wpx*sc)),ch=Math.max(2,Math.round(hpx*sc));
 const c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d');const t=ang*Math.PI/180,dx=Math.sin(t),dy=-Math.cos(t),L=Math.abs(cw*dx)+Math.abs(ch*dy);
 const g=x.createLinearGradient(cw/2-dx*L/2,ch/2-dy*L/2,cw/2+dx*L/2,ch/2+dy*L/2);stops.forEach(s=>{try{g.addColorStop(Math.min(1,Math.max(0,s.p)),s.c);}catch(e){}});x.fillStyle=g;x.fillRect(0,0,cw,ch);return genPNG(c,key);}
const iconImgs=new Map();
async function maskPNG(url,color,wpx,hpx){const key='m'+url+color+Math.round(wpx/hpx*100);if(links.has(key))return links.get(key);
 if(!iconImgs.has(url))iconImgs.set(url,await loadImg(url));const im=iconImgs.get(url);const sc=240/Math.max(wpx,hpx);const cw=Math.round(wpx*sc),ch=Math.round(hpx*sc);
 const c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d');const s=Math.min(cw/im.naturalWidth,ch/im.naturalHeight);x.drawImage(im,(cw-im.naturalWidth*s)/2,(ch-im.naturalHeight*s)/2,im.naturalWidth*s,im.naturalHeight*s);
 x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,cw,ch);return genPNG(c,key);}
async function svgPNG(svg,color,wpx,hpx){const cl=svg.cloneNode(true);const sc=240/Math.max(wpx,hpx);cl.setAttribute('width',Math.round(wpx*sc));cl.setAttribute('height',Math.round(hpx*sc));cl.setAttribute('xmlns','http://www.w3.org/2000/svg');cl.setAttribute('color',color);
 const s=new XMLSerializer().serializeToString(cl).replace(/currentColor/g,color);const key='s'+s;if(links.has(key))return links.get(key);
 const im=await loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s));const c=document.createElement('canvas');c.width=Math.round(wpx*sc);c.height=Math.round(hpx*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);return genPNG(c,key);}
const mc=document.createElement('canvas').getContext('2d');const fmCache=new Map();
function fm(cs){const k=cs.fontStyle+cs.fontWeight+cs.fontSize+cs.fontFamily;if(fmCache.has(k))return fmCache.get(k);mc.font=`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;const m=mc.measureText('Hg');const r={a:m.fontBoundingBoxAscent,d:m.fontBoundingBoxDescent};fmCache.set(k,r);return r;}
const WN={100:'Thin',200:'ExtraLight',300:'Light',400:'Regular',500:'Medium',600:'SemiBold',700:'Bold',800:'ExtraBold',900:'Black'};
const fsn=(w,i)=>{w=Math.min(900,Math.max(100,Math.round(w/100)*100));return i?(w===400?'Italic':WN[w]+' Italic'):WN[w];};
const common='ItemLayer="uL" AppliedObjectStyle="ObjectStyle/$ID/[None]" Visible="true" Locked="false"';
const corner=r=>r>0.2?['TopLeft','TopRight','BottomLeft','BottomRight'].map(c=>` ${c}CornerOption="RoundedCorner" ${c}CornerRadius="${f(r)}"`).join(''):'';
const trans=o=>o!=null&&o<0.995?`<TransparencySetting><BlendingSetting BlendMode="Normal" Opacity="${f(o*100)}"/></TransparencySetting>`:'';
const pathXML=(ctx,pts,open)=>`<Properties><PathGeometry><GeometryPathType PathOpen="${open?'true':'false'}"><PathPointArray>${pts.map(([x,y])=>{x=ctx.ox+x;y=y-H/2;return `<PathPointType Anchor="${f(x)} ${f(y)}" LeftDirection="${f(x)} ${f(y)}" RightDirection="${f(x)} ${f(y)}"/>`;}).join('')}</PathPointArray></GeometryPathType></PathGeometry></Properties>`;
const box=(x0,y0,x1,y1)=>[[x0,y0],[x0,y1],[x1,y1],[x1,y0]];
function rect(ctx,b,o){ctx.items.push(`<Rectangle Self="${uid()}" ContentType="Unassigned" ${common} FillColor="${col(o.fill)}" StrokeWeight="0" StrokeColor="Swatch/None" ItemTransform="1 0 0 1 0 0"${corner(o.r)}>${pathXML(ctx,box(...b))}${trans(o.op)}</Rectangle>`);}
function line(ctx,a,b,o){ctx.items.push(`<GraphicLine Self="${uid()}" ${common} StrokeWeight="${f(o.w)}" StrokeColor="${col(o.hex)}" StrokeType="StrokeStyle/$ID/${o.dotted?'Dotted':'Solid'}" FillColor="Swatch/None" ItemTransform="1 0 0 1 0 0">${pathXML(ctx,[a,b],true)}${trans(o.op)}</GraphicLine>`);}
function image(ctx,frameB,drawB,L,o={}){const [x0,y0,x1,y1]=frameB;const [dx0,dy0,dx1,dy1]=drawB;const s=(dx1-dx0)/L.w,sy=(dy1-dy0)/L.h;
 ctx.items.push(`<Rectangle Self="${uid()}" ContentType="GraphicType" ${common} FillColor="Swatch/None" StrokeWeight="0" StrokeColor="Swatch/None" ItemTransform="1 0 0 1 0 0"${corner(o.r)}>${pathXML(ctx,box(x0,y0,x1,y1))}${trans(o.op)}<Image Self="${uid()}" ItemTransform="${f(s)} 0 0 ${f(sy)} ${f(ctx.ox+dx0)} ${f(dy0-H/2)}" ImageTypeName="${esc(L.fmt)}" ActualPpi="${f(L.ppi)} ${f(L.ppi)}" EffectivePpi="${f(L.ppi/s)} ${f(L.ppi/sy)}"><Properties><Profile type="string">$ID/None</Profile><GraphicBounds Left="0" Top="0" Right="${f(L.w)}" Bottom="${f(L.h)}"/></Properties><Link Self="${uid()}" LinkResourceURI="file:${esc(L.uri)}" LinkResourceFormat="${esc(L.fmt)}" StoredState="Normal" LinkClassID="35906" LinkClientID="257" LinkResourceModified="false" LinkObjectModified="false" ShowInUI="true" CanEmbed="true" CanUnembed="true" CanPackage="true" ImportPolicy="NoAutoImport" ExportPolicy="NoAutoExport"/></Image></Rectangle>`);}
const stories=[];

const PSDEF=new Map();const ROLE=(r,ps)=>{if(ps!=='Text')return ps;const serif=/news/i.test(r.font);if(r.caps)return 'Label';if(r.size>=13)return 'Heading';if(serif&&r.i)return 'Subhead Italic';if(serif&&r.size>=9)return 'Subhead';if(r.size<=6.2)return 'Small Text';return 'Body';};
function resolvePS(ps,p){if(/^TOC Entry/.test(ps))return{name:ps,def:null};const r=(p.runs.find(x=>x.t&&/\S/.test(x.t))||p.runs[0]);if(!r||r.ace&&!r.font)return{name:ps,def:null};
 const sig={font:r.font,w:r.w,i:!!r.i,size:+f(r.size),lead:+f(p.lead||r.size*1.2),hex:r.hex,trk:+f(r.trk||0),caps:!!r.caps,just:p.just||'LeftAlign'};
 let base=ROLE(r,ps),name=base;const same=d=>d.font===sig.font&&d.w===sig.w&&d.i===sig.i&&d.size===sig.size&&d.caps===sig.caps&&(ps!=='Text'||(d.lead===sig.lead&&d.hex===sig.hex&&d.trk===sig.trk));
 if(ps!=='Text'){if(!PSDEF.has(name))PSDEF.set(name,sig);return{name,def:PSDEF.get(name)};}
 for(let n=1;;n++){name=n===1?base:base+' '+n;const d=PSDEF.get(name);if(!d){PSDEF.set(name,sig);return{name,def:sig};}if(same(d))return{name,def:d};}}
function csrX(r,def,lead,brk){const d=def||{};let a=' AppliedCharacterStyle="CharacterStyle/$ID/[No character style]"';
 if(+f(r.size)!==d.size)a+=` PointSize="${f(r.size)}"`;if(r.w!==d.w||!!r.i!==d.i)a+=` FontStyle="${fsn(r.w,r.i)}"`;if(r.hex!==d.hex)a+=` FillColor="${col(r.hex)}"`;if(r.tint!=null&&r.tint<99.5)a+=` FillTint="${f(r.tint)}"`;
 if(+f(r.trk||0)!==d.trk)a+=` Tracking="${f(r.trk||0)}"`;if(!!r.caps!==d.caps)a+=` Capitalization="${r.caps?'AllCaps':'Normal'}"`;
 let pr='';if(r.font&&r.font!==d.font)pr+=`<AppliedFont type="string">${esc(r.font)}</AppliedFont>`;if(lead&&+f(lead)!==d.lead)pr+=`<Leading type="unit">${f(lead)}</Leading>`;
 return `<CharacterStyleRange${a}>${pr?`<Properties>${pr}</Properties>`:''}${r.ace?'<Content><?ACE 18?></Content>':`<Content>${esc(r.t)}</Content>`}${brk?'<Br/>':''}</CharacterStyleRange>`;}
function paraX(p,last){const {name,def}=resolvePS(p.ps||'Text',p);const j=p.just||'LeftAlign';
 const rs=p.runs.map((r,ri)=>csrX(r,def,p.lead,!last&&ri===p.runs.length-1)).join('');
 return `<ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/${esc(name)}"${def&&def.just===j?'':` Justification="${j}"`}${p.sb?` SpaceBefore="${f(p.sb)}"`:''}>${rs}</ParagraphStyleRange>`;}
const TOCSN='City Birds Contents';const storyWrap=(sid,body,toc)=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><idPkg:Story xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging" DOMVersion="16.0"><Story Self="${sid}" AppliedTOCStyle="${toc?'TOCStyle/'+TOCSN:'n'}" TrackChanges="false" StoryTitle="$ID/" AppliedNamedGrid="n"><StoryPreference OpticalMarginAlignment="false" OpticalMarginSize="12" FrameType="TextFrameType" StoryOrientation="Horizontal" StoryDirection="LeftToRightDirection"/>${body}</Story></idPkg:Story>`;
function textFrame(ctx,b,para,o){const sid=uid();
 stories.push({id:sid,xml:storyWrap(sid,paraX(para,true))});
 ctx.items.push(`<TextFrame Self="${uid()}" ParentStory="${sid}" PreviousTextFrame="n" NextTextFrame="n" ContentType="TextType" ${common} FillColor="Swatch/None" StrokeWeight="0" StrokeColor="Swatch/None" ItemTransform="1 0 0 1 0 0">${pathXML(ctx,box(...b))}${trans(o.op)}<TextFramePreference TextColumnCount="1" VerticalJustification="TopAlign" FirstBaselineOffset="FixedHeight" MinimumFirstBaselineOffset="${f(o.fbo)}" AutoSizingType="Off"><Properties><InsetSpacing type="list"><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem></InsetSpacing></Properties></TextFramePreference></TextFrame>`);}
const allPgs=[...document.querySelectorAll('.book .media:not(.pg-deleted) > .pg')];const idxs=allPgs.map((p,i)=>i).filter(i=>!opts.only||opts.only.includes(i));const pgs=idxs.map(i=>allPgs[i]);
const TOC={sid:null,paras:[],frames:[]};
function tocFrame(ctx,b,paras,o){if(!TOC.sid){TOC.sid=uid();stories.push(TOC.story={id:TOC.sid,xml:''});}TOC.paras.push(...paras);
 const fid=uid();const prev=TOC.frames.length?TOC.frames[TOC.frames.length-1]:null;const rec={fid,ctx,idx:ctx.items.length,b,o,prev:prev?prev.fid:'n',next:'n'};if(prev)prev.next=fid;TOC.frames.push(rec);ctx.items.push(null);}
function tocFinish(){if(!TOC.sid)return;TOC.story.xml=storyWrap(TOC.sid,TOC.paras.map((p,i)=>paraX(p,i===TOC.paras.length-1)).join(''),true);
 for(const r of TOC.frames){const tmp={...r.ctx,items:[]};const sid0=uid();multiFrame(tmp,r.b,[],r.o);stories.pop();
  r.ctx.items[r.idx]=tmp.items[0].replace(/Self="u[0-9a-f]+" ParentStory="u[0-9a-f]+" PreviousTextFrame="n" NextTextFrame="n"/,`Self="${r.fid}" ParentStory="${TOC.sid}" PreviousTextFrame="${r.prev}" NextTextFrame="${r.next}"`);}}
function multiFrame(ctx,b,paras,o){const sid=uid();
 stories.push({id:sid,xml:storyWrap(sid,paras.map((p,i)=>paraX(p,i===paras.length-1)).join(''))});
 ctx.items.push(`<TextFrame Self="${uid()}" ParentStory="${sid}" PreviousTextFrame="n" NextTextFrame="n" ContentType="TextType" ${common} FillColor="Swatch/None" StrokeWeight="0" StrokeColor="Swatch/None" ItemTransform="1 0 0 1 0 0">${pathXML(ctx,box(...b))}${trans(o.op)}<TextFramePreference TextColumnCount="1" VerticalJustification="TopAlign" FirstBaselineOffset="FixedHeight" MinimumFirstBaselineOffset="${f(o.fbo)}" AutoSizingType="Off"><Properties><InsetSpacing type="list"><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem></InsetSpacing></Properties></TextFramePreference></TextFrame>`);}
const pageCtx=[];
const PSMAP={'el-eyebrow':'Species Eyebrow','el-name':'Species Name','el-sci':'Species Latin','el-id':'Species Body','el-habitat':'Species Body','el-habits':'Species Body','el-season':'Season Tag','el-footer':'Footer Label','el-folio':'Folio'};
const TOCH_S='TOC Heading - Section',TOCH_P='TOC Heading - Page',TOCE_S='TOC Entry - Section',TOCE_P='TOC Entry - Page';
const psNames=new Set(['Text','Page Number',...Object.values(PSMAP),TOCH_S,TOCH_P]);
for(let pi=0;pi<pgs.length;pi++){
 onStep(`Page ${pi+1} / ${pgs.length}`);
 const pg=pgs[pi],P=pg.getBoundingClientRect(),k=W/P.width,z=P.width/(360*VW);
 const oi=idxs[pi];const isRight=opts.facing?((oi+1)%2===1):true;const ctx={n:oi+1,ox:isRight?0:-W,items:[],isRight,species:!!pg.querySelector('.el-name')};pageCtx.push(ctx);
 const X=x=>(x-P.left)*k,Y=y=>(y-P.top)*k;
 const ext=b=>{let [x0,y0,x1,y1]=b;if(x0<=0.6)x0=-BL;if(y0<=0.6)y0=-BL;if(x1>=W-0.6)x1=W+BL;if(y1>=H-0.6)y1=H+BL;return[x0,y0,x1,y1];};
 const opCache=new Map();const opac=el=>{if(!el||el===pg.parentElement)return 1;if(opCache.has(el))return opCache.get(el);const v=(+getComputedStyle(el).opacity)*(el===pg?1:opac(el.parentElement));opCache.set(el,v);return v;};
 const pbg=prgb(getComputedStyle(pg).backgroundColor);if(pbg&&pbg.a>0)rect(ctx,[-BL,-BL,W+BL,H+BL],{fill:pbg.hex,op:pbg.a});
 const media=pg.parentElement;let tocHead=null,tocHeadPS=null;
 if(media.hasAttribute('data-sec')){tocHead=pg.querySelector('h2');tocHeadPS=TOCH_S;}
 else if(media.getAttribute('data-toc')){tocHead=pg.querySelector('h2');if(!tocHead){let best=null,bs=0;pg.querySelectorAll('*').forEach(e=>{if(e.children.length||!e.textContent.trim())return;const fs=parseFloat(getComputedStyle(e).fontSize);if(fs>bs){bs=fs;best=e;}});tocHead=best;}tocHeadPS=TOCH_P;}
 const contentsH=[...pg.querySelectorAll('h2')].find(h=>h.textContent.trim()==='Contents');const tocList=contentsH?contentsH.nextElementSibling:null;
 const els=[...pg.querySelectorAll('*')];const skipSet=new Set();const blocks=new Map();
 if(tocList){const R0=tocList.getBoundingClientRect();tocList.querySelectorAll('*').forEach(e=>skipSet.add(e));skipSet.add(tocList);
  const rows=[...tocList.children].filter(r=>r.getBoundingClientRect().height>0);
  const paras=rows.map(r=>{const spans=[...r.querySelectorAll('span')].filter(e=>e.textContent.trim()&&e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none'&&!e.querySelector('span'));const lab=spans[0],rng=spans[spans.length-1],sub=spans.length>2?spans[1]:null;
   const rr=e=>{const cs=getComputedStyle(e);const c=prgb(cs.color)||{hex:'000000',a:1};const fsz=parseFloat(cs.fontSize);const ls=cs.letterSpacing==='normal'?0:parseFloat(cs.letterSpacing);return{font:cs.fontFamily.split(',')[0].replace(/["']/g,'').trim(),w:+cs.fontWeight||400,i:/italic/.test(cs.fontStyle),size:fsz*z*k,hex:c.hex,tint:c.a*100,trk:fsz?ls/fsz*1000:0,caps:cs.textTransform==='uppercase'};};
   const isSec=!!sub;const runs=[{...rr(lab),t:lab.textContent.trim()},{...rr(rng),t:'\t'+rng.textContent.trim()}];
   if(sub)runs.push({...rr(sub),t:'\u2028'+sub.textContent.trim()});
   return{ps:isSec?TOCE_S:TOCE_P,runs};});
  const R1=rows.length?rows[0].getBoundingClientRect():R0;const m0=fm(getComputedStyle(rows[0]?rows[0].querySelector('span:not(:empty)')||rows[0]:tocList));
  tocFrame(ctx,[X(R0.left),Y(R1.top),X(R0.right)+1,Y(pg.getBoundingClientRect().bottom)-0.34*72],paras,{fbo:m0.a*z*k});}
 const isBlock=d=>d!=='inline'&&d!=='contents';
 for(const el of els){
  if(skipSet.has(el))continue;
  let hid=false;for(let a=el.parentElement;a&&a!==pg;a=a.parentElement){if(skipSet.has(a)){hid=true;break;}}if(hid){skipSet.add(el);continue;}
  const cs=getComputedStyle(el);
  if(cs.display==='none'||cs.visibility==='hidden'||el.closest('.photoctl')){skipSet.add(el);continue;}
  const R=el.getBoundingClientRect();if(R.width<0.5||R.height<0.5)continue;
  const op=opac(el);if(op<0.01){skipSet.add(el);continue;}
  const b=[X(R.left),Y(R.top),X(R.right),Y(R.bottom)];const rad=Math.min(parseFloat(cs.borderTopLeftRadius)||0,R.width/2,R.height/2)*k;
  const bg=prgb(cs.backgroundColor);
  const mask=(cs.webkitMaskImage&&cs.webkitMaskImage!=='none'?cs.webkitMaskImage:(cs.maskImage&&cs.maskImage!=='none'?cs.maskImage:null));
  if(mask){const u=(mask.match(/url\("?([^")]+)"?\)/)||[])[1];if(u&&bg&&bg.a>0){const L=await maskPNG(u,cs.backgroundColor,R.width,R.height);image(ctx,b,b,L,{op});}continue;}
  if(bg&&bg.a>0.005)rect(ctx,ext(b),{fill:bg.hex,op:bg.a*op,r:rad});
  if(cs.backgroundImage&&/linear-gradient/.test(cs.backgroundImage)){const L=await gradPNG(cs.backgroundImage,R.width,R.height);if(L){const eb=ext(b);image(ctx,eb,eb,L,{op,r:rad});}}
  for(const [side,wk,ck,sk] of [['top','borderTopWidth','borderTopColor','borderTopStyle'],['bottom','borderBottomWidth','borderBottomColor','borderBottomStyle'],['left','borderLeftWidth','borderLeftColor','borderLeftStyle'],['right','borderRightWidth','borderRightColor','borderRightStyle']]){
   const w=parseFloat(cs[wk]);const c=prgb(cs[ck]);if(!w||cs[sk]==='none'||!c||c.a<0.01||rad>1)continue;const ww=w*z*k,h2=ww/2;
   const seg=side==='top'?[[b[0],b[1]+h2],[b[2],b[1]+h2]]:side==='bottom'?[[b[0],b[3]-h2],[b[2],b[3]-h2]]:side==='left'?[[b[0]+h2,b[1]],[b[0]+h2,b[3]]]:[[b[2]-h2,b[1]],[b[2]-h2,b[3]]];
   line(ctx,seg[0],seg[1],{w:ww,hex:c.hex,op:c.a*op,dotted:cs[sk]==='dotted'});}
  if(rad>1){const w=parseFloat(cs.borderTopWidth);const c=prgb(cs.borderTopColor);if(w&&c&&c.a>0.01&&cs.borderTopStyle!=='none'){const ww=w*z*k;ctx.items.push(`<Rectangle Self="${uid()}" ContentType="Unassigned" ${common} FillColor="Swatch/None" StrokeWeight="${f(ww)}" StrokeColor="${col(c.hex)}" StrokeAlignment="InsideAlignment" ItemTransform="1 0 0 1 0 0"${corner(rad)}>${pathXML(ctx,box(...b))}${trans(c.a*op)}</Rectangle>`);}}
  if(el.tagName==='IMG'&&el.naturalWidth){const gray=/saturate\(0\)|grayscale\(1\)/.test(cs.filter);const L=await photoLink(el.currentSrc||el.src,gray);
   const fit=cs.objectFit;const s=fit==='contain'?Math.min(R.width/L.w,R.height/L.h):fit==='cover'?Math.max(R.width/L.w,R.height/L.h):null;
   const dw=s==null?R.width:L.w*s,dh=s==null?R.height:L.h*s;
   const opos=cs.objectPosition.split(' ');const pxp=v=>/%$/.test(v)?parseFloat(v)/100:0.5;
   const dx=R.left+(R.width-dw)*pxp(opos[0]),dy=R.top+(R.height-dh)*pxp(opos[1]||'50%');
   let C=pg.getBoundingClientRect(),crad=0;for(let a=el.parentElement;a;a=a.parentElement){const acs=getComputedStyle(a);if(acs.overflow!=='visible'||a===pg){C=a.getBoundingClientRect();if(a!==pg)crad=Math.min(parseFloat(acs.borderTopLeftRadius)||0,C.width/2)*k;break;}}
   let fb=[X(Math.max(R.left,C.left)),Y(Math.max(R.top,C.top)),X(Math.min(R.right,C.right)),Y(Math.min(R.bottom,C.bottom))];
   let db=[X(dx),Y(dy),X(dx+dw),Y(dy+dh)];
   if(fit==='cover'||fit==='fill'){const e=ext(fb);if(e[0]<fb[0]||e[1]<fb[1]||e[2]>fb[2]||e[3]>fb[3]){
     const sx=db[2]-db[0],sy=db[3]-db[1];const need=Math.max((e[2]-e[0])/sx,(e[3]-e[1])/sy,1);
     if(need>1){const cx=(db[0]+db[2])/2,cy=(db[1]+db[3])/2;db=[cx-sx*need/2,cy-sy*need/2,cx+sx*need/2,cy+sy*need/2];}fb=e;}}
   image(ctx,fb,db,L,{op,r:crad});continue;}
  if(el.tagName.toLowerCase()==='svg'){const L=await svgPNG(el,cs.color,R.width,R.height);image(ctx,b,b,L,{op});el.querySelectorAll('*').forEach(c=>skipSet.add(c));continue;}
 }
 const tw=document.createTreeWalker(pg,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let node;
 while((node=tw.nextNode())){
  if(node.nodeType===1&&node.tagName!=='BR')continue;
  if(node.nodeType===3&&!node.textContent.length)continue;
  const par=node.parentElement;if(!par)continue;
  let bad=false;for(let a=par;a&&a!==pg.parentElement;a=a.parentElement){if(skipSet.has(a)){bad=true;break;}}if(bad)continue;
  const pcs2=getComputedStyle(par);if(pcs2.visibility==='hidden'||pcs2.display==='none')continue;
  let blk=par;while(blk!==pg&&!isBlock(getComputedStyle(blk).display))blk=blk.parentElement;
  if(!blocks.has(blk))blocks.set(blk,[]);blocks.get(blk).push(node);}
 const pend=[];
 const imgRects=[...pg.querySelectorAll('img')].filter(im=>im.naturalWidth&&getComputedStyle(im).display!=='none').map(im=>im.getBoundingClientRect()).filter(q=>q.width>2&&q.height>2);
 const solidBg=el=>{for(let a=el;a;a=a.parentElement){const c=prgb(getComputedStyle(a).backgroundColor);if(c&&c.a>=0.99)return c.hex;if(a===pg)break;}return 'ffffff';};
 const mix=(fg,bg,a)=>{const p=h=>[0,2,4].map(i=>parseInt(h.substr(i,2),16));const F=p(fg),B=p(bg);return F.map((v,i)=>Math.round(v*a+B[i]*(1-a)).toString(16).padStart(2,'0')).join('');};
 for(const [blk,nodes] of blocks){
  const rects=[];const runs=[];
  for(const n of nodes){if(n.nodeType===1){runs.push({br:1,el:n.parentElement});continue;}
   const r=document.createRange();r.selectNodeContents(n);const cr=[...r.getClientRects()].filter(q=>q.width>0.1);if(!cr.length&&!/\S/.test(n.textContent))continue;rects.push(...cr);
   runs.push({t:n.textContent,el:n.parentElement});}
  if(!rects.length)continue;
  let txt=runs.map(r=>{if(r.br)return{t:'\u2028',el:r.el};const ws=getComputedStyle(r.el).whiteSpace;return{t:/pre/.test(ws)?r.t:r.t.replace(/\s+/g,' '),el:r.el};});
  for(let i=0;i<txt.length;i++){if(i===0||/[ \u2028]$/.test(txt[i-1].t))txt[i].t=txt[i].t.replace(/^ /,'');}
  txt.forEach(r=>{r.t=r.t.replace(/ \u2028/g,'\u2028');});
  if(txt.length)txt[txt.length-1].t=txt[txt.length-1].t.replace(/ $/,'');
  txt=txt.filter(r=>r.t);if(!txt.some(r=>/\S/.test(r.t)))continue;
  const bcs=getComputedStyle(blk);const op=opac(blk);
  const out=txt.map(r=>{const cs=getComputedStyle(r.el);const c=prgb(cs.color)||{hex:'000000',a:1};const fsz=parseFloat(cs.fontSize);const ls=cs.letterSpacing==='normal'?0:parseFloat(cs.letterSpacing);
   return{t:r.t,font:cs.fontFamily.split(',')[0].replace(/["']/g,'').trim(),w:+cs.fontWeight||400,i:/italic|oblique/.test(cs.fontStyle),size:fsz*z*k,hex:c.hex,a:c.a,tint:100,trk:fsz?ls/fsz*1000:0,caps:cs.textTransform==='uppercase',cs};});
  // accurate colour: flatten translucent text onto the solid colour behind it; keep true transparency only over photos
  const tr=rects.reduce((u,q)=>({l:Math.min(u.l,q.left),t:Math.min(u.t,q.top),r:Math.max(u.r,q.right),b:Math.max(u.b,q.bottom)}),{l:1e9,t:1e9,r:-1e9,b:-1e9});
  const overPhoto=imgRects.some(q=>q.left<tr.r&&q.right>tr.l&&q.top<tr.b&&q.bottom>tr.t);
  let fop=1;
  if(!overPhoto){const bgH=solidBg(blk);out.forEach(r=>{const a=r.a*opac(r.el);if(a<0.999){r.hex=mix(r.hex,bgH,a);}r.a=1;r.tint=100;});}
  else{out.forEach(r=>{r.a=r.a*opac(r.el);});const al=[...new Set(out.map(r=>r.a.toFixed(3)))];if(al.length===1){fop=out[0].a;}else{const mx=Math.max(...out.map(r=>r.a));fop=mx;out.forEach(r=>{if(r.a<mx-0.001)r.hex=mix(r.hex,solidBg(r.el),r.a/mx);});}out.forEach(r=>{r.tint=100;});}
  const first=out.find(r=>/\S/.test(r.t))||out[0];const m=fm(first.cs);
  const lead=(bcs.lineHeight==='normal'?(m.a+m.d):parseFloat(bcs.lineHeight))*z*k;
  const bot=Math.max(...rects.map(q=>q.bottom)),lft=Math.min(...rects.map(q=>q.left)),rgt=Math.max(...rects.map(q=>q.right));
  const lineTops=[...new Set(rects.map(q=>Math.round(q.top/2)))];const single=lineTops.length===1&&!txt.some(r=>r.t.includes('\u2028'));
  const ta=bcs.textAlign;const just=/center/.test(ta)?'CenterAlign':(/right|end/.test(ta)?'RightAlign':'LeftAlign');
  let x0,x1;
  if(single){x0=X(lft);x1=X(rgt);const slack=Math.max(6,(x1-x0)*.2);if(just==='CenterAlign'){x0-=slack/2;x1+=slack/2;}else if(just==='RightAlign')x0-=slack;else x1+=slack;}
  else{const BR=blk.getBoundingClientRect();const pl=parseFloat(bcs.paddingLeft)+parseFloat(bcs.borderLeftWidth),pr=parseFloat(bcs.paddingRight)+parseFloat(bcs.borderRightWidth);x0=X(BR.left+pl*z);x1=X(BR.right-pr*z)+1;}
  const cls=[...blk.classList].find(c=>PSMAP[c]);const isTH=tocHead&&(blk===tocHead||blk.contains(tocHead)||tocHead.contains(blk));
  const r0=out.find(r=>/\S/.test(r.t))||out[0];
  pend.push({x0,x1,top:Y(rects[0].top),bot:Y(bot),lead,asc:m.a*z*k,desc:m.d*z*k,single,just,fop,ps:isTH?tocHeadPS:(cls?PSMAP[cls]:(blk.parentElement&&blk.parentElement.matches('.el-id,.el-habitat,.el-habits')?'Species Label':(blk.closest('.el-diet')?'Diet Label':'Text'))),special:!!isTH,f0:r0.font,s0:r0.size,i0:!!r0.i,c0:!!r0.caps,lx:X(lft),runs:out});}
  // group consecutive same-style blocks into one frame
  const groups=[];for(const d of pend){const g=groups[groups.length-1];const p=g&&g[g.length-1];
   const sim=(a,b)=>{if(a.f0!==b.f0||a.i0!==b.i0)return false;const ratio=Math.max(a.s0,b.s0)/Math.min(a.s0,b.s0);if(a.c0===b.c0)return ratio<=1.35;const cap=a.c0?a:b;return cap.s0<=7.5&&ratio<=1.6;};
   if(p&&!d.special&&!p.special&&sim(d,p)&&d.just===p.just&&Math.abs(d.fop-p.fop)<0.01&&Math.abs(d.lx-p.lx)<1.5&&d.top>=p.bot-0.5&&d.top-p.bot<3*d.lead)g.push(d);else groups.push([d]);}
  for(const g of groups){const d0=g[0];
   if(g.length===1){textFrame(ctx,[d0.x0,d0.top,d0.x1,d0.bot+d0.lead],{ps:d0.ps,just:d0.just,lead:d0.lead,runs:d0.runs},{op:d0.fop,fbo:d0.asc});continue;}
   const multi=g.filter(d=>!d.single);const x0=Math.min(...g.map(d=>d.x0)),x1=multi.length?Math.max(...multi.map(d=>d.x1)):Math.max(...g.map(d=>d.x1));
   const paras=g.map((d,i)=>{const sb=i?Math.max(0,(d.top+d.asc)-(g[i-1].bot-g[i-1].desc)-d.lead):0;return{ps:d.ps,just:d.just,lead:d.lead,sb,runs:d.runs};});
   multiFrame(ctx,[x0,d0.top,x1,g[g.length-1].bot+d0.lead],paras,{fbo:d0.asc,op:d0.fop});}
 const acs=getComputedStyle(pg,'::after');
 if(acs.content&&acs.content!=='none'&&acs.content!=='normal'&&acs.display!=='none'&&acs.visibility!=='hidden'){
  const c=prgb(acs.color)||{hex:'9A937F',a:1};const fsz=parseFloat(acs.fontSize);const m=fm(acs);const bottom=parseFloat(acs.bottom)*z*k;const hgt=(m.a+m.d)*z*k;
  const y1=H-bottom;ctx.folio={b:[W/2-20,y1-hgt,W/2+20,y1+2],o:{fbo:m.a*z*k},para:{ps:'Page Number',just:'CenterAlign',lead:hgt,runs:[{ace:1,font:acs.fontFamily.split(',')[0].replace(/["']/g,'').trim(),w:+acs.fontWeight||600,i:false,size:fsz*z*k,hex:(c.a*(+acs.opacity||1))<0.999?mix(c.hex,solidBg(pg),c.a*(+acs.opacity||1)):c.hex,tint:100,trk:(parseFloat(acs.letterSpacing)/fsz*1000)||0,caps:false}]}};ctx.folio.key=ctx.folio.para.runs[0].hex;if(pg.classList.contains('pg-dark')){const al=c.a*(+acs.opacity||1);ctx.folio.para.runs[0].hex=c.hex;ctx.folio.o.op=al;ctx.folio.key='dark';}}
 await new Promise(r=>setTimeout(r,0));
}
tocFinish();
onStep('Packaging…');
const PK='xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging" DOMVersion="16.0"';const XH='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const files=[];const spreads=opts.facing?(()=>{const out=[];for(let i=0;i<pageCtx.length;i++){const c=pageCtx[i],nx=pageCtx[i+1];if(!c.isRight&&nx&&nx.isRight&&nx.n===c.n+1){out.push([c,nx]);i++;}else out.push([c]);}return out;})():pageCtx.map(c=>[c]);
const FOL=(()=>{let n=0;for(const p of allPgs){const m=p.parentElement;if((m.classList.contains('solo')&&!m.classList.contains('solo-off'))||m.classList.contains('nofolio'))n++;else break;}return n;})();const folio=n=>n<=FOL?n:n-FOL;
const _acs=getComputedStyle(document.querySelector('.app'));const _v=n=>parseFloat(_acs.getPropertyValue(n))*72||12.96;const MARG={species:{t:_v('--m-top'),b:_v('--m-bottom'),l:_v('--m-in'),r:_v('--m-out')},text:{t:_v('--m-toptext'),b:_v('--mt-bottom'),l:_v('--mt-left'),r:_v('--mt-right')}};
const masters=[];const mKey=new Map();
for(const c of pageCtx){if(!c.folio){c.master='n';continue;}const kind=c.species?'species':'text';const key=(c.folio.key==='dark'?'text':kind)+'|'+c.folio.key;
 if(!mKey.has(key)){const dark=c.folio.key==='dark';
  const L=String.fromCharCode(65+masters.length);const base=dark?'Dark':(kind==='species'?'Species':'Text');const m={id:'ms'+(masters.length+1),prefix:L,base,M:MARG[kind],folio:c.folio};masters.push(m);mKey.set(key,m);}
 c.master=mKey.get(key).id;}
const masterXML=m=>{const two=!!opts.facing;const pgs=two?[{ox:-W,left:true},{ox:0,left:false}]:[{ox:0,left:false}];
 const items=[];const pages=pgs.map((p,i)=>{const ctx={ox:p.ox,items};textFrame(ctx,m.folio.b,m.folio.para,m.folio.o);const M=m.M;
  return `<Page Self="${m.id}p${i}" Name="${m.prefix}" AppliedMaster="n" OverrideList="" TabOrder="" GridStartingPoint="TopOutside" UseMasterGrid="true" MasterPageTransform="1 0 0 1 0 0" GeometricBounds="0 0 ${H} ${W}" ItemTransform="1 0 0 1 ${p.ox} ${-H/2}"><MarginPreference ColumnCount="1" ColumnGutter="12" Top="${M.t}" Bottom="${M.b}" Left="${p.left?M.r:M.l}" Right="${p.left?M.l:M.r}" ColumnDirection="Horizontal"/></Page>`;}).join('');
 return `${XH}<idPkg:MasterSpread ${PK}><MasterSpread Self="${m.id}" Name="${m.prefix}-${m.base}" NamePrefix="${m.prefix}" BaseName="${m.base}" ShowMasterItems="true" PageCount="${pgs.length}" OverriddenPageItemProps="" PrimaryTextFrame="n" ItemTransform="1 0 0 1 0 0">${pages}${items.join('')}</MasterSpread></idPkg:MasterSpread>`;};
const masterFiles=masters.map(m=>['MasterSpreads/MasterSpread_'+m.id+'.xml',masterXML(m)]);
const spreadIds=spreads.map((sp,si)=>{const id='sp'+(si+1);const bind=opts.facing?(sp[0].isRight?0:1):0;
 const pages=sp.map(c=>`<Page Self="pg${c.n}" Name="${folio(c.n)}" AppliedMaster="${c.master}" OverrideList="" TabOrder="" GridStartingPoint="TopOutside" UseMasterGrid="true" MasterPageTransform="1 0 0 1 0 0" GeometricBounds="0 0 ${H} ${W}" ItemTransform="1 0 0 1 ${c.ox} ${-H/2}">${(()=>{const M=c.species?MARG.species:MARG.text;const sw=opts.facing&&!c.isRight;return `<MarginPreference ColumnCount="1" ColumnGutter="12" Top="${M.t}" Bottom="${M.b}" Left="${sw?M.r:M.l}" Right="${sw?M.l:M.r}" ColumnDirection="Horizontal"/>`;})()}</Page>`).join('');
 files.push([`Spreads/Spread_${id}.xml`,`${XH}<idPkg:Spread ${PK}><Spread Self="${id}" PageCount="${sp.length}" BindingLocation="${bind}" AllowPageShuffle="false" ShowMasterItems="true" ItemTransform="1 0 0 1 0 0" FlattenerOverride="Default" PageTransitionType="None">${pages}${sp.map(c=>c.items.join('')).join('')}</Spread></idPkg:Spread>`]);return id;});
stories.forEach(s=>files.push([`Stories/Story_${s.id}.xml`,s.xml]));
const colorXML=[...colors].map(([h,[r,g,b]])=>`<Color Self="Color/C${h}" Model="Process" Space="RGB" ColorValue="${r} ${g} ${b}" ColorOverride="Normal" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="#${h}" ColorEditable="true" ColorRemovable="true" Visible="true" SwatchCreatorID="7937"/>`).join('');
files.push(['Resources/Graphic.xml',`${XH}<idPkg:Graphic ${PK}><Color Self="Color/Black" Model="Process" Space="CMYK" ColorValue="0 0 0 100" ColorOverride="Specialblack" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Black" ColorEditable="false" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/><Color Self="Color/Paper" Model="Process" Space="CMYK" ColorValue="0 0 0 0" ColorOverride="Specialpaper" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Paper" ColorEditable="true" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/><Color Self="Color/Registration" Model="Registration" Space="CMYK" ColorValue="100 100 100 100" ColorOverride="Specialregistration" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Registration" ColorEditable="false" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/>${colorXML}<Swatch Self="Swatch/None" Name="None" ColorEditable="false" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/><StrokeStyle Self="StrokeStyle/$ID/Solid" Name="$ID/Solid"/><StrokeStyle Self="StrokeStyle/$ID/Dotted" Name="$ID/Dotted"/></idPkg:Graphic>`]);
files.push(...masterFiles);
files.push(['Resources/Fonts.xml',`${XH}<idPkg:Fonts ${PK}></idPkg:Fonts>`]);
const tabW=W-0.5*72-0.42*72;const tocFmt=(n,w,sz,col)=>`<ParagraphStyle Self="ParagraphStyle/${n}" Name="${n}" Imported="false" NextStyle="ParagraphStyle/${n}" PointSize="${sz}" FontStyle="${w}" FillColor="${col}" SpaceBefore="${n===TOCE_S?4:2.25}" Hyphenation="false"><Properties><BasedOn type="string">$ID/[No paragraph style]</BasedOn><AppliedFont type="string">Hanken Grotesk</AppliedFont><Leading type="unit">9</Leading><TabList type="list"><ListItem type="record"><Alignment type="enumeration">RightAlign</Alignment><AlignmentCharacter type="string">.</AlignmentCharacter><Leader type="string">. </Leader><Position type="unit">${f(tabW)}</Position></ListItem></TabList></Properties></ParagraphStyle>`;
const tocR=n=>{const p=TOC.paras.find(p=>p.ps===n);return p&&p.runs[0];};const tS=tocR(TOCE_S),tP=tocR(TOCE_P);const tocXML=tocFmt(TOCE_S,tS?fsn(tS.w,tS.i):'Bold',tS?f(tS.size):7.6,col(tS?tS.hex:'26241C'))+tocFmt(TOCE_P,tP?fsn(tP.w,tP.i):'Medium',tP?f(tP.size):7.4,col(tP?tP.hex:'3C382E'));
const defXML=[...PSDEF].map(([n,d])=>`<ParagraphStyle Self="ParagraphStyle/${esc(n)}" Name="${esc(n)}" Imported="false" NextStyle="ParagraphStyle/${esc(n)}" PointSize="${f(d.size)}" FontStyle="${fsn(d.w,d.i)}" FillColor="${col(d.hex)}" Tracking="${f(d.trk)}" Capitalization="${d.caps?'AllCaps':'Normal'}" Justification="${d.just}" Hyphenation="false" SpaceBefore="0" SpaceAfter="0" LeftIndent="0" RightIndent="0" FirstLineIndent="0"><Properties><BasedOn type="string">$ID/[No paragraph style]</BasedOn><AppliedFont type="string">${esc(d.font)}</AppliedFont><Leading type="unit">${f(d.lead)}</Leading></Properties></ParagraphStyle>`).join('');
const psXML=tocXML+defXML+[...psNames].filter(n=>!PSDEF.has(n)&&n!==TOCE_S&&n!==TOCE_P).map(n=>`<ParagraphStyle Self="ParagraphStyle/${esc(n)}" Name="${esc(n)}" Imported="false" NextStyle="ParagraphStyle/${esc(n)}" Hyphenation="false"><Properties><BasedOn type="string">$ID/[No paragraph style]</BasedOn></Properties></ParagraphStyle>`).join('');
files.push(['Resources/Styles.xml',`${XH}<idPkg:Styles ${PK}><RootCharacterStyleGroup Self="rcsg"><CharacterStyle Self="CharacterStyle/$ID/[No character style]" Imported="false" Name="$ID/[No character style]"/></RootCharacterStyleGroup><RootParagraphStyleGroup Self="rpsg"><ParagraphStyle Self="ParagraphStyle/$ID/[No paragraph style]" Name="$ID/[No paragraph style]" Imported="false" FillColor="Color/Black" PointSize="12" FontStyle="Regular"><Properties><Leading type="enumeration">Auto</Leading><AppliedFont type="string">Hanken Grotesk</AppliedFont></Properties></ParagraphStyle><ParagraphStyle Self="ParagraphStyle/$ID/NormalParagraphStyle" Name="$ID/NormalParagraphStyle" Imported="false" NextStyle="ParagraphStyle/$ID/NormalParagraphStyle"><Properties><BasedOn type="string">$ID/[No paragraph style]</BasedOn></Properties></ParagraphStyle>${psXML}</RootParagraphStyleGroup><RootCellStyleGroup Self="rcel"><CellStyle Self="CellStyle/$ID/[None]" Name="$ID/[None]"/></RootCellStyleGroup><RootTableStyleGroup Self="rtab"><TableStyle Self="TableStyle/$ID/[No table style]" Name="$ID/[No table style]"/><TableStyle Self="TableStyle/$ID/[Basic Table]" Name="$ID/[Basic Table]"/></RootTableStyleGroup><RootObjectStyleGroup Self="robj"><ObjectStyle Self="ObjectStyle/$ID/[None]" Name="$ID/[None]"/><ObjectStyle Self="ObjectStyle/$ID/[Normal Graphics Frame]" Name="$ID/[Normal Graphics Frame]"/><ObjectStyle Self="ObjectStyle/$ID/[Normal Text Frame]" Name="$ID/[Normal Text Frame]"/><ObjectStyle Self="ObjectStyle/$ID/[Normal Grid]" Name="$ID/[Normal Grid]"/></RootObjectStyleGroup>${(()=>{const ent=(n,fmt,lv)=>`<TOCStyleEntry Self="TOCStyleEntry/${uid()}" Name="${n}" FormatStyle="ParagraphStyle/${fmt}" Level="${lv}" PageNumberPosition="AfterEntry" Separator="^t" SeparatorStyle="CharacterStyle/$ID/[No character style]" PageNumberStyle="CharacterStyle/$ID/[No character style]" SortAlphabetical="false" LevelStyle="CharacterStyle/$ID/[No character style]"/>`;
 return `<TOCStyle Self="TOCStyle/$ID/DefaultTOCStyleName" Name="$ID/DefaultTOCStyleName" Title="Contents" TitleStyle="ParagraphStyle/$ID/[No paragraph style]" RunIn="false" IncludeHidden="false" IncludeBookDocuments="false" CreateBookmarks="true" SetStoryDirection="Horizontal" NumberedParagraphs="IncludeFullParagraph"/><TOCStyle Self="TOCStyle/${TOCSN}" Name="${TOCSN}" Title="" TitleStyle="ParagraphStyle/$ID/[No paragraph style]" RunIn="false" IncludeHidden="false" IncludeBookDocuments="false" CreateBookmarks="true" SetStoryDirection="Horizontal" NumberedParagraphs="IncludeFullParagraph">${ent(TOCH_S,TOCE_S,1)}${ent(TOCH_P,TOCE_P,2)}</TOCStyle>`;})()}</idPkg:Styles>`]);
files.push(['Resources/Preferences.xml',`${XH}<idPkg:Preferences ${PK}><DocumentPreference PageHeight="${H}" PageWidth="${W}" PagesPerDocument="1" FacingPages="${opts.facing?'true':'false'}" DocumentBleedTopOffset="${BL}" DocumentBleedBottomOffset="${BL}" DocumentBleedInsideOrLeftOffset="${BL}" DocumentBleedOutsideOrRightOffset="${BL}" DocumentBleedUniformSize="true" SlugTopOffset="0" SlugBottomOffset="0" SlugInsideOrLeftOffset="0" SlugRightOrOutsideOffset="0" DocumentSlugUniformSize="false" PreserveLayoutWhenShuffling="true" AllowPageShuffle="false" PageBinding="LeftToRight" ColumnDirection="Horizontal" Intent="PrintIntent"/><MarginPreference ColumnCount="1" ColumnGutter="12" Top="12.6" Bottom="18" Left="12.6" Right="12.6" ColumnDirection="Horizontal"/><ViewPreference HorizontalMeasurementUnits="Inches" VerticalMeasurementUnits="Inches" TypographicMeasurementUnits="Points" TextSizeMeasurementUnits="Points" LineMeasurementUnits="Points"/></idPkg:Preferences>`]);
const secXML=(()=>{const a=pageCtx.filter(c=>c.n<=FOL),b=pageCtx.filter(c=>c.n>FOL);let x='';if(a.length)x+=`<Section Self="sec1" Length="${a.length}" Name="" ContinueNumbering="false" IncludeSectionPrefix="false" PageNumberStyle="Arabic" PageStart="pg${a[0].n}" SectionPrefix="" PageNumberStart="${a[0].n}" Marker=""/>`;if(b.length)x+=`<Section Self="sec2" Length="${b.length}" Name="" ContinueNumbering="false" IncludeSectionPrefix="false" PageNumberStyle="Arabic" PageStart="pg${b[0].n}" SectionPrefix="" PageNumberStart="${folio(b[0].n)}" Marker=""/>`;return x;})();
files.unshift(['designmap.xml',`${XH}<?aid style="50" type="document" readerVersion="6.0" featureSet="257" product="16.0(32)" ?><Document ${PK} Self="d" StoryList="${stories.map(s=>s.id).join(' ')}" ZeroPoint="0 0" ActiveLayer="uL" CMYKProfile="U.S. Web Coated (SWOP) v2" RGBProfile="sRGB IEC61966-2.1" SolidColorIntent="UseColorSettings" AfterBlendingIntent="UseColorSettings" DefaultImageIntent="UseColorSettings" RGBPolicy="PreserveEmbeddedProfiles" CMYKPolicy="CombinationOfPreserveAndSafeCmyk" AccurateLABSpots="false"><idPkg:Graphic src="Resources/Graphic.xml"/><idPkg:Fonts src="Resources/Fonts.xml"/><idPkg:Styles src="Resources/Styles.xml"/><idPkg:Preferences src="Resources/Preferences.xml"/><Layer Self="uL" Name="Layer 1" Visible="true" Locked="false" IgnoreWrap="false" ShowGuides="true" LockGuides="false" UI="true" Expendable="true" Printable="true"><Properties><LayerColor type="enumeration">LightBlue</LayerColor></Properties></Layer>${masters.map(m=>`<idPkg:MasterSpread src="MasterSpreads/MasterSpread_${m.id}.xml"/>`).join('')}${spreadIds.map(id=>`<idPkg:Spread src="Spreads/Spread_${id}.xml"/>`).join('')}${secXML}${stories.map(s=>`<idPkg:Story src="Stories/Story_${s.id}.xml"/>`).join('')}</Document>`]);
files.unshift(['META-INF/container.xml',`${XH}<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="designmap.xml" media-type="text/xml"/></rootfiles></container>`]);
files.unshift(['mimetype','application/vnd.adobe.indesign-idml-package']);
const CRC=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let q=0;q<8;q++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CRC[n]=c>>>0;}
const crc=d=>{let c=0xFFFFFFFF;for(let i=0;i<d.length;i++)c=CRC[(c^d[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
const enc=new TextEncoder();
function zip(entries){const parts=[],cent=[];let off=0;for(const [name,d] of entries){const nm=enc.encode(name),c=crc(d);
 const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,10,true);h.setUint16(6,0x0800,true);h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nm.length,true);parts.push(new Uint8Array(h.buffer),nm,d);
 const ce=new DataView(new ArrayBuffer(46));ce.setUint32(0,0x02014b50,true);ce.setUint16(4,20,true);ce.setUint16(6,10,true);ce.setUint16(8,0x0800,true);ce.setUint32(16,c,true);ce.setUint32(20,d.length,true);ce.setUint32(24,d.length,true);ce.setUint16(28,nm.length,true);ce.setUint32(42,off,true);cent.push(new Uint8Array(ce.buffer),nm);off+=30+nm.length+d.length;}
 const cs0=cent.reduce((a,b)=>a+b.length,0);const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,cs0,true);e.setUint32(16,off,true);return new Blob([...parts,...cent,new Uint8Array(e.buffer)]);}
window.__idmlDebug={files:files.map(([n,x])=>[n,x.length]),spread:(files.find(([n])=>/Spread_sp20\.xml/.test(n))||[])[1],story:(files.find(([n])=>/Stories\//.test(n))||[])[1],designmap:files.find(([n])=>n==='designmap.xml')[1].slice(0,3000)};
if(opts.noDownload)return {files,assets:assets.map(a=>a[0])};
if(opts.b64){const enc2=new TextEncoder();const CR=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let q=0;q<8;q++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CR[n]=c>>>0;}
 const cr=d=>{let c=0xFFFFFFFF;for(let i=0;i<d.length;i++)c=CR[(c^d[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
 const defl=async d=>new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
 const parts=[],cent=[];let off=0;for(const [name,str] of files){const nm=enc2.encode(name),raw=enc2.encode(str),c=cr(raw);const store=name==='mimetype';const d=store?raw:await defl(raw);const m=store?0:8;
  const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(8,m,true);h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,raw.length,true);h.setUint16(26,nm.length,true);parts.push(new Uint8Array(h.buffer),nm,d);
  const ce=new DataView(new ArrayBuffer(46));ce.setUint32(0,0x02014b50,true);ce.setUint16(4,20,true);ce.setUint16(6,20,true);ce.setUint16(10,m,true);ce.setUint32(16,c,true);ce.setUint32(20,d.length,true);ce.setUint32(24,raw.length,true);ce.setUint16(28,nm.length,true);ce.setUint32(42,off,true);cent.push(new Uint8Array(ce.buffer),nm);off+=30+nm.length+d.length;}
 const cs0=cent.reduce((a,b)=>a+b.length,0);const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs0,true);e.setUint32(16,off,true);
 const bytes=new Uint8Array(await new Blob([...parts,...cent,new Uint8Array(e.buffer)]).arrayBuffer());let bin='';for(let i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);
 return {b64:btoa(bin),assets:assets.map(a=>a[0])};}
const idml=zip(files.map(([n,s])=>[n,enc.encode(s)]));
const outer=[['City Birds Guide/City Birds Guide.idml',new Uint8Array(await idml.arrayBuffer())]];
for(const [n,b] of assets)outer.push(['City Birds Guide/'+n,new Uint8Array(await b.arrayBuffer())]);
for(const fn of ['Newsreader-opsz-wght-.ttf','Newsreader-Italic-opsz-wght-.ttf','HankenGrotesk-wght-.ttf','HankenGrotesk-Italic-wght-.ttf','OFL-Newsreader.txt','OFL-HankenGrotesk.txt']){try{const r=await fetch(new URL('fonts/'+fn,location.href));if(r.ok)outer.push(['City Birds Guide/Document fonts/'+fn,new Uint8Array(await r.arrayBuffer())]);}catch(e){}}
const pkg=new Blob([zip(outer)],{type:'application/zip'});
const a=document.createElement('a');a.href=URL.createObjectURL(pkg);const d=new Date(),p2=v=>String(v).padStart(2,'0');a.download=`${(opts.name||'City-Birds').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')}-${pageCtx.length}pp-${opts.facing?'facing':'single'}-${d.getFullYear()}${p2(d.getMonth()+1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.zip`;document.body.appendChild(a);a.click();
setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},60000);
return {pages:pageCtx.length,bytes:pkg.size};
}
