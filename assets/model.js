'use strict';
(function () {
  const copy = data => JSON.parse(JSON.stringify(data));
  function inspect(data) {
    const errors=[],warnings=[];
    if(!data || !Array.isArray(data.nodes) || !data.nodes.length)return {errors:['Add at least one page.'],warnings};
    if(data.nodes.length>100)return {errors:['This editor supports up to 100 pages per exercise.'],warnings};
    if(typeof data.title!=='string'||!data.title.trim())errors.push('Enter an exercise title.');
    const ids=new Map();
    for(const n of data.nodes){
      if(!n || typeof n!=='object'){errors.push('Each page must be an object.');continue;}
      const name=typeof n.title==='string' && n.title.trim() ? n.title : n.id || 'Untitled page';
      if(typeof n.id!=='string'||!/^[a-z0-9-]+$/.test(n.id)||ids.has(n.id))errors.push('Page identifiers must be unique lowercase names.');
      ids.set(n.id,n);
      if(typeof n.title!=='string'||!n.title.trim())errors.push(`${name}: enter a page title.`);
      if(typeof n.label!=='string'||!n.label.trim())errors.push(`${name}: enter a diagram label.`);
      for(const key of ['title','label','body','category','prompt','example'])if(n[key]!==undefined && (typeof n[key]!=='string'||n[key].length>50000))errors.push(`${name}: ${key} must be text of at most 50,000 characters.`);
      if(!Array.isArray(n.choices))errors.push(`${name}: choices must be a list.`);
      else if(n.choices.length>12)errors.push(`${name}: use at most 12 answer choices.`);
      else for(const c of n.choices)if(!c || typeof c.label!=='string'||!c.label.trim())errors.push(`${name}: enter text for every answer choice.`);
      if(n.type && !['success','failure','result'].includes(n.type))errors.push(`${name}: unrecognized page type.`);
      if(n.type && Array.isArray(n.choices) && n.choices.length)errors.push(`${name}: an outcome page cannot have answer choices.`);
      if(!n.type && Array.isArray(n.choices) && !n.choices.length)errors.push(`${name}: add an answer choice or change this page to an outcome.`);
    }
    for(const key of ['scenario','subject','intro','scope','references'])if(data[key]!==undefined && (typeof data[key]!=='string'||data[key].length>50000))errors.push(`${key} must be text of at most 50,000 characters.`);
    if(!ids.has(data.start))errors.push('Choose a starting page.');
    for(const n of data.nodes)for(const c of Array.isArray(n?.choices)?n.choices:[])if(!ids.has(c?.to))errors.push(`${n.title||n.id}: choose a destination for every answer.`);
    if(errors.length)return {errors:[...new Set(errors)],warnings};
    const visiting=new Set(),visited=new Set();let cycle=false;
    function walk(id){if(visiting.has(id)){cycle=true;return;}if(visited.has(id))return;visiting.add(id);for(const c of ids.get(id).choices)walk(c.to);visiting.delete(id);visited.add(id);}
    walk(data.start);
    if(cycle)errors.push('A branch loops back to an earlier page. Use Back/Restart for revisiting pages; this editor requires branches to move forward.');
    for(const n of data.nodes)if(!visited.has(n.id))warnings.push(`“${n.title}” is not reachable from the starting page; it remains available from the diagram.`);
    // Check disconnected components for cycles too.
    for(const n of data.nodes)walk(n.id);
    if(cycle && !errors.length)errors.push('A disconnected group of pages contains a loop. Remove the loop before previewing.');
    return {errors,warnings};
  }
  function layout(data){
    const result=copy(data),byId=new Map(result.nodes.map(n=>[n.id,n]));
    const incoming=new Map(result.nodes.map(n=>[n.id,0])),depth=new Map(result.nodes.map(n=>[n.id,0]));
    for(const n of result.nodes)for(const c of n.choices)incoming.set(c.to,incoming.get(c.to)+1);
    const ready=result.nodes.filter(n=>incoming.get(n.id)===0).map(n=>n.id);let count=0;
    while(ready.length){const id=ready.shift(),n=byId.get(id);count++;for(const c of n.choices){depth.set(c.to,Math.max(depth.get(c.to),depth.get(id)+1));incoming.set(c.to,incoming.get(c.to)-1);if(incoming.get(c.to)===0)ready.push(c.to);}}
    if(count!==result.nodes.length)throw new Error('Branches must not contain a loop.');
    const rows=new Map();for(const n of result.nodes){n.row=depth.get(n.id);if(!rows.has(n.row))rows.set(n.row,[]);rows.get(n.row).push(n);}
    for(const pages of rows.values()){pages.sort((a,b)=>Number(Boolean(a.type))-Number(Boolean(b.type)));pages.forEach((n,i)=>n.column=i);}
    return result;
  }
  function prepare(data){const report=inspect(data);if(report.errors.length)throw new Error(report.errors.join('\n'));return layout(data);}
  function newPage(data){let i=1;while(data.nodes.some(n=>n.id===`page-${i}`))i++;const n={id:`page-${i}`,title:'New page',label:'New page',type:'result',body:'',category:'',prompt:'',example:'',choices:[]};data.nodes.push(n);return n;}
  function removePage(data,id){if(data.nodes.length===1)throw new Error('Keep at least one page.');if(data.nodes.some(n=>n.choices.some(c=>c.to===id)))throw new Error('Other choices lead to this page. Change those destinations before deleting it.');if(data.start===id)throw new Error('Choose another starting page before deleting this one.');data.nodes=data.nodes.filter(n=>n.id!==id);}
  function slug(value){return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'exercise';}
  function inlineScriptJSON(value){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
  window.DecisionTreeModel={inspect,prepare,layout,newPage,removePage,copy,slug,inlineScriptJSON};
})();
