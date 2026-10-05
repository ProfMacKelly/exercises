'use strict';
(function(){
  const M=window.DecisionTreeModel;
  function build(data){
    const ready=M.prepare(data),template=window.STUDENT_TEMPLATE;
    if(!template)throw new Error('The export template is missing. Check that all assets were uploaded.');
    const boot='window.EXERCISE = JSON.parse(document.getElementById("exercise-data").textContent);\n';
    const runtime=`<script type="application/json" id="exercise-data">${M.inlineScriptJSON(ready)}</script><script>${boot+template.js.replace(/<\/script/gi,'<\\/script')}</script>`;
    return template.shell.replace('<!--EXERCISE_STYLE-->',`<style>${template.css}</style>`).replace('<!--EXERCISE_RUNTIME-->',()=>runtime);
  }
  function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  function project(data){return JSON.stringify({format:'decision-tree-project',version:1,exercise:data},null,2);}
  function readProject(text){const value=JSON.parse(text);if(value.format!=='decision-tree-project'||value.version!==1||!value.exercise)throw new Error('Choose a project JSON file saved by this editor.');return draft(value.exercise);}
  function draft(data){
    // Accept incomplete drafts, but reject malformed file shapes before UI use.
    if(!data||typeof data.title!=='string'||!Array.isArray(data.nodes)||!data.nodes.length||data.nodes.length>100)throw new Error('This project does not contain a usable exercise.');
    const clone=M.copy(data),ids=new Set();
    for(const n of clone.nodes){if(!n||typeof n.id!=='string'||!/^[a-z0-9-]+$/.test(n.id)||ids.has(n.id)||!Array.isArray(n.choices)||n.choices.length>12)throw new Error('This project has malformed pages.');ids.add(n.id);
      for(const k of ['title','label','body','category','prompt','example'])if(n[k]!==undefined&&typeof n[k]!=='string')throw new Error('Page fields must contain text.');
      if(n.type&&!['success','failure','result'].includes(n.type))throw new Error('Unrecognized outcome type.');
      for(const c of n.choices)if(!c||typeof c.label!=='string'||typeof c.to!=='string'||(c.edge!==undefined&&typeof c.edge!=='string'))throw new Error('Answer choices must contain text and a destination.');
    }
    for(const k of ['scenario','subject','intro','scope','references'])if(clone[k]!==undefined&&typeof clone[k]!=='string')throw new Error('Exercise fields must contain text.');
    if(typeof clone.start!=='string')throw new Error('A project needs a starting-page identifier.');return clone;
  }
  window.ExerciseExport={build,download,project,readProject,draft};
})();
