'use strict';
(function () {
  const tree = window.EXERCISE;
  function validate(data) {
    if (!data || !Array.isArray(data.nodes) || !data.nodes.length) throw new Error('The exercise needs nodes.');
    const ids = new Set(); const positions = new Set();
    for (const n of data.nodes) {
      if (!/^[a-z0-9-]+$/.test(n.id) || ids.has(n.id)) throw new Error('Node ids must be unique lowercase names.');
      ids.add(n.id);
      if (!Number.isInteger(n.row) || n.row < 0 || !Number.isInteger(n.column) || n.column < 0) throw new Error('Every node needs a nonnegative integer row and column.');
      const pos = `${n.row},${n.column}`;
      if (positions.has(pos)) throw new Error('Diagram nodes overlap.');
      positions.add(pos);
      if (!Array.isArray(n.choices)) throw new Error('Each node needs a choices array.');
    }
    if (!ids.has(data.start)) throw new Error('The start node is missing.');
    for (const n of data.nodes) for (const c of n.choices) if (!ids.has(c.to)) throw new Error(`Missing destination: ${c.to}`);
    return data;
  }
  window.validateExercise = validate;
  const $ = id => document.getElementById(id);
  try { validate(tree); } catch (e) { $('question').textContent = `Cannot load exercise: ${e.message}`; return; }
  const nodes = new Map(tree.nodes.map(n => [n.id, n]));
  const make = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs) => { const el = document.createElementNS(svgNS, tag); for (const [k,v] of Object.entries(attrs || {})) el.setAttribute(k,v); return el; };
  let zoom = 1, view = 'both';
  const width = (Math.max(...tree.nodes.map(n => n.column)) + 1) * 200 + 24;
  const height = (Math.max(...tree.nodes.map(n => n.row)) + 1) * 142 + 30;
  const xy = n => ({x: 22 + n.column * 200, y: 24 + n.row * 142});
  const svg = svgEl('svg', {viewBox:`0 0 ${width} ${height}`,width,height,role:'group','aria-label':`${tree.title} decision tree`});
  const defs = svgEl('defs'); const marker = svgEl('marker',{id:'arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'}); marker.append(svgEl('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#a1b3a7'})); defs.append(marker); svg.append(defs);
  for (const n of tree.nodes) for (const c of n.choices) {
    const a=xy(n), b=xy(nodes.get(c.to)); let d,lx,ly;
    if (a.y===b.y) {d=`M ${a.x+164} ${a.y+37} H ${b.x}`;lx=a.x+182;ly=a.y+28;}
    else if(a.x===b.x){d=`M ${a.x+82} ${a.y+74} V ${b.y}`;lx=a.x+98;ly=a.y+105;}
    else {const mid=a.y+104+c.to.length%3*8;d=`M ${a.x+82} ${a.y+74} V ${mid} H ${b.x+82} V ${b.y}`;lx=b.x+82;ly=mid-8;}
    svg.append(svgEl('path',{d,class:'edge','marker-end':'url(#arrow)'}));
    const label=svgEl('text',{x:lx,y:ly,'text-anchor':'middle',class:'edge-label'});label.textContent=c.edge || c.label;svg.append(label);
  }
  for (const n of tree.nodes) {
    const p=xy(n), a=svgEl('a',{href:`#/${n.id}`,class:n.type || 'decision','data-node':n.id,'aria-label':n.title});
    a.append(svgEl('rect',{x:p.x,y:p.y,width:164,height:74,rx:10}));
    const lines=n.label.split('\n');
    lines.forEach((line,i)=> {const t=svgEl('text',{x:p.x+82,y:p.y+39+(i-(lines.length-1)/2)*17,'text-anchor':'middle'});t.textContent=line;a.append(t);});
    a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();if(view==='diagram')setView('both');navigate(n.id,[],true);}); svg.append(a);
  }
  $('diagram').append(svg);
  function idFromHash() { const raw=location.hash.slice(2); return location.hash.startsWith('#/') && nodes.has(raw) ? raw : null; }
  function state() {return history.state?.exercise==='negligence-v1' ? history.state : {exercise:'negligence-v1',trail:[],depth:0,exploring:false};}
  function navigate(id, trail, exploring=false) {history.pushState({exercise:'negligence-v1',trail,depth:state().depth+1,exploring},'',`#/${id}`);render(true);}
  function render(focus=false) {
    let id=idFromHash(), invalid=false;
    if(!id){invalid=Boolean(location.hash);id=tree.start;history.replaceState({exercise:'negligence-v1',trail:[],depth:0,exploring:false},'',`#/${id}`);}
    const n=nodes.get(id), s=state(), q=$('question');q.replaceChildren();
    document.title=`${n.label.replaceAll('\n',' — ')} | ${tree.title}`;
    if(invalid)q.append(make('p','That page was not found. The exercise has returned to its start.','status'));
    q.append(make('p',n.category || 'ANALYSIS RESULT','eyebrow'));
    const h=make('h2',n.title);h.tabIndex=-1;q.append(h);
    if(n.type)q.append(make('span',n.type==='success'?'Recovery route':'Claim fails / recovery barred','outcome'));
    q.append(make('p',n.body));
    const scenario=make('details',undefined,'scenario');scenario.append(make('summary','Practice scenario'),make('p',tree.scenario));q.append(scenario);
    if(n.prompt){const reason=make('div',undefined,'reason');reason.append(make('strong','Explain your reasoning'),make('p',n.prompt));q.append(reason);}
    if(n.example){const example=make('details');example.append(make('summary','Apply it to Alex and Jordan'),make('p',n.example));q.append(example);}
    const choices=make('div',undefined,'choices');
    for(const c of n.choices){const b=make('button',undefined,'choice');b.append(make('span',c.label),make('span','→'));b.addEventListener('click',()=>navigate(c.to,[...s.trail,{id:n.id,answer:c.label}],s.exploring));choices.append(b);}q.append(choices);
    if(!n.choices.length)q.append(make('p','Review your route below, go back to change an answer, or restart.'));
    $('trail').replaceChildren();
    if(s.exploring)$('trail').append(make('li','Exploration started from a diagram node. Earlier elements have not been answered.'));
    s.trail.forEach((step,index)=>{if(!nodes.has(step.id))return;const li=make('li'),a=make('a',nodes.get(step.id).label.replaceAll('\n',' — '));a.href=`#/${step.id}`;a.addEventListener('click',e=>{e.preventDefault();navigate(step.id,s.trail.slice(0,index),s.exploring);});li.append(a,document.createTextNode(` — ${step.answer}`));$('trail').append(li);});
    $('trail').append(make('li',`Current: ${n.label.replaceAll('\n',' — ')}`));
    $('back').disabled=s.depth===0;
    for(const a of svg.querySelectorAll('a')){if(a.dataset.node===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
    if(focus && view!=='diagram')h.focus({preventScroll:true});
  }
  $('back').addEventListener('click',()=>history.back());
  $('restart').addEventListener('click',()=>navigate(tree.start,[]));
  function setZoom(value){zoom=Math.min(1.6,Math.max(.6,value));svg.setAttribute('width',width*zoom);svg.setAttribute('height',height*zoom);$('zoom-reset').textContent=`${Math.round(zoom*100)}%`;}
  $('zoom-in').addEventListener('click',()=>setZoom(zoom+.1));$('zoom-out').addEventListener('click',()=>setZoom(zoom-.1));$('zoom-reset').addEventListener('click',()=>setZoom(1));
  function setView(value){view=value;$('workspace').className=`workspace ${view}`;document.querySelectorAll('[data-view]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.view===view)));}
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  window.addEventListener('popstate',()=>render(true));window.addEventListener('hashchange',()=>render());
  if(!history.state?.exercise)history.replaceState({exercise:'negligence-v1',trail:[],depth:0,exploring:false},'');
  render();
})();
