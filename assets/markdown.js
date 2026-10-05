'use strict';
// Deliberately small Markdown subset, built with DOM nodes, never raw HTML.
(function () {
  function inline(parent,text,level=0){
    if(level>5){parent.append(document.createTextNode(text));return;}
    const re=/\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^\s)]+)\)/g;
    let match,last=0;
    while((match=re.exec(text))){parent.append(document.createTextNode(text.slice(last,match.index)));let el;
      if(match[1]){el=document.createElement('strong');inline(el,match[1],level+1);}
      else if(match[2]){el=document.createElement('em');inline(el,match[2],level+1);}
      else if(match[3]){el=document.createElement('code');el.textContent=match[3];}
      else if(/^(https?:\/\/|mailto:)/i.test(match[5])){el=document.createElement('a');el.href=match[5];el.textContent=match[4];el.rel='noopener noreferrer';}
      else{el=document.createTextNode(match[0]);}
      parent.append(el);last=re.lastIndex;
    }
    parent.append(document.createTextNode(text.slice(last)));
  }
  function render(text){
    const container=document.createElement('div');container.className='markdown';
    const lines=String(text||'').replace(/\r\n?/g,'\n').split('\n');let i=0;
    const special=line=>/^(#{1,3}\s|[-*]\s|\d+\.\s|>\s|```)/.test(line);
    while(i<lines.length){let line=lines[i];if(!line.trim()){i++;continue;}
      if(line.startsWith('```')){const pre=document.createElement('pre'),code=document.createElement('code'),block=[];i++;while(i<lines.length&&!lines[i].startsWith('```'))block.push(lines[i++]);i++;code.textContent=block.join('\n');pre.append(code);container.append(pre);continue;}
      const heading=/^(#{1,3})\s+(.*)$/.exec(line);
      if(heading){const el=document.createElement(`h${heading[1].length+2}`);inline(el,heading[2]);container.append(el);i++;continue;}
      const list=/^([-*]|\d+\.)\s+(.*)$/.exec(line);
      if(list){const ordered=/\d/.test(list[1]),el=document.createElement(ordered?'ol':'ul');while(i<lines.length){const m=/^([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);if(!m||/\d/.test(m[1])!==ordered)break;const li=document.createElement('li');inline(li,m[2]);el.append(li);i++;}container.append(el);continue;}
      if(line.startsWith('> ')){const el=document.createElement('blockquote');inline(el,line.slice(2));container.append(el);i++;continue;}
      const paragraph=[line];i++;while(i<lines.length&&lines[i].trim()&&!special(lines[i]))paragraph.push(lines[i++]);const el=document.createElement('p');inline(el,paragraph.join(' '));container.append(el);
    }
    return container;
  }
  window.ExerciseMarkdown={render};
})();
