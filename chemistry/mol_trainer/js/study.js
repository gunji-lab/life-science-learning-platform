const questions = [
  {q:'molは、何を表す単位ですか。',choices:['粒子の個数','物質の重さ','物質の体積','物質の温度'],answer:0,explanation:'molは、原子や分子などの粒子をまとめて数えるための単位です。'},
  {q:'原子量を H＝1、O＝16 とすると、水 H₂O のモル質量は何 g/mol ですか。',choices:['16 g/mol','17 g/mol','18 g/mol','32 g/mol'],answer:2,explanation:'H₂Oは、水素2個と酸素1個からできています。1×2＋16＝18 g/molです。'},
  {q:'水のモル質量が18 g/molのとき、水36 gは何 molですか。',choices:['0.5 mol','1 mol','2 mol','18 mol'],answer:2,explanation:'物質量＝質量÷モル質量なので、36÷18＝2 molです。'}
];
let completed=0;
let studyScore=0;
const studyStartedAt=Date.now();
const root=document.getElementById('study-questions');
function showStep(step){document.querySelectorAll('.study-step').forEach(section=>section.classList.toggle('hidden',Number(section.dataset.step)!==step));const label=document.getElementById('note-step-label');if(label)label.textContent=`Study Notes ${step} / 5`;window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-next-step]').forEach(button=>button.addEventListener('click',()=>showStep(Number(button.dataset.nextStep))));
questions.forEach((item,qi)=>{const wrap=document.createElement('div');wrap.className='check-question';wrap.innerHTML=`<h3>問${qi+1}　${item.q}</h3><div class="choice-list"></div><div class="feedback" aria-live="polite"></div>`;const list=wrap.querySelector('.choice-list');const feedback=wrap.querySelector('.feedback');item.choices.forEach((choice,ci)=>{const btn=document.createElement('button');btn.className='choice-button';btn.type='button';btn.textContent=choice;btn.addEventListener('click',()=>{if(wrap.dataset.done)return;wrap.dataset.done='1';[...list.children].forEach((button,index)=>{button.disabled=true;if(index===item.answer)button.classList.add('correct');});if(ci===item.answer){studyScore+=1;feedback.className='feedback good';feedback.textContent=`正解！ ${item.explanation}`;}else{btn.classList.add('wrong');feedback.className='feedback bad';feedback.textContent=`惜しい。${item.explanation}`;}completed+=1;if(completed===questions.length){document.getElementById('study-complete').classList.remove('hidden');if(window.MolTracker){window.MolTracker.track('study_check_complete',{score:studyScore,questionCount:questions.length,elapsed:Math.round((Date.now()-studyStartedAt)/1000)});}}});list.appendChild(btn);});root.appendChild(wrap);});
