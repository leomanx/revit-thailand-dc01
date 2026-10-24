/* Conceptual 3D Campus Masterplan, Duct Bank, Loading Dock, Elevation Datum & Asset Viewer
 * Pure offline 3D perspective & orthographic projection:
 * - Site Masterplan: Main Public Frontage Highway (-0.70m), Project Monument Sign, Perimeter Fence, Sally Port Gatehouse, Ring Roads (-0.60m), Podium (±0.00m SSL)
 * - Grounded Building Massing: L00 Security Lobby under NOC & L00 Loading Dock (2 bays + levelers + canopy) under OFF so L01 (+3.60m..+6.70m) has realistic 2-storey proportions
 * - Illustrative Underground Duct Banks & Manholes (Dual 22kV Power Path A/B & Dual Diverse Carrier Fiber PoP-1/PoP-2)
 * - Separate / Exploded Model Mode (horizontally & vertically separates zones and levels for unobstructed inspection)
 * - Toggleable Labels (Show/Hide all 3D text callouts) & Fullscreen Mode
 */
(function(root){
 'use strict';
 const DETAIL=root.DCDetail||(typeof require==='function'?require('./dc-detail.js'):null);
 const BUILDING=root.DCBuilding||(typeof require==='function'?require('./dc-building.js'):null);
 const STATE={
  yaw:-0.58,pitch:0.52,distance:52,targetX:18.5,targetY:18.0,targetZ:1.8,
  roomInterior:false,selectedBuilding:null,selectedService:null,showServiceDetail:true,isolateService:false,
  viewMode:'iso', // 'iso' | 'top' | 'south' | 'east'
  levelFilter:'ALL', // 'ALL' | '00' | '01' | 'RF'
  showSite:true,showDuctBanks:true,showClearance:true,showRoutes:true,showElevations:true,showLabels:true,
  isolateZone:false,explodeMode:false,isFullscreen:false,
  hoveredId:null,dragging:false,dragMode:'orbit',lastX:0,lastY:0,moved:false,
  canvas:null,stageEl:null,projected:[],onSelect:null
 };

 const COLORS={
  UPS:'#1e7054',Switchboard:'#c58924',Generator:'#9a5b25',
  Chiller:'#237d94',CRAH:'#36949e',Pump:'#3e6996',Rack:'#394b54',
  plinth:'#6c7a73',raisedFloor:'#7e9688',column:'#687870',podium:'#3a4d44',road:'#28332f',highway:'#1e2724',
  zoneHall:'#d4e6cf',zonePower:'#f3e8c8',zoneCooling:'#d2ebf0',zoneSupport:'#e2e8df'
 };

 function getZoneExplodeOffset(zoneId,level,cx,cy){
  if(!STATE.explodeMode)return {dx:0,dy:0,dz:0};
  const centerX=18.0,centerY=16.0;
  const vx=(cx-centerX),vy=(cy-centerY);
  const dx=vx*0.28;
  const dy=vy*0.28;
  const dz=level==='01'?3.4:level==='RF'?6.4:0;
  return {dx,dy,dz};
 }

 function projectPoint(px,py,pz,w,h){
  const dx=px-STATE.targetX,dy=py-STATE.targetY,dz=pz-STATE.targetZ;
  const cy=Math.cos(STATE.yaw),sy=Math.sin(STATE.yaw);
  const cp=Math.cos(STATE.pitch),sp=Math.sin(STATE.pitch);
  const rx=dx*cy-dy*sy;
  const ry=dx*sy+dy*cy;
  const rz=dz;
  const camY=ry*cp-rz*sp;
  const camZ=ry*sp+rz*cp;
  const depth=STATE.distance+camY*0.85;
  const orthographic=['top','south','east'].includes(STATE.viewMode);
  const scale=Math.min(w,h)*0.96/(orthographic?STATE.distance:Math.max(3,depth));
  return {
   x:w*0.5+rx*scale,
   y:h*0.56-camZ*scale,
   depth,scale
  };
 }

 function boxVertices(b,zBaseOverride,hOverride){
  const x0=b.x,x1=b.x+b.w,y0=b.y,y1=b.y+b.d;
  const z0=zBaseOverride!==undefined?zBaseOverride:b.z;
  const z1=z0+(hOverride!==undefined?hOverride:b.h);
  return [
   [x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
   [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]
  ];
 }

 const FACES=[
  {idx:[4,5,6,7],shade:1.10}, // top
  {idx:[1,2,6,5],shade:0.91}, // east
  {idx:[2,3,7,6],shade:0.79}, // south
  {idx:[0,1,5,4],shade:0.85}, // north
  {idx:[0,3,7,4],shade:0.72}  // west
 ];

 function shadeHex(hex,factor){
  const c=(hex||'#2f6652').replace('#','');
  const n=parseInt(c,16);
  const r=Math.min(255,Math.max(0,Math.round(((n>>16)&255)*factor)));
  const g=Math.min(255,Math.max(0,Math.round(((n>>8)&255)*factor)));
  const b=Math.min(255,Math.max(0,Math.round((n&255)*factor)));
  return `rgb(${r},${g},${b})`;
 }

 function pointInPoly(px,py,pts){
  let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
   const xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;
   const intersect=((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/((yj-yi)||1e-7)+xi);
   if(intersect)inside=!inside;
  }
  return inside;
 }

 function getSceneEntities(D,selectedZone,selectedAsset){
  const zones=[],assets=[],subDetails=[],columns=[],baseVolumes=[];
  const zoneOffsetMap={};
  if(STATE.isolateService&&STATE.selectedService)return {zones,assets,subDetails,columns,baseVolumes,zoneOffsetMap};

  for(const zv of (D.scene?.zoneVolumes||[])){
   if(zv.zoneId==='SITE')continue;
   const off=getZoneExplodeOffset(zv.zoneId,zv.level,zv.x+zv.w*0.5,zv.y+zv.d*0.5);
   zoneOffsetMap[zv.zoneId]=off;
   if(STATE.levelFilter!=='ALL'&&zv.level!==STATE.levelFilter)continue;
   if(STATE.isolateZone&&selectedZone&&selectedZone!=='SITE'&&zv.zoneId!==selectedZone)continue;
   const isSel=zv.zoneId===selectedZone;
   const slabH=Math.max(0.02,Number(((zv.ffl??0.15)-(zv.ssl??0)).toFixed(2)));
   zones.push({
    kind:'zone',id:zv.zoneId,objectId:zv.id,label:zv.zoneId+' · '+zv.name,name:zv.name,zoneId:zv.zoneId,
    level:zv.level,egl:zv.egl??-0.80,ssl:zv.ssl+off.dz,ffl:zv.ffl+off.dz,
    rawSsl:zv.ssl,rawFfl:zv.ffl,rawCeilingH:zv.ceilingH,rawSoffit:zv.soffit,
    ceilingH:zv.ceilingH?zv.ceilingH+off.dz:null,soffit:zv.soffit+off.dz,fireRating:zv.fireRating,
    x:zv.x+off.dx,y:zv.y+off.dy,z:zv.ssl+off.dz,
    rawX:zv.x,rawY:zv.y,
    w:zv.w,d:zv.d,h:slabH,roomH:zv.h,
    color:zv.category==='power'?COLORS.zonePower:zv.category==='cooling'?COLORS.zoneCooling:zv.category==='hall'?COLORS.zoneHall:COLORS.zoneSupport,
    stroke:isSel?'#ffcf56':'#6e8c7a',selected:isSel,alpha:isSel?0.92:0.58
   });
   // Grounding structural columns for elevated zones
   if(!STATE.roomInterior&&zv.ssl>0&&(STATE.levelFilter==='ALL'||STATE.levelFilter===zv.level)){
    const colPositions=[
     [zv.x+off.dx+0.3,zv.y+off.dy+0.3],[zv.x+off.dx+zv.w-0.7,zv.y+off.dy+0.3],
     [zv.x+off.dx+zv.w*0.5-0.2,zv.y+off.dy+0.3],[zv.x+off.dx+zv.w*0.5-0.2,zv.y+off.dy+zv.d-0.7],
     [zv.x+off.dx+0.3,zv.y+off.dy+zv.d-0.7],[zv.x+off.dx+zv.w-0.7,zv.y+off.dy+zv.d-0.7]
    ];
    for(const [cx,cy] of colPositions){
     columns.push({
      kind:'column',parentId:zv.zoneId,
      x:cx,y:cy,z:off.dz,w:0.38,d:0.38,h:zv.ssl,
      color:COLORS.column,stroke:'#475950',alpha:isSel?0.72:0.38
     });
    }
   }
  }

  // L00 Grounded Base Volumes under NOC (Security Lobby) and under OFF (Loading Dock & Staging Bay)
  if(!STATE.roomInterior&&(STATE.levelFilter==='ALL'||STATE.levelFilter==='00')){
   for(const bv of (D.scene?.siteMasterplan?.baseVolumes||[])){
    if(STATE.isolateZone&&selectedZone&&selectedZone!=='SITE'&&selectedZone!==bv.parentZone)continue;
    const pOff=STATE.explodeMode?getZoneExplodeOffset(bv.parentZone,'00',bv.x+bv.w*0.5,bv.y+bv.d*0.5):{dx:0,dy:0,dz:0};
    baseVolumes.push({
     ...bv,
     x:bv.x+pOff.dx,y:bv.y+pOff.dy,z:bv.z+pOff.dz,
     selected:selectedZone===bv.parentZone
    });
   }
  }

  for(const a of D.assets){
   const zObj=D.zones.find(z=>z.id===a.zone);
   if(STATE.levelFilter!=='ALL'&&zObj?.level!==STATE.levelFilter)continue;
   if(STATE.isolateZone&&selectedZone&&selectedZone!=='SITE'&&a.zone!==selectedZone)continue;
   const off=zoneOffsetMap[a.zone]||{dx:0,dy:0,dz:0};
   const sp=a.spatial||{x:4,y:4,z:0.15,ssl:0,ffl:0.15,topElev:2.15,plinthH:0.15,w:2,d:1.4,h:2,clearanceFront:1.5,clearanceRear:0.6,clearanceTop:0.8};
   const isSel=a.id===selectedAsset,inZone=a.zone===selectedZone;
   const alpha=STATE.isolateZone||!selectedZone||selectedZone==='SITE'||inZone||isSel?0.97:0.42;
   if(sp.plinthH>0.05){
    subDetails.push({
     kind:'plinth',parentId:a.id,
     x:sp.x+off.dx-0.08,y:sp.y+off.dy-0.08,z:sp.ssl+off.dz,w:sp.w+0.16,d:sp.d+0.16,h:sp.plinthH,
     color:a.zone==='DH1'||a.zone==='DH2'?COLORS.raisedFloor:COLORS.plinth,
     stroke:'#45564e',alpha:alpha*0.88
    });
   }
   assets.push({
    kind:'asset',id:a.id,objectId:a.objectId||('OBJ-'+a.id),tag:a.tag,ifcGuid:a.ifcGuid,
    zoneId:a.zone,type:a.type,system:a.system,
    x:sp.x+off.dx,y:sp.y+off.dy,z:sp.ffl+off.dz,
    ssl:sp.ssl,ffl:sp.ffl,topElev:sp.topElev+off.dz,rawTopElev:sp.topElev,
    ceilingH:sp.ceilingH,soffit:sp.soffit,
    w:sp.w,d:sp.d,h:sp.h,
    clearanceFront:sp.clearanceFront??1.4,clearanceRear:sp.clearanceRear||0.6,clearanceTop:sp.clearanceTop||0.8,
    gridRef:sp.gridRef||'',
    color:COLORS[a.type]||'#2f6652',
    stroke:isSel?'#ffcf56':inZone?'#112b23':'#435e52',
    selected:isSel,inZone,alpha
   });
  }
  return {zones,assets,subDetails,columns,baseVolumes,zoneOffsetMap};
 }

 function drawDuctBanks(ctx,D,W,H){
  if(!STATE.showDuctBanks)return;
  const mp=D.scene?.siteMasterplan;if(!mp?.ductBanks)return;
  if(DETAIL&&STATE.showServiceDetail&&D.scene?.serviceDetail)return;
  ctx.save();
  for(const db of mp.ductBanks){
   const pts=db.points.map(p=>projectPoint(p[0],p[1],p[2],W,H));
   // Concrete-encased trench outer casing glow
   ctx.strokeStyle='rgba(15,35,28,0.85)';
   ctx.lineWidth=6.5;
   ctx.lineCap='round';ctx.lineJoin='round';
   ctx.beginPath();
   pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
   ctx.stroke();

   // Colored duct bank core
   ctx.strokeStyle=db.color;
   ctx.lineWidth=3.4;
   ctx.setLineDash([7,3]);
   ctx.beginPath();
   pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
   ctx.stroke();
   ctx.setLineDash([]);

   if(STATE.showLabels&&pts[2]){
    const lp=pts[2];
    const txt=`${db.id} (${db.centerlineElev.toFixed(2)}m)`;
    ctx.font='700 8px ui-monospace,Consolas,monospace';
    const tw=ctx.measureText(txt).width+8;
    ctx.fillStyle='rgba(12,28,23,0.92)';
    ctx.strokeStyle=db.color;
    ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(lp.x-tw/2,lp.y-8,tw,14,3);ctx.fill();ctx.stroke();
    ctx.fillStyle=db.color;
    ctx.textAlign='center';
    ctx.fillText(txt,lp.x,lp.y+2);
   }
  }

  // Draw Underground Concrete Manholes / Draw Pits (MH)
  for(const mh of (mp.manholes||[])){
   const mv=boxVertices({x:mh.x-0.65,y:mh.y-0.65,z:mh.z-0.15,w:1.3,d:1.3,h:0.45}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    ctx.fillStyle=shadeHex('#243830',f.shade);
    ctx.strokeStyle=mh.color;
    ctx.lineWidth=1.2;
    ctx.beginPath();
    f.idx.map(i=>mv[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();
   }
   if(STATE.showLabels){
    const mpPt=projectPoint(mh.x,mh.y,mh.z+0.35,W,H);
    ctx.fillStyle=mh.color;
    ctx.font='700 7.5px ui-monospace,Consolas,monospace';
    ctx.textAlign='center';
    ctx.fillText(mh.id,mpPt.x,mpPt.y);
   }
  }
  ctx.restore();
 }

 function drawSiteMasterplan(ctx,D,W,H){
  if(!STATE.showSite||STATE.isolateZone)return;
  const mp=D.scene?.siteMasterplan;if(!mp)return;
  ctx.save();

  // 1. Property Boundary & EGL (-0.80m) Earth / Turf Pad
  const pb=mp.propertyBoundary;
  if(pb){
   const eglVerts=[
    [pb.x,pb.y,pb.egl],[pb.x+pb.w,pb.y,pb.egl],[pb.x+pb.w,pb.y+pb.d,pb.egl],[pb.x,pb.y+pb.d,pb.egl]
   ].map(p=>projectPoint(p[0],p[1],p[2],W,H));
   ctx.fillStyle='rgba(22,48,39,0.74)';
   ctx.strokeStyle='#699c78';
   ctx.lineWidth=1.4;
   ctx.setLineDash([6,4]);
   ctx.beginPath();
   eglVerts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
   ctx.closePath();
   ctx.fill();ctx.stroke();
   ctx.setLineDash([]);

   // Perimeter security fence posts & top rail (+2.40m above EGL)
   const fTop=[
    [pb.x,pb.y,pb.egl+pb.fenceHeight],[pb.x+pb.w,pb.y,pb.egl+pb.fenceHeight],
    [pb.x+pb.w,pb.y+pb.d,pb.egl+pb.fenceHeight],[pb.x,pb.y+pb.d,pb.egl+pb.fenceHeight]
   ].map(p=>projectPoint(p[0],p[1],p[2],W,H));
   ctx.strokeStyle='rgba(140,185,155,0.30)';
   ctx.lineWidth=1;
   ctx.beginPath();
   fTop.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
   ctx.closePath();ctx.stroke();
   for(let c=0;c<4;c++){
    ctx.beginPath();ctx.moveTo(eglVerts[c].x,eglVerts[c].y);ctx.lineTo(fTop[c].x,fTop[c].y);ctx.stroke();
   }
   if(STATE.showLabels){
    const propLbl=projectPoint(pb.x+1.5,pb.y+1.2,pb.egl,W,H);
    ctx.fillStyle='#8ec29e';
    ctx.font='700 8px ui-monospace,Consolas,monospace';
    ctx.fillText(`PROPERTY LINE & PERIMETER SECURITY FENCE · EGL ${pb.egl.toFixed(2)}m`,propLbl.x,propLbl.y);
   }
  }

  // 2. Main Public Frontage Highway (South of Project Entrance, -0.70m)
  const fr=mp.frontageRoad;
  if(fr){
   const fv=boxVertices({x:fr.x,y:fr.y,z:-0.85,w:fr.w,d:fr.d,h:0.15}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    ctx.fillStyle=shadeHex(COLORS.highway,f.shade);
    ctx.strokeStyle='#4c6359';
    ctx.lineWidth=0.9;
    ctx.beginPath();
    f.idx.map(i=>fv[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();
   }
   // Divided highway center median island (with break at entrance throat x: 13.0..20.0)
   for(const seg of [[fr.x+1,12.5],[20.5,fr.x+fr.w-1]]){
    const mv=boxVertices({x:seg[0],y:fr.y+fr.d*0.46,z:-0.70,w:seg[1]-seg[0],d:0.45,h:0.12}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
    ctx.fillStyle='#516e5f';
    ctx.beginPath();
    [4,5,6,7].map(i=>mv[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();
   }
   // Highway lane markings
   ctx.strokeStyle='rgba(245,220,140,0.65)';
   ctx.lineWidth=1.2;
   ctx.setLineDash([6,5]);
   for(const ly of [fr.y+fr.d*0.23,fr.y+fr.d*0.77]){
    const p1=projectPoint(fr.x+1,ly,-0.68,W,H),p2=projectPoint(fr.x+fr.w-1,ly,-0.68,W,H);
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
   }
   ctx.setLineDash([]);
   if(STATE.showLabels){
    const hwyPt=projectPoint(fr.x+4.0,fr.y+fr.d*0.72,-0.65,W,H);
    ctx.fillStyle='#ffdf88';
    ctx.font='700 8.5px ui-monospace,Consolas,monospace';
    ctx.fillText('MAIN PUBLIC FRONTAGE HIGHWAY (ILLUSTRATIVE ROAD · FFL -0.70m)',hwyPt.x,hwyPt.y);
   }
  }

  // 3. Internal Asphalt Ring Roads & Entrance Throat (FFL -0.60m)
  for(const rd of (mp.roads||[])){
   const rv=boxVertices({x:rd.x,y:rd.y,z:-0.80,w:rd.w,d:rd.d,h:0.20}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    ctx.fillStyle=shadeHex(COLORS.road,f.shade);
    ctx.strokeStyle='#495c53';
    ctx.lineWidth=0.7;
    ctx.beginPath();
    f.idx.map(i=>rv[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();
   }
   ctx.strokeStyle='rgba(235,210,130,0.52)';
   ctx.lineWidth=1.0;
   ctx.setLineDash([4,4]);
   if(rd.w>rd.d){
    const p1=projectPoint(rd.x+1.5,rd.y+rd.d*0.5,rd.z+0.02,W,H);
    const p2=projectPoint(rd.x+rd.w-1.5,rd.y+rd.d*0.5,rd.z+0.02,W,H);
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
   }else{
    const p1=projectPoint(rd.x+rd.w*0.5,rd.y+0.8,rd.z+0.02,W,H);
    const p2=projectPoint(rd.x+rd.w*0.5,rd.y+rd.d-0.8,rd.z+0.02,W,H);
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
   }
   ctx.setLineDash([]);
  }

  // 4. Concrete Building Podium Plinth (-0.60m Road up to ±0.00m SSL)
  const pod=mp.buildingPodium;
  if(pod){
   const pv=boxVertices({x:pod.x,y:pod.y,z:pod.zBase,w:pod.w,d:pod.d,h:pod.zTop-pod.zBase}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    ctx.fillStyle=shadeHex(COLORS.podium,f.shade);
    ctx.strokeStyle='#638071';
    ctx.lineWidth=0.9;
    ctx.beginPath();
    f.idx.map(i=>pv[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();
   }
  }

  // 5. Project Monument Sign (SIAM EDGE DC01) at Main Entrance
  const sign=mp.monumentSign;
  if(sign){
   // Stone plinth base
   const sb=boxVertices({x:sign.x-0.2,y:sign.y-0.15,z:sign.z,w:sign.w+0.4,d:sign.d+0.3,h:sign.baseH}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    ctx.fillStyle=shadeHex('#5a6b62',f.shade);
    ctx.strokeStyle='#8ca396';
    ctx.lineWidth=0.8;
    ctx.beginPath();
    f.idx.map(i=>sb[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();
   }
   // Main architectural monolith sign board
   const sv=boxVertices({x:sign.x,y:sign.y,z:sign.z+sign.baseH,w:sign.w,d:sign.d,h:sign.h}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    ctx.fillStyle=shadeHex(sign.color,f.shade);
    ctx.strokeStyle=sign.accent;
    ctx.lineWidth=1.3;
    ctx.beginPath();
    f.idx.map(i=>sv[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();
   }
   if(STATE.showLabels){
    const spPt=projectPoint(sign.x+sign.w*0.5,sign.y+sign.d,sign.z+sign.baseH+sign.h+0.35,W,H);
    const lbl=`🪧 ${sign.title} · 12 MW TEACHING CAMPUS`;
    ctx.font='700 8.5px ui-monospace,Consolas,monospace';
    const tw=ctx.measureText(lbl).width+12;
    ctx.fillStyle='#132e25';
    ctx.strokeStyle='#ffcf56';
    ctx.lineWidth=1.2;
    ctx.beginPath();ctx.roundRect(spPt.x-tw/2,spPt.y-10,tw,17,3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffcf56';
    ctx.textAlign='center';
    ctx.fillText(lbl,spPt.x,spPt.y+2);
    ctx.textAlign='left';
   }
  }

  // 6. Ramps, Truck Backing Apron & Main Security Gatehouse
  for(const ap of (mp.apronsAndRamps||[])){
   if(ap.kind==='gatehouse'){
    const gv=boxVertices(ap).map(v=>projectPoint(v[0],v[1],v[2],W,H));
    for(const f of FACES){
     ctx.fillStyle=shadeHex('#2c5949',f.shade);
     ctx.strokeStyle='#9ec4ab';
     ctx.lineWidth=1;
     ctx.beginPath();
     f.idx.map(i=>gv[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
     ctx.closePath();ctx.fill();ctx.stroke();
    }
    if(STATE.showLabels){
     const gp=projectPoint(ap.x+ap.w*0.5,ap.y+ap.d*0.5,ap.z+ap.h+0.35,W,H);
     ctx.fillStyle='#dbe9b0';
     ctx.font='700 8px ui-monospace,Consolas,monospace';
     ctx.textAlign='center';
     ctx.fillText('MAIN SECURITY GATEHOUSE / SALLY PORT',gp.x,gp.y);
     ctx.textAlign='left';
    }
   }else if(ap.kind==='dockApron'){
    // Heavy-duty concrete truck backing apron with yellow dock bay striping
    const dv=boxVertices({x:ap.x,y:ap.y,z:-0.60,w:ap.w,d:ap.d,h:0.12}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
    ctx.fillStyle='rgba(145,162,152,0.85)';
    ctx.strokeStyle='#ffcf56';
    ctx.lineWidth=1.1;
    ctx.beginPath();
    [4,5,6,7].map(i=>dv[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();
   }else{
    const rVerts=boxVertices({x:ap.x,y:ap.y,z:ap.zBase,w:ap.w,d:ap.d,h:ap.zTop-ap.zBase}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
    ctx.fillStyle='rgba(122,148,134,0.85)';
    ctx.strokeStyle='#b8d1c2';
    ctx.lineWidth=1;
    ctx.beginPath();
    [4,5,6,7].map(i=>rVerts[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();
   }
  }

  // 7. Underground Duct Banks & Manholes
  drawDuctBanks(ctx,D,W,H);

  // 8. External Utility Entry Vaults
  for(const ut of (mp.utilityConnections||[])){
   const up=projectPoint(ut.x,ut.y,ut.z,W,H);
   ctx.fillStyle='#10261f';
   ctx.strokeStyle=ut.color;
   ctx.lineWidth=1.6;
   ctx.beginPath();ctx.arc(up.x,up.y,5.5,0,Math.PI*2);ctx.fill();ctx.stroke();
   if(STATE.showLabels){
    ctx.fillStyle=ut.color;
    ctx.font='700 8px ui-monospace,Consolas,monospace';
    ctx.fillText(ut.id,up.x+8,up.y+3);
   }
  }

  ctx.restore();
 }

 function drawBaseVolumeDetails(ctx,bv,W,H){
  ctx.save();
  if(bv.kind==='loadingDock'){
   // Raised Dock Platform (+1.20m) & 2 Hydraulic Dock Leveler Bays + Roll-up Doors + Weather Canopy
   const bayW=2.6,bayGap=1.6;
   for(let b=0;b<2;b++){
    const bx=bv.x+1.6+b*(bayW+bayGap);
    // Roll-up sectional door on South wall (y = bv.y + bv.d)
    const doorPts=[
     [bx,bv.y+bv.d,bv.z+0.80],[bx+bayW,bv.y+bv.d,bv.z+0.80],
     [bx+bayW,bv.y+bv.d,bv.z+3.10],[bx,bv.y+bv.d,bv.z+3.10]
    ].map(p=>projectPoint(p[0],p[1],p[2],W,H));
    ctx.fillStyle='rgba(34,54,48,0.92)';
    ctx.strokeStyle='#ffcf56';
    ctx.lineWidth=1.2;
    ctx.beginPath();
    doorPts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();

    // Dock leveler lip at z + 0.80m
    const lipPts=[
     [bx+0.2,bv.y+bv.d,bv.z+0.80],[bx+bayW-0.2,bv.y+bv.d,bv.z+0.80],
     [bx+bayW-0.2,bv.y+bv.d+0.55,bv.z+0.75],[bx+0.2,bv.y+bv.d+0.55,bv.z+0.75]
    ].map(p=>projectPoint(p[0],p[1],p[2],W,H));
    ctx.fillStyle='#d49b2a';
    ctx.beginPath();
    lipPts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();
   }
   // Cantilevered Weather Canopy over Loading Dock Bays (at z + 3.30m projecting 1.5m south)
   const canVerts=boxVertices({x:bv.x+0.6,y:bv.y+bv.d,z:bv.z+3.25,w:bv.w-1.2,d:1.5,h:0.20}).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    ctx.fillStyle=shadeHex('#35594b',f.shade);
    ctx.strokeStyle='#9ec4ab';
    ctx.lineWidth=0.9;
    ctx.beginPath();
    f.idx.map(i=>canVerts[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();ctx.stroke();
   }
   if(STATE.showLabels){
    const dp=projectPoint(bv.x+bv.w*0.5,bv.y+bv.d+0.6,bv.z+1.9,W,H);
    ctx.fillStyle='#ffdf88';
    ctx.font='700 8.5px ui-monospace,Consolas,monospace';
    ctx.textAlign='center';
    ctx.fillText('LOADING DOCK & STAGING (L00 · 2 DOCK LEVELERS +1.20m)',dp.x,dp.y);
   }
  }else if(bv.kind==='lobby'){
   // Main Security Lobby & Mantrap Glazing on South facade under NOC
   const glzPts=[
    [bv.x+1.5,bv.y+bv.d,bv.z+0.10],[bv.x+bv.w-1.5,bv.y+bv.d,bv.z+0.10],
    [bv.x+bv.w-1.5,bv.y+bv.d,bv.z+2.90],[bv.x+1.5,bv.y+bv.d,bv.z+2.90]
   ].map(p=>projectPoint(p[0],p[1],p[2],W,H));
   ctx.fillStyle='rgba(110,195,215,0.32)';
   ctx.strokeStyle='#8ce0f5';
   ctx.lineWidth=1.1;
   ctx.beginPath();
   glzPts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
   ctx.closePath();ctx.fill();ctx.stroke();
   if(STATE.showLabels){
    const lp=projectPoint(bv.x+bv.w*0.5,bv.y+bv.d+0.3,bv.z+1.6,W,H);
    ctx.fillStyle='#b8ebf7';
    ctx.font='700 8px ui-monospace,Consolas,monospace';
    ctx.textAlign='center';
    ctx.fillText('SECURITY LOBBY & MANTRAP (L00)',lp.x,lp.y);
   }
  }
  ctx.restore();
 }

 function drawStructuralGridAndBenchmark(ctx,D,W,H){
  const grids=D.scene?.grids;
  ctx.save();
  if(grids){
   for(const gx of grids.x){
    const p1=projectPoint(gx.pos,0,0,W,H),p2=projectPoint(gx.pos,30,0,W,H);
    ctx.strokeStyle='rgba(175,212,188,0.16)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
    if(STATE.showLabels){
     ctx.fillStyle='rgba(19,46,38,0.92)';
     ctx.strokeStyle='rgba(175,212,188,0.5)';
     ctx.beginPath();ctx.arc(p1.x,p1.y,7.5,0,Math.PI*2);ctx.fill();ctx.stroke();
     ctx.fillStyle='#cbe0d0';
     ctx.font='700 8.5px ui-monospace,Consolas,monospace';
     ctx.textAlign='center';
     ctx.fillText(gx.label,p1.x,p1.y+3);
    }
   }
   for(const gy of grids.y){
    const p1=projectPoint(0,gy.pos,0,W,H),p2=projectPoint(36,gy.pos,0,W,H);
    ctx.strokeStyle='rgba(175,212,188,0.16)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
    if(STATE.showLabels){
     ctx.fillStyle='rgba(19,46,38,0.92)';
     ctx.strokeStyle='rgba(175,212,188,0.5)';
     ctx.beginPath();ctx.arc(p1.x,p1.y,7.5,0,Math.PI*2);ctx.fill();ctx.stroke();
     ctx.fillStyle='#cbe0d0';
     ctx.font='700 8px ui-monospace,Consolas,monospace';
     ctx.textAlign='center';
     ctx.fillText(gy.label,p1.x,p1.y+3);
    }
   }
  }
  const bm=D.scene?.benchmark||{id:'DC01-BM01',x:1,y:1,z:0};
  const bp=projectPoint(bm.x,bm.y,bm.z,W,H);
  ctx.strokeStyle='#ffcf56';
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.arc(bp.x,bp.y,6,0,Math.PI*2);
  ctx.moveTo(bp.x-9,bp.y);ctx.lineTo(bp.x+9,bp.y);
  ctx.moveTo(bp.x,bp.y-9);ctx.lineTo(bp.x,bp.y+9);
  ctx.stroke();
  if(STATE.showLabels){
   ctx.fillStyle='#ffcf56';
   ctx.font='700 8.5px ui-monospace,Consolas,monospace';
   ctx.textAlign='left';
   ctx.fillText(`${bm.id} (SSL ±0.00m | Ring Road -0.60m | Highway -0.70m | DuctBank -1.15m)`,bp.x+10,bp.y+3);
  }
  ctx.restore();
 }

 function drawLevelDatumPlanes(ctx,D,W,H){
  if(!STATE.showElevations)return;
  const levels=D.scene?.levels||[];
  ctx.save();
  for(const lv of levels){
   if(STATE.levelFilter!=='ALL'&&lv.id!=='SITE'&&STATE.levelFilter!==lv.id)continue;
   const zOff=STATE.explodeMode?(lv.id==='01'?3.4:lv.id==='RF'?6.4:0):0;
   const zVal=(lv.id==='SITE'?lv.egl:lv.ssl)+zOff;
   const pLeft=projectPoint(0.5,29.5,zVal,W,H);
   const pRight=projectPoint(36.0,29.5,zVal,W,H);
   const col=lv.id==='SITE'?'#9dc2a8':lv.id==='00'?'#dbe9b0':lv.id==='01'?'#9ce3f5':'#f5cfa0';
   ctx.strokeStyle=col;
   ctx.globalAlpha=0.55;
   ctx.lineWidth=1;
   ctx.setLineDash([5,4]);
   ctx.beginPath();ctx.moveTo(pLeft.x,pLeft.y);ctx.lineTo(pRight.x,pRight.y);ctx.stroke();
   ctx.setLineDash([]);
   if(STATE.showLabels){
    ctx.globalAlpha=0.95;
    const tagX=pRight.x+6,tagY=pRight.y;
    const txt=lv.id==='SITE'
     ?`▽ DuctBank -1.15m | EGL -0.80m | Road -0.60m`
     :`▽ ${lv.code} SSL +${lv.ssl.toFixed(2)}m | FFL +${lv.ffl.toFixed(2)}m${lv.ceilingH?` | Ceil +${lv.ceilingH.toFixed(2)}m`:''} | Soffit +${lv.soffit.toFixed(2)}m`;
    ctx.font='700 8px ui-monospace,Consolas,monospace';
    const tw=ctx.measureText(txt).width+10;
    ctx.fillStyle='#10261f';
    ctx.strokeStyle=col;
    ctx.beginPath();
    ctx.roundRect(tagX,tagY-9,tw,17,3);
    ctx.fill();ctx.stroke();
    ctx.fillStyle=col;
    ctx.textAlign='left';
    ctx.fillText(txt,tagX+5,tagY+2.5);
   }
  }
  ctx.restore();
 }

 function drawEquipmentDetails(ctx,item,W,H){
  ctx.save();
  ctx.globalAlpha=item.alpha;
  if(item.type==='Chiller'){
   for(let f=0;f<3;f++){
    const cx=item.x+(f+0.5)*(item.w/3),cy=item.y+item.d*0.5,cz=item.z+item.h+0.02;
    const cPt=projectPoint(cx,cy,cz,W,H);
    const r=Math.max(2.5,cPt.scale*0.32);
    ctx.strokeStyle='#102e38';
    ctx.fillStyle='rgba(18,52,64,0.75)';
    ctx.lineWidth=1.1;
    ctx.beginPath();ctx.arc(cPt.x,cPt.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
   }
  }else if(item.type==='Generator'){
   const pBase=projectPoint(item.x+item.w*0.5,item.y+item.d*0.82,item.z+item.h,W,H);
   const pTop=projectPoint(item.x+item.w*0.5,item.y+item.d*0.82,item.z+item.h+0.75,W,H);
   ctx.strokeStyle='#d6c5b3';
   ctx.lineWidth=Math.max(2,pBase.scale*0.22);
   ctx.beginPath();ctx.moveTo(pBase.x,pBase.y);ctx.lineTo(pTop.x,pTop.y);ctx.stroke();
  }else if(item.type==='UPS'||item.type==='Switchboard'){
   const bays=3;
   ctx.strokeStyle='rgba(15,38,30,0.65)';
   ctx.lineWidth=1;
   for(let b=1;b<bays;b++){
    const bx=item.x+(item.w/bays)*b;
    const p1=projectPoint(bx,item.y+item.d,item.z+0.15,W,H);
    const p2=projectPoint(bx,item.y+item.d,item.z+item.h-0.15,W,H);
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
   }
  }
  ctx.restore();
 }

 function draw(D,selectedZone,selectedAsset){
  const canvas=STATE.canvas;if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.min(2,root.devicePixelRatio||1);
  if(!rect.width||!rect.height)return;
  const W=Math.max(1,Math.floor(rect.width)),H=Math.max(1,Math.floor(rect.height));
  if(canvas.width!==W*dpr||canvas.height!==H*dpr){canvas.width=W*dpr;canvas.height=H*dpr;}
  ctx.save();
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);

  // Dark engineering studio background
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#0d1f1a');
  grad.addColorStop(1,'#163028');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);

  // 1. Site Masterplan (Frontage Highway, Monument Sign, Fence, Gatehouse, Ring Roads, Podium, Duct Banks)
  if(!(STATE.isolateService&&STATE.selectedService))drawSiteMasterplan(ctx,D,W,H);

  // 2. Structural Grids & Benchmark
  if(!(STATE.isolateService&&STATE.selectedService))drawStructuralGridAndBenchmark(ctx,D,W,H);

  // 3. Level Datum Planes
  if(!(STATE.isolateService&&STATE.selectedService))drawLevelDatumPlanes(ctx,D,W,H);

  const {zones,assets,subDetails,columns,baseVolumes}=getSceneEntities(D,selectedZone,selectedAsset);
  const renderFaces=[];
  STATE.projected=[];

  // Grounded L00 Base Volumes (Security Lobby under NOC & Loading Dock under OFF)
  for(const bv of baseVolumes){
   const verts=boxVertices(bv).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    const poly=f.idx.map(i=>verts[i]);
    const fDepth=poly.reduce((s,v)=>s+v.depth,0)/poly.length;
    renderFaces.push({
     item:{kind:'baseVolume',id:bv.id,selected:bv.selected},poly,depth:fDepth+6.0,
     fill:shadeHex(bv.color,f.shade),
     stroke:bv.selected?'#ffcf56':'#5e7a6b',alpha:bv.selected?0.52:0.34
    });
   }
  }

  // Structural Support Columns
  for(const col of columns){
   const verts=boxVertices(col).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    const poly=f.idx.map(i=>verts[i]);
    const fDepth=poly.reduce((s,v)=>s+v.depth,0)/poly.length;
    renderFaces.push({
     item:col,poly,depth:fDepth+4.5,
     fill:shadeHex(col.color,f.shade),
     stroke:col.stroke,alpha:col.alpha
    });
   }
  }

  // Zone Structural + Raised Floor Slabs (from SSL to FFL)
  for(const zv of zones){
   const verts=boxVertices(zv).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   const avgDepth=verts.reduce((s,v)=>s+v.depth,0)/verts.length;
   for(const f of FACES){
    const poly=f.idx.map(i=>verts[i]);
    const fDepth=poly.reduce((s,v)=>s+v.depth,0)/poly.length;
    renderFaces.push({
     item:zv,poly,depth:fDepth+5.2,
     fill:zv.selected?shadeHex('#b8e09e',f.shade):shadeHex(zv.color,f.shade),
     stroke:zv.stroke,alpha:zv.alpha
    });
   }
   // Make entire 3D zone volume clickable & selectable (both floor slab and room volume)
   const roomVerts=boxVertices(zv,zv.ssl,zv.roomH).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   STATE.projected.push({item:zv,verts:roomVerts,depth:avgDepth,faces:FACES.map(f=>f.idx.map(i=>roomVerts[i]))});
  }

  // Equipment Concrete Plinths / Raised Floor Stands (from SSL to FFL)
  for(const pl of subDetails){
   const verts=boxVertices(pl).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   for(const f of FACES){
    const poly=f.idx.map(i=>verts[i]);
    const fDepth=poly.reduce((s,v)=>s+v.depth,0)/poly.length;
    renderFaces.push({
     item:pl,poly,depth:fDepth+1.2,
     fill:shadeHex(pl.color,f.shade),
     stroke:pl.stroke,alpha:pl.alpha
    });
   }
  }

  // Maintainable Assets (sitting firmly on FFL)
  for(const item of assets){
   const verts=boxVertices(item).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   const avgDepth=verts.reduce((s,v)=>s+v.depth,0)/verts.length;
   for(const f of FACES){
    const poly=f.idx.map(i=>verts[i]);
    const fDepth=poly.reduce((s,v)=>s+v.depth,0)/poly.length;
    renderFaces.push({
     item,poly,depth:fDepth,
     fill:item.selected?shadeHex('#2ea374',f.shade):shadeHex(item.color,f.shade),
     stroke:item.stroke,alpha:item.alpha
    });
   }
   STATE.projected.push({item,verts,depth:avgDepth,faces:FACES.map(f=>f.idx.map(i=>verts[i]))});
  }

  // Room fit-out groups share the existing depth sort, explode transform and picking pipeline.
  for(const group of BUILDING?.build(D,STATE,selectedZone)||[]){
   const item={kind:'building',id:group.id,zoneId:group.zoneId,selected:STATE.selectedBuilding===group.id};
   for(const part of group.parts){
    const verts=boxVertices(part).map(v=>projectPoint(...v,W,H));
    for(const f of FACES){const poly=f.idx.map(i=>verts[i]);renderFaces.push({item,poly,depth:poly.reduce((n,p)=>n+p.depth,0)/poly.length,fill:shadeHex(part.color,f.shade),stroke:item.selected?'#ffcf56':part.color,alpha:part.alpha*(selectedZone===group.zoneId||!selectedZone||selectedZone==='SITE'?1:.5)});}
    STATE.projected.push({item,faces:FACES.map(f=>f.idx.map(i=>verts[i])),depth:verts.reduce((n,p)=>n+p.depth,0)/verts.length});
   }
  }

  const detail=DETAIL&&STATE.showServiceDetail?DETAIL.build(D,STATE,selectedZone):{meshes:[],labels:[]};
  for(const m of detail.meshes){
   const verts=m.vertices.map(v=>projectPoint(...v,W,H));
   const item={kind:'service',id:m.serviceId,zoneId:m.zoneId,selected:m.selected};
   const visible=[];
   for(const indices of m.faces){const poly=indices.map(i=>verts[i]);const area=(poly[1].x-poly[0].x)*(poly[2].y-poly[0].y)-(poly[1].y-poly[0].y)*(poly[2].x-poly[0].x);if(m.alpha>=1&&area>=-.001)continue;
    visible.push(poly);const [a,b,c]=indices.slice(0,3).map(i=>m.vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n)||1,light=Math.max(0,(-.3*n[0]-.5*n[1]+.8*n[2])/length),factor=.72+.28*light;
    renderFaces.push({item,poly,depth:poly.reduce((n,p)=>n+p.depth,0)/poly.length,fill:shadeHex(m.color,factor),stroke:m.color,alpha:m.alpha,noStroke:m.shape==='tube'});
   }
   if(visible.length)STATE.projected.push({item,faces:visible,depth:verts.reduce((n,p)=>n+p.depth,0)/verts.length});
  }

  // Painter's sort back-to-front
  renderFaces.sort((a,b)=>b.depth-a.depth);

  for(const rf of renderFaces){
   ctx.save();
   ctx.globalAlpha=rf.alpha;
   ctx.beginPath();
   rf.poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
   ctx.closePath();
   ctx.fillStyle=rf.fill;
   ctx.fill();
   ctx.lineWidth=rf.item.kind==='service'?(rf.item.selected?1:.35):(rf.item.selected?2.2:rf.item.id===STATE.hoveredId?1.8:.85);
   ctx.strokeStyle=rf.item.id===STATE.hoveredId?'#ffffff':rf.stroke;
   if(!rf.noStroke)ctx.stroke();
   ctx.restore();
  }

  // Draw Loading Dock & Security Lobby architectural details
  for(const bv of baseVolumes){
   drawBaseVolumeDetails(ctx,bv,W,H);
  }

  // Raised-floor 600mm tile grid lines on DH1/DH2 at FFL +0.60m
  for(const zv of zones.filter(z=>z.id==='DH1'||z.id==='DH2')){
   ctx.save();
   ctx.strokeStyle='rgba(45,95,72,0.28)';
   ctx.lineWidth=0.7;
   for(let rx=zv.x+1.5;rx<zv.x+zv.w;rx+=1.5){
    const p1=projectPoint(rx,zv.y,zv.ffl,W,H),p2=projectPoint(rx,zv.y+zv.d,zv.ffl,W,H);
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
   }
   for(let ry=zv.y+1.5;ry<zv.y+zv.d;ry+=1.5){
    const p1=projectPoint(zv.x,ry,zv.ffl,W,H),p2=projectPoint(zv.x+zv.w,ry,zv.ffl,W,H);
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
   }
   ctx.restore();
  }

  // Equipment sub-details
  for(const item of assets){
   drawEquipmentDetails(ctx,item,W,H);
  }

  // Zone Enclosures: Vertical Walls, Suspended Ceiling Plane (FCL), Structural Soffit & Explode Assembly Lines
  for(const item of zones){
   if(STATE.roomInterior)continue;
   const roomVerts=boxVertices(item,item.ssl,item.roomH).map(v=>projectPoint(v[0],v[1],v[2],W,H));
   ctx.save();
   // If Exploded Mode is active, draw dashed assembly leader line back to original footprint
   if(STATE.explodeMode){
    const origPt=projectPoint(item.rawX+item.w*0.5,item.rawY+item.d*0.5,item.rawSsl,W,H);
    const expPt=projectPoint(item.x+item.w*0.5,item.y+item.d*0.5,item.ssl,W,H);
    ctx.strokeStyle='rgba(255,207,86,0.55)';
    ctx.lineWidth=1.2;
    ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(origPt.x,origPt.y);ctx.lineTo(expPt.x,expPt.y);ctx.stroke();
   }

   // Translucent perimeter walls for selected or hovered zone
   if(item.selected||item.id===STATE.hoveredId){
    ctx.fillStyle=item.selected?'rgba(255,207,86,0.11)':'rgba(255,255,255,0.08)';
    for(const side of [[0,1,5,4],[1,2,6,5],[2,3,7,6],[0,3,7,4]]){
     ctx.beginPath();
     side.map(i=>roomVerts[i]).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
     ctx.closePath();ctx.fill();
    }
   }
   // Structural Soffit wireframe
   ctx.strokeStyle=item.selected?'#ffcf56':item.id===STATE.hoveredId?'#ffffff':'rgba(173,201,179,0.34)';
   ctx.lineWidth=item.selected?1.9:0.9;
   ctx.setLineDash(item.selected?[]:[3,3]);
   ctx.beginPath();
   [4,5,6,7,4].forEach((idx,i)=>i?ctx.lineTo(roomVerts[idx].x,roomVerts[idx].y):ctx.moveTo(roomVerts[idx].x,roomVerts[idx].y));
   ctx.stroke();
   for(let c=0;c<4;c++){
    ctx.beginPath();ctx.moveTo(roomVerts[c].x,roomVerts[c].y);ctx.lineTo(roomVerts[c+4].x,roomVerts[c+4].y);ctx.stroke();
   }
   // Suspended False Ceiling (FCL) plane inside zone if present
   if(item.ceilingH&&(item.selected||STATE.showElevations)){
    const ceilVerts=boxVertices(item,item.ssl,item.ceilingH-item.ssl).map(v=>projectPoint(v[0],v[1],v[2],W,H));
    ctx.strokeStyle=item.selected?'rgba(140,220,245,0.85)':'rgba(140,220,245,0.28)';
    ctx.lineWidth=item.selected?1.3:0.75;
    ctx.setLineDash([6,3]);
    ctx.beginPath();
    [4,5,6,7,4].forEach((idx,i)=>i?ctx.lineTo(ceilVerts[idx].x,ceilVerts[idx].y):ctx.moveTo(ceilVerts[idx].x,ceilVerts[idx].y));
    ctx.stroke();
   }
   ctx.restore();

   if(STATE.showLabels){
    const center=projectPoint(item.x+item.w*0.5,item.y+item.d*0.5,item.ffl+0.12,W,H);
    ctx.save();
    const ceilTxt=item.rawCeilingH?` · Ceil +${item.rawCeilingH.toFixed(2)}m`:'';
    const zText=`${item.id} · L${item.level} (FFL +${item.rawFfl.toFixed(2)}m${ceilTxt})`;
    ctx.font=(item.selected?'700 9.5px':'700 8.5px')+' ui-monospace,Consolas,monospace';
    const tw=ctx.measureText(zText).width+10;
    ctx.fillStyle=item.selected?'rgba(255,207,86,0.95)':'rgba(13,32,26,0.84)';
    ctx.strokeStyle=item.selected?'#173d34':'rgba(140,185,155,0.55)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(center.x-tw/2,center.y-9,tw,16,3);ctx.fill();ctx.stroke();
    ctx.fillStyle=item.selected?'#132e25':'#dff0e3';
    ctx.textAlign='center';
    ctx.fillText(zText,center.x,center.y+2);
    ctx.restore();
   }
  }

  // Maintenance & Lifting Envelopes
  if(STATE.showClearance){
   for(const item of assets.filter(x=>x.selected||x.inZone)){
    const cFront={x:item.x,y:item.y+item.d,z:item.z,w:item.w,d:item.clearanceFront,h:Math.max(1.4,item.h*0.85)};
    const cv=boxVertices(cFront).map(v=>projectPoint(v[0],v[1],v[2],W,H));
    ctx.save();
    ctx.fillStyle=item.selected?'rgba(255,196,77,0.22)':'rgba(104,186,156,0.10)';
    ctx.strokeStyle=item.selected?'rgba(255,207,86,0.9)':'rgba(130,204,175,0.45)';
    ctx.lineWidth=1.1;
    ctx.setLineDash([4,2]);
    ctx.beginPath();
    [0,1,2,3,0].forEach((idx,i)=>i?ctx.lineTo(cv[idx].x,cv[idx].y):ctx.moveTo(cv[idx].x,cv[idx].y));
    ctx.fill();ctx.stroke();
    if(item.selected){
     const cTop={x:item.x,y:item.y,z:item.z+item.h,w:item.w,d:item.d,h:item.clearanceTop};
     const tv=boxVertices(cTop).map(v=>projectPoint(v[0],v[1],v[2],W,H));
     ctx.strokeStyle='rgba(255,145,100,0.85)';
     ctx.beginPath();
     [4,5,6,7,4].forEach((idx,i)=>i?ctx.lineTo(tv[idx].x,tv[idx].y):ctx.moveTo(tv[idx].x,tv[idx].y));
     ctx.stroke();
    }
    ctx.restore();
   }
  }

  // Strictly Orthogonal (90-degree) MEP Routes & Vertical Drop Risers
  if(STATE.showRoutes&&D.scene?.routes&&!STATE.explodeMode&&!(DETAIL&&STATE.showServiceDetail&&D.scene?.serviceDetail)){
   for(const rt of D.scene.routes){
    if(STATE.isolateZone&&selectedZone&&selectedZone!=='SITE'&&rt.zone!==selectedZone&&rt.targetZone!==selectedZone)continue;
    const pts=rt.points.map(p=>projectPoint(p[0],p[1],p[2],W,H));
    const routeZ=rt.points[0][2];
    ctx.save();
    ctx.strokeStyle=rt.color;
    ctx.lineWidth=2.6;
    ctx.beginPath();
    pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.stroke();

    for(const a of assets.filter(x=>rt.system.includes(x.system))){
     const ax=a.x+a.w*0.5,ay=a.y+a.d*0.5;
     const runY=rt.points[1]?rt.points[1][1]:ay;
     const pBranchStart=projectPoint(ax,runY,routeZ,W,H);
     const pOverhead=projectPoint(ax,ay,routeZ,W,H);
     const pTopAsset=projectPoint(ax,ay,a.topElev,W,H);
     ctx.strokeStyle=rt.color;
     ctx.lineWidth=1.2;
     ctx.setLineDash([2,2]);
     ctx.beginPath();
     ctx.moveTo(pBranchStart.x,pBranchStart.y);
     ctx.lineTo(pOverhead.x,pOverhead.y);
     ctx.lineTo(pTopAsset.x,pTopAsset.y);
     ctx.stroke();
    }
    ctx.setLineDash([]);
    const mid=pts[1]||pts[0];
    if(mid&&STATE.showLabels){
     const lbl=`${rt.id} (${rt.elevationLabel||'CL +3.45m'})`;
     ctx.font='700 8px ui-monospace,Consolas,monospace';
     const tw=ctx.measureText(lbl).width+10;
     ctx.fillStyle='rgba(14,34,28,0.92)';
     ctx.strokeStyle=rt.color;
     ctx.lineWidth=1;
     ctx.beginPath();ctx.roundRect(mid.x-tw/2,mid.y-9,tw,15,3);ctx.fill();ctx.stroke();
     ctx.fillStyle=rt.color;
     ctx.textAlign='center';
     ctx.fillText(lbl,mid.x,mid.y+1.5);
    }
    ctx.restore();
   }
  }

  if(STATE.showLabels)for(const label of detail.labels){
   if(label.id!==STATE.selectedService&&label.zone!==selectedZone)continue;
   const p=projectPoint(...label.point,W,H);ctx.save();ctx.font='700 10px Consolas,monospace';ctx.textAlign='left';const w=ctx.measureText(label.text).width+12;ctx.fillStyle='rgba(12,30,26,.94)';ctx.fillRect(p.x,p.y-18,w,18);ctx.fillStyle=label.id===STATE.selectedService?'#ffdf79':label.color;ctx.fillText(label.text,p.x+6,p.y-5);ctx.restore();
  }
  // Asset Tags & Elevation Callouts
  if(STATE.showLabels){
   for(const item of assets){
    const top=projectPoint(item.x+item.w*0.5,item.y+item.d*0.5,item.topElev+0.32,W,H);
    if(item.selected||item.id===STATE.hoveredId||item.inZone){
     ctx.save();
     const label=item.selected&&STATE.showElevations?`${item.tag} [SSL +${item.ssl.toFixed(2)}m | FFL +${item.ffl.toFixed(2)}m | Top +${item.rawTopElev.toFixed(2)}m]`:item.tag;
     ctx.font=(item.selected?'700 10px':'600 9px')+' ui-monospace,Consolas,monospace';
     const tw=ctx.measureText(label).width+12;
     ctx.fillStyle=item.selected?'#ffcf56':item.id===STATE.hoveredId?'#ffffff':'rgba(15,36,29,0.88)';
     ctx.strokeStyle=item.selected?'#173d34':'#698f79';
     ctx.lineWidth=1;
     ctx.beginPath();
     ctx.roundRect(top.x-tw/2,top.y-10,tw,17,4);
     ctx.fill();ctx.stroke();
     ctx.fillStyle=item.selected||item.id===STATE.hoveredId?'#14332a':'#e8f2ea';
     ctx.textAlign='center';
     ctx.fillText(label,top.x,top.y+2);
     ctx.restore();
    }
   }
  }

  // North Arrow & Datum HUD
  ctx.save();
  const compassX=W-36,compassY=36;
  ctx.fillStyle='rgba(15,36,29,0.85)';
  ctx.strokeStyle='#7ca38b';
  ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(compassX,compassY,18,0,Math.PI*2);ctx.fill();ctx.stroke();
  const nAngle=-STATE.yaw-Math.PI/2;
  const nx=compassX+Math.cos(nAngle)*12,ny=compassY+Math.sin(nAngle)*12;
  ctx.strokeStyle='#ffcf56';
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(compassX,compassY);ctx.lineTo(nx,ny);ctx.stroke();
  ctx.fillStyle='#ffcf56';
  ctx.font='700 9px ui-monospace,Consolas,monospace';
  ctx.textAlign='center';
  ctx.fillText('N',compassX,compassY-21);

  ctx.fillStyle='rgba(219,233,176,0.94)';
  ctx.font='700 10px ui-monospace,Consolas,monospace';
  ctx.textAlign='left';
  ctx.fillText(`SIAM EDGE DC01 · ZONE: ${selectedZone} · LEVEL: ${STATE.levelFilter}${STATE.explodeMode?' · [SEPARATE / EXPLODED VIEW]':''}${!STATE.showLabels?' · [LABELS OFF]':''}`,14,20);
  ctx.fillStyle='rgba(190,212,196,0.80)';
  ctx.font='10px system-ui,sans-serif';
  ctx.fillText(`View: ${STATE.viewMode.toUpperCase()} (${Math.round(STATE.yaw*57.3)}°, ${Math.round(STATE.pitch*57.3)}°) · Zoom ${Math.round(52/STATE.distance*100)}% · Drag=Orbit, Shift+Drag=Pan, Wheel=Zoom, Click=Select Zone/Asset`,14,H-12);
  ctx.restore();

  ctx.restore();
 }

 function pickAt(x,y){
  const hits=[];
  for(const entry of STATE.projected){
   for(const poly of entry.faces){
    if(pointInPoly(x,y,poly)){
     hits.push(entry);
     break;
    }
   }
  }
  hits.sort((a,b)=>{
   const rank={asset:0,service:1,building:2,zone:3};if(a.item.kind!==b.item.kind)return rank[a.item.kind]-rank[b.item.kind];
   return a.depth-b.depth;
  });
  return hits[0]?.item||null;
 }

 let resizeObserver=null;
 function dispose(){
  resizeObserver?.disconnect();resizeObserver=null;
  if(STATE.isFullscreen){STATE.stageEl?.classList.remove('is-fullscreen');if(typeof document!=='undefined'&&document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});}
  STATE.isFullscreen=false;STATE.dragging=false;STATE.canvas=null;STATE.stageEl=null;STATE.projected=[];
 }
 function bindCanvas(canvas,D,getContextState,onSelect){
  const sameCanvas=STATE.canvas===canvas;
  if(!sameCanvas)dispose();
  STATE.canvas=canvas;STATE.stageEl=canvas?.closest('.viewer-stage')||null;STATE.onSelect=onSelect;
  if(!canvas)return;
  let queued=false;const redraw=()=>{const paint=()=>{queued=false;if(STATE.canvas!==canvas)return;const st=getContextState();draw(D,st.selectedZone,st.selectedAsset);};if(root.requestAnimationFrame){if(!queued){queued=true;root.requestAnimationFrame(paint);}}else paint();};
  if(!sameCanvas&&typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(redraw);resizeObserver.observe(canvas);}
  const pointers=new Map();let startX=0,startY=0,pinch=null;
  const gesture=()=>{const [a,b]=[...pointers.values()];return b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)}:null;};
  const pan=(dx,dy)=>{const cy=Math.cos(STATE.yaw),sy=Math.sin(STATE.yaw);STATE.targetX-=(dx*cy+dy*sy)*.045;STATE.targetY-=(-dx*sy+dy*cy)*.045;};
  canvas.onpointerdown=e=>{
   if(e.button!==0&&e.button!==2)return;
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   STATE.dragging=true;STATE.moved=pointers.size>1;
   startX=STATE.lastX=e.clientX;startY=STATE.lastY=e.clientY;
   STATE.dragMode=e.shiftKey||e.button===2?'pan':'orbit';pinch=gesture();
   canvas.setPointerCapture?.(e.pointerId);
  };
  canvas.onpointermove=e=>{
   const rect=canvas.getBoundingClientRect();
   if(pointers.has(e.pointerId)){
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=gesture();
    if(next&&pinch){STATE.moved=true;STATE.distance=Math.max(3,Math.min(98,STATE.distance*pinch.d/Math.max(1,next.d)));pan(next.x-pinch.x,next.y-pinch.y);pinch=next;}
    else{
     const dx=e.clientX-STATE.lastX,dy=e.clientY-STATE.lastY;
     if(Math.hypot(e.clientX-startX,e.clientY-startY)>4)STATE.moved=true;
     if(STATE.dragMode==='pan')pan(dx,dy);
     else{STATE.viewMode='orbit';STATE.yaw-=dx*.0085;STATE.pitch=Math.max(.08,Math.min(1.52,STATE.pitch+dy*.0075));}
    }
    STATE.lastX=e.clientX;STATE.lastY=e.clientY;redraw();
   }else{const hit=pickAt(e.clientX-rect.left,e.clientY-rect.top),id=hit?.id||null;if(id!==STATE.hoveredId){STATE.hoveredId=id;canvas.style.cursor=hit?'pointer':'grab';redraw();}}
  };
  canvas.onpointerup=e=>{
   if(!pointers.has(e.pointerId))return;
   const click=!STATE.moved&&pointers.size===1&&e.button===0;
   pointers.delete(e.pointerId);pinch=null;STATE.dragging=pointers.size>0;STATE.moved=true;
   const remaining=[...pointers.values()][0];if(remaining){STATE.lastX=remaining.x;STATE.lastY=remaining.y;}
   canvas.releasePointerCapture?.(e.pointerId);
   if(click){const rect=canvas.getBoundingClientRect(),hit=pickAt(e.clientX-rect.left,e.clientY-rect.top);if(hit)STATE.onSelect?.(hit);}
  };
  canvas.onpointercancel=canvas.onlostpointercapture=e=>{pointers.delete(e.pointerId);pinch=null;STATE.dragging=pointers.size>0;STATE.moved=true;};
  canvas.onwheel=e=>{e.preventDefault();STATE.distance=Math.max(3,Math.min(98,STATE.distance*(e.deltaY>0?1.09:.91)));redraw();};
  canvas.onkeydown=e=>{
   const st=getContextState();
   if(e.key==='Escape'&&STATE.isFullscreen){e.preventDefault();toggleFullscreen(D,st);}
   else if(e.key==='Home'){e.preventDefault();command('reset',D,st);}
   else if(['+','=','-','_'].includes(e.key)){e.preventDefault();command(['+','='].includes(e.key)?'zoomIn':'zoomOut',D,st);}
   else if(e.key.startsWith('Arrow')){e.preventDefault();const dx=e.key==='ArrowRight'?10:e.key==='ArrowLeft'?-10:0,dy=e.key==='ArrowDown'?10:e.key==='ArrowUp'?-10:0;if(e.shiftKey)pan(dx,dy);else{STATE.viewMode='orbit';STATE.yaw-=dx*.0085;STATE.pitch=Math.max(.08,Math.min(1.52,STATE.pitch+dy*.0075));}redraw();}
  };
  canvas.oncontextmenu=e=>e.preventDefault();
 }

 function toggleFullscreen(D,st){
  const el=STATE.stageEl||document.querySelector('.viewer-stage');
  if(!el)return;
  if(!document.fullscreenElement&&!STATE.isFullscreen){
   STATE.isFullscreen=true;
   el.classList.add('is-fullscreen');STATE.canvas?.focus?.({preventScroll:true});
   if(el.requestFullscreen){
    el.requestFullscreen().catch(()=>{});
   }
  }else{
   STATE.isFullscreen=false;
   el.classList.remove('is-fullscreen');el.querySelector('[data-cmd="fullscreen"]')?.focus?.({preventScroll:true});
   if(document.fullscreenElement&&document.exitFullscreen){
    document.exitFullscreen().catch(()=>{});
   }
  }
  const btn=el.querySelector('[data-cmd="fullscreen"]');if(btn)btn.textContent=STATE.isFullscreen?'🗗 ย่อกลับ':'⛶ ขยายเต็มจอ';
  setTimeout(()=>draw(D,st.selectedZone,st.selectedAsset),60);
 }

 if(typeof document!=='undefined')document.addEventListener('fullscreenchange',()=>{
  const el=STATE.stageEl||document.querySelector('.viewer-stage');
  if(!document.fullscreenElement&&STATE.isFullscreen){
   STATE.isFullscreen=false;
   if(el){el.classList.remove('is-fullscreen');const btn=el.querySelector('[data-cmd="fullscreen"]');if(btn)btn.textContent='⛶ ขยายเต็มจอ';}
  }
 });

 function command(cmd,D,st){
  if(cmd.startsWith('selectBuilding:')){STATE.selectedBuilding=cmd.slice(15);STATE.selectedService=null;STATE.isolateService=false;}
  else if(cmd==='toggleIsolateService'){if(!STATE.isolateService&&STATE.selectedService){command('selectService:'+STATE.selectedService,D,st);return;}STATE.isolateService=false;STATE.distance=52;STATE.targetX=18.5;STATE.targetY=18;STATE.targetZ=1.8;}
  else if(cmd==='toggleServiceDetail'){STATE.showServiceDetail=!STATE.showServiceDetail;}
  else if(cmd.startsWith('selectService:')){const id=cmd.slice(14),s=D.scene?.serviceDetail?.services.find(s=>s.id===id);if(s&&DETAIL){STATE.selectedService=id;STATE.isolateService=true;STATE.showServiceDetail=true;STATE.showRoutes=true;STATE.showDuctBanks=true;STATE.showSite=true;if(['busway','pipe','conduit','tray'].includes(s.kind))STATE.explodeMode=false;STATE.levelFilter='ALL';const b=DETAIL.build({...D,scene:{...D.scene,serviceDetail:{services:[s]}}},STATE,s.zone).meshes.flatMap(m=>m.vertices);if(b.length){STATE.targetX=(Math.min(...b.map(p=>p[0]))+Math.max(...b.map(p=>p[0])))/2;STATE.targetY=(Math.min(...b.map(p=>p[1]))+Math.max(...b.map(p=>p[1])))/2;STATE.targetZ=(Math.min(...b.map(p=>p[2]))+Math.max(...b.map(p=>p[2])))/2;STATE.distance=Math.max(5,Math.min(98,Math.max(...[0,1,2].map(i=>Math.max(...b.map(p=>p[i]))-Math.min(...b.map(p=>p[i]))))*1.05+3));const rect=STATE.canvas?.getBoundingClientRect()||{width:760,height:480};for(let attempt=0;attempt<14;attempt++){const points=b.map(p=>projectPoint(...p,rect.width,rect.height));if(points.every(p=>p.x>=rect.width*.1&&p.x<=rect.width*.9&&p.y>=rect.height*.1&&p.y<=rect.height*.9))break;STATE.distance=Math.min(98,STATE.distance*1.12);}}}}
  else if(cmd==='clearService'){if(STATE.isolateService){STATE.distance=52;STATE.targetX=18.5;STATE.targetY=18;STATE.targetZ=1.8;}STATE.selectedService=null;STATE.isolateService=false;}
  else if(cmd==='reset'){STATE.roomInterior=false;STATE.selectedBuilding=null;STATE.viewMode='iso';STATE.yaw=-0.58;STATE.pitch=0.52;STATE.distance=52;STATE.targetX=18.5;STATE.targetY=18.0;STATE.targetZ=1.8;STATE.isolateZone=false;STATE.explodeMode=false;STATE.levelFilter='ALL';STATE.showSite=true;STATE.showDuctBanks=true;STATE.showLabels=true;STATE.showClearance=true;STATE.showRoutes=true;STATE.showElevations=true;STATE.showServiceDetail=true;STATE.selectedService=null;STATE.isolateService=false;}
  else if(cmd==='viewIso'){STATE.viewMode='iso';STATE.yaw=-0.58;STATE.pitch=0.52;STATE.distance=52;}
  else if(cmd==='viewTop'){STATE.viewMode='top';STATE.yaw=0;STATE.pitch=Math.PI/2;STATE.distance=58;STATE.targetX=18.5;STATE.targetY=18.0;}
  else if(cmd==='viewSouth'){STATE.viewMode='south';STATE.yaw=0;STATE.pitch=0;STATE.distance=48;STATE.targetZ=2.4;}
  else if(cmd==='viewEast'){STATE.viewMode='east';STATE.yaw=-Math.PI/2;STATE.pitch=0;STATE.distance=48;STATE.targetZ=2.4;}
  else if(cmd.startsWith('level:')){STATE.levelFilter=cmd.split(':')[1];}
  else if(cmd==='roomInterior'){
   const z=D.scene?.zoneVolumes.find(z=>z.zoneId===st.selectedZone);if(z&&BUILDING?.profiles[z.zoneId]){command('reset',D,st);command('fitZone',D,st);STATE.roomInterior=true;STATE.isolateZone=true;STATE.levelFilter=z.level;STATE.showSite=false;STATE.showRoutes=false;STATE.showDuctBanks=false;STATE.showElevations=false;STATE.showServiceDetail=false;STATE.showLabels=false;STATE.showClearance=false;STATE.targetZ=z.ffl+1.3;STATE.yaw=Math.PI-.35;STATE.pitch=.72;}
  }
  else if(cmd==='fitZone'){
   const zv=(D.scene?.zoneVolumes||[]).find(x=>x.zoneId===st.selectedZone);
   if(zv&&zv.zoneId!=='SITE'){const off=getZoneExplodeOffset(zv.zoneId,zv.level,zv.x+zv.w/2,zv.y+zv.d/2);STATE.levelFilter='ALL';STATE.targetX=zv.x+zv.w/2+off.dx;STATE.targetY=zv.y+zv.d/2+off.dy;STATE.targetZ=zv.ssl+1.5+off.dz;STATE.distance=Math.max(12,Math.max(zv.w,zv.d,zv.h)*1.15+4);}else{STATE.targetX=18.5;STATE.targetY=18;STATE.targetZ=1.8;STATE.distance=62;}
  }else if(cmd==='fitAsset'){
   const a=D.assets.find(x=>x.id===st.selectedAsset);
   if(a?.spatial){const zv=D.scene.zoneVolumes.find(z=>z.zoneId===a.zone),off=getZoneExplodeOffset(a.zone,zv.level,zv.x+zv.w/2,zv.y+zv.d/2);STATE.levelFilter='ALL';STATE.targetX=a.spatial.x+a.spatial.w/2+off.dx;STATE.targetY=a.spatial.y+a.spatial.d/2+off.dy;STATE.targetZ=a.spatial.ffl+1+off.dz;STATE.distance=17;}
  }else if(cmd==='toggleSite'){STATE.showSite=!STATE.showSite;}
  else if(cmd==='toggleDuctBanks'){STATE.showDuctBanks=!STATE.showDuctBanks;}
  else if(cmd==='toggleExplode'){STATE.explodeMode=!STATE.explodeMode;if(STATE.explodeMode)STATE.distance=Math.max(STATE.distance,62);}
  else if(cmd==='toggleLabels'){STATE.showLabels=!STATE.showLabels;}
  else if(cmd==='toggleClearance'){STATE.showClearance=!STATE.showClearance;}
  else if(cmd==='toggleRoutes'){STATE.showRoutes=!STATE.showRoutes;}
  else if(cmd==='toggleElevations'){STATE.showElevations=!STATE.showElevations;}
  else if(cmd==='toggleIsolate'){STATE.isolateZone=!STATE.isolateZone;}
  else if(cmd==='fullscreen'){toggleFullscreen(D,st);return;}
  else if(cmd==='zoomIn'){STATE.distance=Math.max(3,STATE.distance*0.85);}
  else if(cmd==='zoomOut'){STATE.distance=Math.min(98,STATE.distance*1.15);}
  draw(D,st.selectedZone,st.selectedAsset);
 }

 root.DCViewer={bindCanvas,draw,command,dispose,getState:()=>({...STATE,canvas:undefined,stageEl:undefined,onSelect:undefined,projected:undefined})};
 if(typeof module==='object'&&module.exports)module.exports={...root.DCViewer,projectPoint,getSceneEntities,pickAt};
})(typeof globalThis!=='undefined'?globalThis:this);
