const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
// Browser-independent DOM/history harness. No external dependencies.
class Element {
  constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.listeners={};this.textContent='';}
  append(...els){this.children.push(...els);}
  replaceChildren(...els){this.children=[...els];this.textContent='';}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;}
  removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,fn){(this.listeners[k] ||= []).push(fn);}
  click(){if(!this.disabled)for(const fn of this.listeners.click || [])fn({preventDefault(){}});}
  focus(){this.focused=true;}
  querySelectorAll(tag){return this.children.flatMap(c=>[...(c.tag===tag?[c]:[]),...c.querySelectorAll(tag)]);}
}
function boot(hash='') {
  const ids=Object.fromEntries(['question','diagram','trail','back','restart','zoom-in','zoom-out','zoom-reset','workspace'].map(id=>[id,new Element('div')]));
  const modes=['both','text','diagram'].map(v=>{const b=new Element('button');b.dataset.view=v;return b;});
  const events={},location={hash},entries=[{hash,state:null}];let cursor=0;
  const history={get state(){return entries[cursor].state;},replaceState(state,_,url){entries[cursor]={state,hash:url || location.hash};location.hash=entries[cursor].hash;},pushState(state,_,url){entries.splice(cursor+1);entries.push({state,hash:url});cursor++;location.hash=url;},back(){if(cursor>0){cursor--;location.hash=entries[cursor].hash;(events.popstate||[]).forEach(f=>f());}},forward(){if(cursor<entries.length-1){cursor++;location.hash=entries[cursor].hash;(events.popstate||[]).forEach(f=>f());}}};
  const document={createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),createTextNode:t=>{const e=new Element('text');e.textContent=t;return e;},getElementById:id=>ids[id],querySelectorAll:()=>modes};
  const window={addEventListener:(key,fn)=>(events[key] ||= []).push(fn)};
  const ctx=vm.createContext({window,document,history,location});
  for(const file of ['tree.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',file),'utf8'),ctx);
  return {ids,modes,history,location,tree:window.EXERCISE,validate:window.validateExercise,answer(i=0){ids.question.querySelectorAll('button')[i].click();},jump(id){ids.diagram.querySelectorAll('a').find(a=>a.dataset.node===id).click();}};
}
test('all elements lead to recovery; back and forward restore the route',()=>{
 const app=boot();assert.equal(app.location.hash,'#/duty');assert.equal(app.ids.back.disabled,true);
 for(const id of ['damages','breach','actual-cause','proximate-cause','defenses','recovery']){app.answer();assert.equal(app.location.hash,`#/${id}`);}
 assert.equal(app.history.state.trail.length,6);app.ids.back.click();assert.equal(app.location.hash,'#/defenses');assert.equal(app.history.state.trail.length,5);
 app.history.forward();assert.equal(app.location.hash,'#/recovery');
});
test('each missing element has its own failure route',()=>{
 const failures=['no-duty','no-harm','no-breach','no-actual','no-proximate'];
 failures.forEach((id,depth)=>{const app=boot();for(let i=0;i<depth;i++)app.answer();app.answer(1);assert.equal(app.location.hash,`#/${id}`);assert.equal(app.ids.question.querySelectorAll('button').length,0);});
});
test('defenses can reduce or bar recovery',()=>{
 for(const [choice,id] of [[1,'reduced'],[2,'barred']]){const app=boot('#/defenses');app.answer(choice);assert.equal(app.location.hash,`#/${id}`);}
});
test('diagram exploration clears answers, reveals page, and back restores prior answers',()=>{
 const app=boot();app.answer();app.modes[2].click();app.jump('breach');assert.equal(app.ids.workspace.className,'workspace both');assert.equal(app.history.state.trail.length,0);assert.equal(app.history.state.exploring,true);
 app.ids.back.click();assert.equal(app.location.hash,'#/damages');assert.equal(app.history.state.trail.length,1);
});
test('bookmarks and invalid links load safely',()=>{
 const app=boot('#/proximate-cause');assert.equal(app.location.hash,'#/proximate-cause');assert.equal(app.history.state.trail.length,0);
 const invalid=boot('#/missing');assert.equal(invalid.location.hash,'#/duty');assert.equal(invalid.ids.question.children[0].className,'status');
});
test('restart clears the route; trail links let answers be changed',()=>{
 const app=boot();app.answer();app.answer();app.ids.trail.querySelectorAll('a')[0].click();assert.equal(app.location.hash,'#/duty');assert.equal(app.history.state.trail.length,0);
 app.answer();app.ids.restart.click();assert.equal(app.location.hash,'#/duty');assert.equal(app.history.state.trail.length,0);
});
test('view and zoom controls work with bounded zoom',()=>{
 const app=boot();app.modes[1].click();assert.equal(app.ids.workspace.className,'workspace text');
 for(let i=0;i<20;i++)app.ids['zoom-out'].click();assert.equal(app.ids['zoom-reset'].textContent,'60%');
 for(let i=0;i<20;i++)app.ids['zoom-in'].click();assert.equal(app.ids['zoom-reset'].textContent,'160%');
 app.ids['zoom-reset'].click();assert.equal(app.ids['zoom-reset'].textContent,'100%');
});
test('data validator rejects broken destinations, duplicate IDs, and overlapping nodes',()=>{
 const app=boot();const clone=()=>JSON.parse(JSON.stringify(app.tree));
 let data=clone();data.nodes[0].choices[0].to='missing';assert.throws(()=>app.validate(data),/Missing destination/);
 data=clone();data.nodes[1].id=data.nodes[0].id;assert.throws(()=>app.validate(data),/unique/);
 data=clone();data.nodes[1].column=0;assert.throws(()=>app.validate(data),/overlap/);
});
