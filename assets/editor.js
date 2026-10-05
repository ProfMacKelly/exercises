'use strict';
(function(){
  const M=window.DecisionTreeModel,E=window.ExerciseExport,$=id=>document.getElementById(id);
  const storageKey='studies-de-jure-editor-draft-v1';
  let data=M.copy(window.EXERCISE),selected=data.start,filename=M.slug(data.title)+'.html',dirty=false;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  const current=()=>data.nodes.find(n=>n.id===selected)||data.nodes[0];
  function status(text){$('save-status').textContent=text;}
  function save(){
    dirty=true;$('preview-status').textContent='Preview needs refreshing to show your latest edits.';
    try{localStorage.setItem(storageKey,JSON.stringify({exercise:data,selected,filename}));status('Draft saved in this browser. Use Save project for a portable backup.');}
    catch{status('Browser draft storage is unavailable. Use Save project to keep your work.');}
  }
  function fillDestinations(select,value,blank=false){select.replaceChildren();if(blank){const option=make('option','Choose a page…');option.value='';select.append(option);}for(const n of data.nodes){const option=make('option',n.title||'Untitled page');option.value=n.id;select.append(option);}select.value=value;}
  function list(){
    $('page-list').replaceChildren();for(const n of data.nodes){const b=make('button'),title=make('span',n.title||'Untitled page');b.className='page-select';b.type='button';b.setAttribute('aria-pressed',String(n.id===selected));b.append(title,make('small',`${n.id===data.start?'Start · ':''}${n.type?'Outcome':`${n.choices.length} choices`}`));b.addEventListener('click',()=>{selected=n.id;renderPage();list();});$('page-list').append(b);}
    fillDestinations($('start-page'),data.start);
  }
  function settings(){
    for(const [id,key] of Object.entries({'exercise-name':'title',subject:'subject',intro:'intro',scenario:'scenario',scope:'scope',references:'references'}))$(id).value=data[key]||'';
    $('filename').value=filename;fillDestinations($('start-page'),data.start);
  }
  function textField(container,label,value,callback,placeholder){
    const l=make('label',label),input=make('input');input.value=value||'';if(placeholder)input.placeholder=placeholder;input.addEventListener('input',()=>{callback(input.value);save();});l.append(input);container.append(l);return input;
  }
  function renderChoices(){
    const n=current();$('choices-editor').replaceChildren();$('add-choice').disabled=Boolean(n.type);$('outcome-help').hidden=!n.type;
    if(n.type)return;
    n.choices.forEach((choice,index)=>{
      const card=make('div');card.className='choice-editor';card.append(make('strong',`Choice ${index+1}`));
      textField(card,'Answer text',choice.label,v=>choice.label=v,'Yes — a duty exists');
      const grid=make('div');grid.className='settings-grid';
      const label=make('label','Destination page'),select=make('select');fillDestinations(select,choice.to,true);select.addEventListener('change',()=>{choice.to=select.value;save();});label.append(select);grid.append(label);
      textField(grid,'Short arrow label (optional)',choice.edge,v=>choice.edge=v,'Yes');card.append(grid);
      const actions=make('div');actions.className='choice-actions';
      const up=make('button','Move up'),remove=make('button','Remove choice');up.type=remove.type='button';up.disabled=index===0;
      up.addEventListener('click',()=>{[n.choices[index-1],n.choices[index]]=[n.choices[index],n.choices[index-1]];renderChoices();save();});
      remove.addEventListener('click',()=>{n.choices.splice(index,1);renderChoices();list();save();});actions.append(up,remove);card.append(actions);$('choices-editor').append(card);
    });
  }
  function renderPage(){
    const n=current();selected=n.id;$('editing-heading').textContent='Edit page';
    for(const [id,key] of Object.entries({'page-title':'title','page-label':'label','page-category':'category','page-body':'body','page-prompt':'prompt','page-example':'example'}))$(id).value=n[key]||'';
    $('page-type').value=n.type||'';renderChoices();
  }
  function report(){
    const result=M.inspect(data);$('validation').replaceChildren();
    for(const [key,heading,className] of [['errors','Fix these before previewing or exporting:','error'],['warnings','Check these pages:','warning']]){
      if(!result[key].length)continue;const box=make('div');box.className=className;box.append(make('strong',heading));const ul=make('ul');for(const message of result[key])ul.append(make('li',message));box.append(ul);$('validation').append(box);
    }
    return result;
  }
  function preview(){
    const r=report();if(r.errors.length){$('preview').removeAttribute('srcdoc');$('preview-status').textContent='Preview paused until the listed issues are fixed.';return;}
    try{$('preview').srcdoc=E.build(data);dirty=false;$('preview-status').textContent='Preview updated. Try the choices and diagram below.';}catch(err){status(err.message);}
  }
  for(const [id,key] of Object.entries({'exercise-name':'title',subject:'subject',intro:'intro',scenario:'scenario',scope:'scope',references:'references'}))$(id).addEventListener('input',()=>{
    const oldSlug=M.slug(data.title)+'.html';data[key]=$(id).value;
    if(key==='title'&&filename===oldSlug){filename=M.slug(data.title)+'.html';$('filename').value=filename;}
    save();
  });
  $('filename').addEventListener('input',()=>{filename=$('filename').value;save();});
  $('start-page').addEventListener('change',()=>{data.start=$('start-page').value;list();save();});
  for(const [id,key] of Object.entries({'page-title':'title','page-label':'label','page-category':'category','page-body':'body','page-prompt':'prompt','page-example':'example'}))$(id).addEventListener('input',()=>{current()[key]=$(id).value;if(key==='title')list();save();});
  // Refresh destination names after the title field loses focus, preserving its caret while typing.
  $('page-title').addEventListener('change',renderChoices);
  $('page-type').addEventListener('change',()=>{
    const n=current(),type=$('page-type').value;
    if(type&&n.choices.length&&!window.confirm('Changing to an outcome removes this page’s answer choices. Continue?')){$('page-type').value=n.type||'';return;}
    if(type){n.type=type;n.choices=[];}else delete n.type;renderChoices();list();save();
  });
  $('page-form').addEventListener('submit',e=>e.preventDefault());
  $('add-choice').addEventListener('click',()=>{const n=current();if(n.type)return;if(n.choices.length>=12){status('Use at most 12 choices per page.');return;}n.choices.push({label:'',to:'',edge:''});renderChoices();list();save();});
  $('add-page').addEventListener('click',()=>{if(data.nodes.length>=100){status('This editor supports up to 100 pages.');return;}const n=M.newPage(data);selected=n.id;list();renderPage();save();$('page-title').focus();});
  $('delete-page').addEventListener('click',()=>{
    try{const n=current();if(!window.confirm(`Delete “${n.title}”?`))return;M.removePage(data,n.id);selected=data.start;list();renderPage();save();}catch(err){status(err.message);}
  });
  $('refresh-preview').addEventListener('click',preview);
  $('save-project').addEventListener('click',()=>{E.download(M.slug(data.title)+'-project.json',E.project(data),'application/json');status('Project backup downloaded. Use Open project to edit it again.');});
  $('export-html').addEventListener('click',()=>{
    if(report().errors.length){status('Fix the listed issues before exporting.');return;}
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.html$/.test(filename)){status('Use a filename such as negligence.html: letters, numbers, hyphens, or underscores.');$('filename').focus();return;}
    try{E.download(filename,E.build(data),'text/html;charset=utf-8');status(`Downloaded ${filename}. Upload it to GitHub to publish; save a project backup for later editing.`);}catch(err){status(err.message);}
  });
  $('open-project').addEventListener('change',async()=>{
    const file=$('open-project').files[0];if(!file)return;
    try{if(file.size>5*1024*1024)throw new Error('Choose a project file smaller than 5 MB.');const imported=E.readProject(await file.text());
      if(!window.confirm('Open this project in place of the current draft? Save project first if you need a backup.'))return;
      data=imported;selected=data.nodes.some(n=>n.id===data.start)?data.start:data.nodes[0].id;filename=M.slug(data.title)+'.html';settings();list();renderPage();save();preview();
    }catch(err){status(`Cannot open project: ${err.message}`);}finally{$('open-project').value='';}
  });
  $('new-exercise').addEventListener('click',()=>{
    if(!window.confirm('Start a new exercise? Save project first to keep a portable copy of your current work.'))return;
    data={title:'New exercise',subject:'',intro:'Follow the questions and explain your reasoning.',scenario:'',scope:'A teaching exercise. Apply the relevant rules and exceptions.',references:'',start:'question',nodes:[
      {id:'question',title:'Your first question',label:'First question',body:'Write your explanation here.',choices:[{label:'Yes',edge:'Yes',to:'yes-result'},{label:'No',edge:'No',to:'no-result'}]},
      {id:'yes-result',title:'Yes outcome',label:'Yes outcome',type:'result',body:'Explain what follows from a yes answer.',choices:[]},
      {id:'no-result',title:'No outcome',label:'No outcome',type:'result',body:'Explain what follows from a no answer.',choices:[]}]};
    selected=data.start;filename='new-exercise.html';settings();list();renderPage();save();preview();
  });
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved){data=E.draft(saved.exercise);selected=data.nodes.some(n=>n.id===saved.selected)?saved.selected:data.nodes[0].id;filename=typeof saved.filename==='string'?saved.filename:M.slug(data.title)+'.html';status('Your previous browser draft has been restored.');}else status('Negligence example loaded. Edit a page or start a new exercise.');}
  catch{status('Negligence example loaded. Browser draft could not be restored; use Open project if you have a backup.');}
  settings();list();renderPage();preview();
})();
