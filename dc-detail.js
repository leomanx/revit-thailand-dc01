/* Geometry from dimensioned service metadata; metres, software-rendered teaching mesh. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DCDetail=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const len=(a,b)=>Math.hypot(...a.map((v,i)=>b[i]-v));
 const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const normal=v=>{const d=Math.hypot(...v);return v.map(x=>x/d);};
 function build(D,state={},selectedZone){
  const meshes=[],labels=[];let current=null;
  const mesh=(vertices,faces,color,part,alpha=1,shape='box')=>meshes.push({vertices,faces,color,part,alpha,shape,serviceId:current.id,zoneId:current.zone,selected:state.selectedService===current.id});
  const box=(x,y,z,w,d,h,color,part,alpha=1)=>{if(Math.min(w,d,h)<=0)return;mesh([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],[[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[0,3,2,1]],color,part,alpha);};
  const tube=(a,b,r,color,part)=>{if(len(a,b)<.001)return;const axis=normal(b.map((v,i)=>v-a[i])),u=normal(cross(axis,Math.abs(axis[2])>.9?[0,1,0]:[0,0,1])),v=cross(axis,u),verts=[];for(const p of [a,b])for(let i=0;i<10;i++){const t=i*Math.PI/5;verts.push(p.map((x,j)=>x+r*(Math.cos(t)*u[j]+Math.sin(t)*v[j])));}const faces=[Array.from({length:10},(_,i)=>9-i),Array.from({length:10},(_,i)=>10+i)];for(let i=0;i<10;i++)faces.push([i,(i+1)%10,(i+1)%10+10,i+10]);mesh(verts,faces,color,part,1,'tube');};
  const along=(points,pitch,fn)=>{let remaining=pitch/2;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=len(a,b);while(remaining<length){fn(mix(a,b,remaining/length),a,b);remaining+=pitch;}remaining-=length;}};
  const run=(a,b,w,h,color,part)=>{const d=b.map((v,i)=>v-a[i]),axis=d.findIndex(v=>Math.abs(v)>.0001);if(axis===0)box(Math.min(a[0],b[0]),a[1]-w/2,a[2]-h/2,Math.abs(d[0]),w,h,color,part);else if(axis===1)box(a[0]-w/2,Math.min(a[1],b[1]),a[2]-h/2,w,Math.abs(d[1]),h,color,part);else if(axis===2)box(a[0]-w/2,a[1]-w/2,Math.min(a[2],b[2]),w,w,Math.abs(d[2]),color,part);};
  function roundPath(points,r=.2){const result=[points[0]];for(let i=1;i<points.length-1;i++){const p=points[i],a=points[i-1],b=points[i+1],d=Math.min(r,len(a,p)*.25,len(p,b)*.25),enter=mix(p,a,d/len(p,a)),exit=mix(p,b,d/len(p,b));result.push(enter);for(let j=1;j<=4;j++){const t=j/4;result.push(p.map((_,k)=>(1-t)**2*enter[k]+2*(1-t)*t*p[k]+t*t*exit[k]));}}result.push(points[points.length-1]);return result;}
  function offsetPath(points,side,up){return points.map((p,i)=>{const dirs=[];let before=i-1,after=i+1;while(before>=0&&Math.hypot(p[0]-points[before][0],p[1]-points[before][1])<.001)before--;while(after<points.length&&Math.hypot(points[after][0]-p[0],points[after][1]-p[1])<.001)after++;for(const [a,b] of [[points[Math.max(0,before)],p],[p,points[Math.min(points.length-1,after)]]]){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);if(d>.001)dirs.push([-dy/d,dx/d]);}let n=dirs[0]||[1,0];if(dirs.length===2){const dot=dirs[0][0]*dirs[1][0]+dirs[0][1]*dirs[1][1];if(dot>-.9)n=[(dirs[0][0]+dirs[1][0])/(1+dot),(dirs[0][1]+dirs[1][1])/(1+dot)];}return [p[0]+n[0]*side,p[1]+n[1]*side,p[2]+up];});}
  const pipePath=(points,r,color,part)=>{const curve=roundPath(points);for(let i=1;i<curve.length;i++)tube(curve[i-1],curve[i],r,color,part);};
  for(const service of D.scene?.serviceDetail?.services||[]){
   if(state.isolateService&&state.selectedService&&service.id!==state.selectedService)continue;
   if(state.levelFilter&&state.levelFilter!=='ALL'&&!service.levels.includes(state.levelFilter))continue;
   if(state.isolateZone&&selectedZone!=='SITE'&&!service.zoneIds.includes(selectedZone))continue;
   if(state.explodeMode&&['busway','pipe','conduit','tray'].includes(service.kind))continue;
   if(state.showRoutes===false&&['busway','pipe','tray'].includes(service.kind))continue;
   if(state.showDuctBanks===false&&service.kind==='conduit')continue;
   if(state.showSite===false&&service.id==='DOOR-MAIN-01')continue;
   current=service;const p=service.points[0],c=service.color;
   const startIndex=meshes.length;
   if(service.kind==='busway'){
    for(let i=1;i<service.points.length;i++){const a=service.points[i-1],b=service.points[i];run(a,b,service.widthM,service.heightM,'#a6b0ad','busway casing');run(a.map((v,j)=>j===2?v+.035:v),b.map((v,j)=>j===2?v+.035:v),service.widthM+.008,.025,c,'circuit colour stripe');}
    along(service.points,service.jointEveryM,q=>box(q[0]-.21,q[1]-.21,q[2]-.115,.42,.42,.23,'#586766','joint pack'));
    along(service.points,service.supportEveryM,q=>{box(q[0]-.3,q[1]-.3,q[2]-.17,.6,.6,.045,'#555f64','trapeze support');for(const dx of [-.26,.26])tube([q[0]+dx,q[1],q[2]-.15],[q[0]+dx,q[1],4.65],.012,'#a1aca9','hanger rod');});
    along(service.points,service.tapEveryM,q=>{box(q[0]-.12,q[1]-.13,q[2]-.46,.24,.26,.32,c,'tap-off enclosure');tube([q[0],q[1],q[2]-.46],[q[0],q[1],q[2]-.8],.025,'#3b4246','tap-off cable tail');});
    box(p[0]-.03,p[1]-.13,p[2]-.075,.075,.018,.018,'#68aa67','PE terminal bar');
    for(let i=0;i<4;i++)box(p[0]-.025,p[1]-.12+i*.075,p[2]-.045,.07,.035,.09,'#c78f54','exposed terminal bar');
   }else if(service.kind==='pipe'){
    for(let pair=0;pair<2;pair++){const z=(pair-.5)*service.spacingM,points=offsetPath(service.points,0,z),color=pair?service.returnColor:c,r=service.outerDiameterM/2+service.insulationM;pipePath(points,r,color,pair?'CHWR insulation':'CHWS insulation');
     along(points,4,(q,a,b)=>{const d=normal(b.map((v,i)=>v-a[i]));tube(q.map((v,i)=>v-d[i]*.035),q.map((v,i)=>v+d[i]*.035),r*1.16,'#a6b3b5','flange coupling');});
     const q=mix(points[0],points[1],.25);box(q[0]-.19,q[1]-.19,q[2]-.19,.38,.38,.38,'#547e68','isolation valve body');tube(q,[q[0],q[1],q[2]+r+.22],.022,'#758c80','valve stem');tube([q[0]-.16,q[1],q[2]+r+.22],[q[0]+.16,q[1],q[2]+r+.22],.035,'#be5353','valve handwheel');
     for(const end of [points[0],points[points.length-1]]){const other=end===points[0]?points[1]:points[points.length-2],inside=mix(end,other,.008);tube(end,inside,service.outerDiameterM/2,'#607d83','steel bore end cap');}
    }
    along(service.points,service.supportEveryM,q=>{box(q[0]-.4,q[1]-.4,q[2]-service.spacingM/2-service.outerDiameterM/2-.08,.8,.8,.05,'#687974','pipe support saddle');tube([q[0]-.35,q[1],q[2]],[q[0]-.35,q[1],4.65],.012,'#8f9d99','support rod');});
   }else if(service.kind==='conduit'){
    for(let row=0;row<service.rows;row++)for(let col=0;col<service.columns;col++){const path=offsetPath(service.points,(col-(service.columns-1)/2)*service.spacingM,(row-(service.rows-1)/2)*service.spacingM);pipePath(path,service.outerDiameterM/2,c,'HDPE conduit '+(row*service.columns+col+1));const axis=normal(path[1].map((v,i)=>v-path[0][i]));tube(path[0].map((v,i)=>v-axis[i]*.004),path[0].map((v,i)=>v-axis[i]*.002),service.outerDiameterM*.34,'#192c2b','conduit bore end');}
    for(const mh of D.scene.siteMasterplan.manholes.filter(m=>m.color===service.color)){box(mh.x-.5,mh.y-.5,-.82,1,1,.12,'#71827a','draw-pit cover');box(mh.x-.35,mh.y-.35,-.69,.7,.7,.025,'#424e49','removable pit lid');}
   }else if(service.kind==='tray'){
    for(let i=1;i<service.points.length;i++){const a=service.points[i-1],b=service.points[i],dx=b[0]-a[0],dy=b[1]-a[1],horizontal=Math.abs(dx)>.001;for(const side of [-1,1]){const offset=horizontal?[0,side*.3,0]:[side*.3,0,0];run(a.map((v,j)=>v+offset[j]),b.map((v,j)=>v+offset[j]),.04,.1,'#939ca6','ladder side rail');}along([a,b],.4,q=>box(q[0]-(horizontal?.025:.3),q[1]-(horizontal?.3:.025),q[2]-.04,horizontal?.05:.6,horizontal?.6:.05,.025,'#84909a','ladder rung'));}
    for(let i=1;i<service.points.length;i++)run(service.points[i-1],service.points[i],.025,.13,'#63737d','tray divider');
    for(let cable=0;cable<service.cableCount;cable++)pipePath(offsetPath(service.points,(cable-(service.cableCount-1)/2)*.035,.025),.012,c,'representative cable '+(cable+1));
   }else if(service.kind==='shaft'){
    const {widthM:w,depthM:d,heightM:h}=service;box(p[0]-.08,p[1]-.08,p[2],w+.16,d+.16,h,c,'shaft translucent enclosure',.12);
    for(const z of [0,3.6,4.8,7.2]){box(p[0]-.1,p[1]-.1,z,w+.2,.12,.12,c,'penetration collar');box(p[0]-.1,p[1]+d,z,w+.2,.12,.12,c,'penetration collar');}
    for(const dx of [.35,w-.35])if(service.id.includes('MECH'))tube([p[0]+dx,p[1]+d/2,.15],[p[0]+dx,p[1]+d/2,7],.16,'#46aeb5','vertical CHW riser');else run([p[0]+dx,p[1]+d/2,.15],[p[0]+dx,p[1]+d/2,7],.28,.18,dx<.5?'#dba53a':'#4b9fdd','vertical busway enclosure');
    if(service.id.includes('MECH'))tube([p[0]+.2,p[1]+.2,.15],[p[0]+.2,p[1]+.2,7],.035,'#878e64','drain riser');
   }else if(service.kind==='door'){
    const w=service.widthM,h=service.heightM,t=service.depthM,rotate=service.axis==='y';
    const doorBox=(x,y,z,bw,bd,bh,color,part,alpha=1)=>rotate?box(p[0]+y,p[1]+x,p[2]+z,bd,bw,bh,color,part,alpha):box(p[0]+x,p[1]+y,p[2]+z,bw,bd,bh,color,part,alpha);
    for(const x of [-.08,w])doorBox(x,-.06,0,.08,.22,h+.08,'#61716f','door jamb');doorBox(-.08,-.06,h,w+.16,.22,.08,'#61716f','door head');
    for(let leaf=0;leaf<service.leafCount;leaf++){const lw=w/service.leafCount;doorBox(leaf*lw+.025,0,.04,lw-.05,t,h-.08,c,'door leaf',.75);doorBox(leaf*lw+lw*.8,-.075,.9,.025,.08,.45,'#c9d2cd','pull handle');}
    doorBox(0,-.15,0,w,.4,.025,'#b7b5a2','threshold');
    if(service.canopy){doorBox(-.6,-.1,h+.55,w+1.2,1.7,.16,'#99afb0','entrance canopy');for(const x of [-.45,w+.4])doorBox(x,1.3,0,.08,.08,h+.55,'#879695','canopy post');doorBox(-.6,.2,-.12,w+1.2,2,.12,'#b7b5a2','entrance apron');}
   }
   // Shift local architectural details with their owner in exploded view; spanning networks are hidden.
   if(state.explodeMode){const zone=D.scene.zoneVolumes.find(z=>z.zoneId===service.zone),cx=zone.x+zone.w/2,cy=zone.y+zone.d/2,dx=(cx-18)*.28,dy=(cy-16)*.28,dz=service.kind==='door'?0:zone.level==='RF'?6.4:zone.level==='01'?3.4:0;for(const m of meshes.slice(startIndex))for(const v of m.vertices){v[0]+=dx;v[1]+=dy;v[2]+=dz;}}
   if(meshes.length>startIndex){const anchor=meshes[startIndex].vertices[0];const spec=service.currentA?service.currentA+' A / '+service.loadKW+' kW':service.pipeCount?service.pipeCount+' x DN'+service.dn+' / '+service.coolingKW+' kW cooling':service.conduitCount?service.conduitCount+' x '+Math.round(service.outerDiameterM*1000)+' mm':service.kind==='door'?service.widthM+' x '+service.heightM+' m':'';labels.push({id:service.id,point:[anchor[0],anchor[1],anchor[2]+.5],color:c,text:service.id+(spec?' | '+spec:''),zone:service.zone});}
  }
  return {meshes,labels};
 }
 return {build};
});
