const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.listeners={};this.textContent='';this.value='';this.files=[];}
 append(...els){this.children.push(...els);}
 replaceChildren(...els){this.children=[...els];this.textContent='';}
 setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,fn){(this.listeners[k] ||= []).push(fn);}
 fire(k){return Promise.all((this.listeners[k]||[]).map(fn=>fn({preventDefault(){}})));}
 click(){if(!this.disabled)return this.fire('click');}
 focus(){this.focused=true;}
 remove(){this.removed=true;}
 querySelectorAll(tag){return this.children.flatMap(c=>[...(c.tag===tag?[c]:[]),...c.querySelectorAll(tag)]);}
}
function environment(storage=new Map()){
 const ids={};for(const id of fs.readFileSync(path.join(root,'z_editor.html'),'utf8').matchAll(/id="([^"]+)"/g))ids[id[1]]=new Element('div');
 for(const id of ['question','diagram','trail','back','restart','zoom-in','zoom-out','zoom-reset','workspace','exercise-title','exercise-subject','exercise-intro','brand-link','exercise-scope','exercise-references','exercise-data'])ids[id] ||= new Element('div');
 const modes=['both','text','diagram'].map(v=>{const b=new Element('button');b.dataset.view=v;return b;});
 const document={body:new Element('body'),createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),createTextNode:t=>{const el=new Element('text');el.textContent=t;return el;},getElementById:id=>ids[id],querySelectorAll:()=>modes};
 const entries=[{hash:'',state:null}],events={};let cursor=0;const location={hash:'',pathname:'/test.html'};
 const history={get state(){return entries[cursor].state;},replaceState(state,_,hash){entries[cursor]={state,hash:hash||location.hash};location.hash=entries[cursor].hash;},pushState(state,_,hash){entries.splice(cursor+1);entries.push({state,hash});cursor++;location.hash=hash;},back(){if(cursor>0){cursor--;location.hash=entries[cursor].hash;(events.popstate||[]).forEach(fn=>fn());}}};
 const window={confirm:()=>true,addEventListener:(k,fn)=>(events[k] ||= []).push(fn)};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const ctx=vm.createContext({window,document,location,history,localStorage,Blob,URL,setTimeout:()=>0});
 const run=file=>vm.runInContext(fs.readFileSync(path.join(root,'assets',file),'utf8'),ctx);
 return {ids,ctx,run,window,location,history,storage,input(id,v,event='input'){ids[id].value=v;return ids[id].fire(event);}};
}
function boot(storage){const env=environment(storage);for(const f of ['tree.js','model.js','markdown.js','export-template.js','export.js','editor.js'])env.run(f);env.downloads=[];env.window.ExerciseExport.download=(name,content,type)=>env.downloads.push({name,content,type});return env;}
const saved=env=>JSON.parse(env.storage.get('studies-de-jure-editor-draft-v1')).exercise;
const text=el=>el.textContent+el.children.map(text).join('');
test('edit Markdown, save a project, reopen it, and export student HTML',async()=>{
 const env=boot();await env.input('page-body','## A rule\n\nUse **reasonable care**.\n\n- First\n- Second');await env.ids['save-project'].click();
 const backup=env.downloads[0];assert.equal(backup.name,'negligence-project.json');const project=env.window.ExerciseExport.readProject(backup.content);assert.match(project.nodes[0].body,/reasonable care/);
 await env.input('page-body','A later edit');env.ids['open-project'].files=[{size:backup.content.length,text:async()=>backup.content}];await env.ids['open-project'].fire('change');assert.match(env.ids['page-body'].value,/reasonable care/);
 await env.ids['export-html'].click();const html=env.downloads[1].content;assert.match(html,/id="exercise-data"/);assert.doesNotMatch(html,/<script[^>]+src=/);assert.doesNotMatch(html,/<link[^>]+stylesheet/);
 const runtime=environment();runtime.ids['exercise-data'].textContent=html.match(/id="exercise-data">([\s\S]*?)<\/script>/)[1];
 for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(match[1],runtime.ctx);
 assert.equal(runtime.location.hash,'#/duty');assert.equal(text(runtime.ids.question.querySelectorAll('strong')[0]),'reasonable care');
 runtime.ids.question.querySelectorAll('button')[0].click();assert.equal(runtime.location.hash,'#/damages');
});
test('add a page, connect a choice, and preserve stable destinations when page titles change',async()=>{
 const env=boot();await env.ids['add-page'].click();await env.input('page-title','Special duty rule');await env.input('page-label','Special duty');assert.equal(saved(env).nodes.length,15);
 const target=saved(env).nodes.at(-1).id;
 // Select duty from the sidebar, then replace its No destination.
 await env.ids['page-list'].querySelectorAll('button')[0].click();
 const selects=env.ids['choices-editor'].querySelectorAll('select');selects[1].value=target;await selects[1].fire('change');assert.equal(saved(env).nodes[0].choices[1].to,target);
 await env.input('page-title','Does a duty exist?');assert.equal(saved(env).nodes[0].id,'duty');await env.ids['refresh-preview'].click();assert.match(env.ids['preview-status'].textContent,/updated/);
});
test('new exercises clear negligence-specific content and export independently',async()=>{
 const env=boot();await env.ids['new-exercise'].click();await env.input('exercise-name','Contract formation');assert.equal(env.ids.filename.value,'contract-formation.html');
 const data=saved(env);assert.equal(data.nodes.length,3);assert.equal(data.references,'');assert.equal(data.scenario,'');assert.equal(data.start,'question');
 await env.ids['export-html'].click();const html=env.downloads[0].content;const embedded=JSON.parse(html.match(/id="exercise-data">([\s\S]*?)<\/script>/)[1]);assert.equal(embedded.title,'Contract formation');assert.equal(embedded.nodes[0].choices[0].to,'yes-result');
});
test('browser drafts are restored, including incomplete work',async()=>{
 const env=boot();await env.ids['add-choice'].click();const again=boot(env.storage);assert.equal(again.ids['choices-editor'].querySelectorAll('select').length,3);assert.match(again.ids['preview-status'].textContent,/paused/);assert.match(again.ids['save-status'].textContent,/restored/);
});
test('validation blocks loops and missing destinations; referenced pages cannot be deleted',async()=>{
 const env=boot();const select=env.ids['choices-editor'].querySelectorAll('select')[0];select.value='duty';await select.fire('change');await env.ids['export-html'].click();assert.equal(env.downloads.length,0);assert.match(text(env.ids.validation),/loops/);
 select.value='';await select.fire('change');await env.ids['refresh-preview'].click();assert.match(text(env.ids.validation),/destination/);
 const M=env.window.DecisionTreeModel;const data=M.copy(env.window.EXERCISE);assert.throws(()=>M.removePage(data,'damages'),/Other choices/);assert.throws(()=>M.removePage(data,'duty'),/starting page/);
});
test('Markdown and exported text cannot execute injected HTML or script URLs',()=>{
 const env=boot(),payload='</script><script>alert(1)</script> **safe** [unsafe](javascript:alert) [source](https://example.com)';
 const markdown=env.window.ExerciseMarkdown.render(payload);assert.equal(markdown.querySelectorAll('script').length,0);assert.equal(markdown.querySelectorAll('a').length,1);assert.match(text(markdown),/javascript:alert/);
 const data=env.window.DecisionTreeModel.copy(env.window.EXERCISE);data.nodes[0].body=payload;data.title='<img src=x onerror=alert(1)>';
 const html=env.window.ExerciseExport.build(data),embedded=html.match(/id="exercise-data">([\s\S]*?)<\/script>/)[1];assert.doesNotMatch(embedded,/<script|<img/);assert.equal(JSON.parse(embedded).nodes[0].body,payload);
});
test('invalid projects and unsuitable export names produce actionable messages',async()=>{
 const env=boot();assert.throws(()=>env.window.ExerciseExport.readProject('{"nodes":[]}'),/project JSON/);
 const project=JSON.parse(env.window.ExerciseExport.project(env.window.EXERCISE));project.exercise.nodes[0].choices[0].to=123;assert.throws(()=>env.window.ExerciseExport.readProject(JSON.stringify(project)),/Answer choices/);
 await env.input('filename','../wrong.html');await env.ids['export-html'].click();assert.equal(env.downloads.length,0);assert.match(env.ids['save-status'].textContent,/filename/);
});
test('generated template exactly matches the current student runtime and CSS',()=>{
 const env=boot(),t=env.window.STUDENT_TEMPLATE;assert.equal(t.css,['fonts.css','styles.css','theme.css'].map(f=>fs.readFileSync(path.join(root,'assets',f),'utf8')).join('\n'));
 assert.equal(t.js,['model.js','markdown.js','app.js'].map(f=>fs.readFileSync(path.join(root,'assets',f),'utf8')).join('\n'));
});
test('the standalone editor boots with its embedded assets and exports a student exercise',async()=>{
 const env=environment();const html=fs.readFileSync(path.join(root,'exercise-editor.html'),'utf8');const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);vm.runInContext(scripts[0][1],env.ctx);
 assert.equal(env.ids['page-title'].value,'Did the defendant owe the plaintiff a duty of care?');assert.match(env.ids.preview.srcdoc,/exercise-data/);
 let downloaded;env.window.ExerciseExport.download=(name,content)=>downloaded={name,content};await env.ids['export-html'].click();assert.equal(downloaded.name,'negligence.html');assert.match(downloaded.content,/scope of liability/);
});

