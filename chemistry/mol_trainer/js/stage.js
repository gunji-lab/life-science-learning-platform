const params=new URLSearchParams(location.search);
const requestedStage=Number(params.get('stage'));
const stageId=Number.isInteger(requestedStage)&&requestedStage>=0&&requestedStage<=6?requestedStage:0;
const stage=window.MOL_STAGES.find(s=>s.id===stageId);
const bank=window.MOL_QUESTION_BANKS[stage.key];
const QUESTION_COUNT=5;
const PASS_COUNT=4;
let questions=[];
let index=0;
let score=0;
let answered=false;
let stageStartedAt=Date.now();
const $=id=>document.getElementById(id);
$('stage-label').textContent=stage.label;
$('stage-title').textContent=stage.title;
document.title=`${stage.label} ${stage.title}｜mol Trainer`;

function shuffle(arr){
  const copied=[...arr];
  for(let i=copied.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copied[i],copied[j]]=[copied[j],copied[i]];
  }
  return copied;
}

function start(){
  questions=shuffle(bank).slice(0,QUESTION_COUNT);
  index=0; score=0; answered=false;
  stageStartedAt=Date.now();
  $('question-area').classList.remove('hidden');
  $('result-area').classList.add('hidden');
  render();
}

function render(){
  answered=false;
  const item=questions[index];
  $('counter').textContent=`${index+1} / ${QUESTION_COUNT}`;
  $('progress-bar').style.width=`${(index/QUESTION_COUNT)*100}%`;
  $('question-label').textContent=`QUESTION ${index+1}`;
  $('feedback').textContent='';
  $('feedback').className='feedback';
  $('explanation').style.display='none';
  $('next-button').classList.add('hidden');
  $('choices').innerHTML='';

  if(item.type==='threeStepAll'){
    renderThreeStep(item);
    return;
  }

  $('question-text').innerHTML=item.q;
  let selectedIndex=null;
  let selectedButton=null;
  item.c.forEach((choice,ci)=>{
    const btn=document.createElement('button');
    btn.className='choice-button';
    btn.type='button';
    btn.textContent=choice;
    btn.addEventListener('click',()=>{
      if(answered)return;
      selectedIndex=ci;
      if(selectedButton)selectedButton.classList.remove('selected');
      selectedButton=btn;
      btn.classList.add('selected');
      $('feedback').textContent='';
      $('feedback').className='feedback';
    });
    $('choices').appendChild(btn);
  });

  const action=document.createElement('div');
  action.className='single-step-action';
  const answerButton=document.createElement('button');
  answerButton.type='button';
  answerButton.className='primary-button small-action-button';
  answerButton.textContent='答える';
  answerButton.addEventListener('click',()=>{
    if(selectedIndex===null){
      $('feedback').className='feedback bad';
      $('feedback').textContent='答えを1つ選んでください。';
      return;
    }
    answerSingle(selectedIndex,selectedButton,item);
    answerButton.disabled=true;
  });
  action.appendChild(answerButton);
  $('choices').appendChild(action);
}

function answerSingle(choiceIndex,clicked,item){
  if(answered)return;
  answered=true;
  [...$('choices').children].forEach((btn,ci)=>{
    btn.disabled=true;
    if(ci===item.a)btn.classList.add('correct');
  });
  const correct=choiceIndex===item.a;
  if(correct){score++;$('feedback').className='feedback good';$('feedback').textContent='正解！';}
  else{clicked.classList.add('wrong');$('feedback').className='feedback bad';$('feedback').textContent='惜しい！ 正解を確認しましょう。';}
  $('explanation').textContent=item.e;
  $('explanation').style.display='block';
  showNextButton();
}

function renderThreeStep(item){
  $('question-text').innerHTML=`<div class="multi-question-intro">${item.intro}</div>`;
  const wrap=document.createElement('div');
  wrap.className='multi-step-list';
  const completed=new Array(item.steps.length).fill(false);
  const correctFlags=new Array(item.steps.length).fill(false);

  item.steps.forEach((step,si)=>{
    const card=document.createElement('section');
    card.className='multi-step-card';
    const q=document.createElement('div');
    q.className='subquestion';
    q.textContent=step.q;
    card.appendChild(q);

    const list=document.createElement('div');
    list.className='multi-choice-list';
    step.c.forEach((choice,ci)=>{
      const label=document.createElement('label');
      label.className='multi-choice';
      label.innerHTML=`<input type="radio" name="step-${si}" value="${ci}"><span>${choice}</span>`;
      list.appendChild(label);
    });
    card.appendChild(list);

    const action=document.createElement('div');
    action.className='single-step-action';
    const button=document.createElement('button');
    button.type='button';
    button.className='primary-button small-action-button';
    button.textContent='答える';
    action.appendChild(button);
    card.appendChild(action);

    const feedback=document.createElement('div');
    feedback.className='single-step-feedback';
    card.appendChild(feedback);

    button.addEventListener('click',()=>{
      if(completed[si])return;
      const selected=card.querySelector(`input[name="step-${si}"]:checked`);
      if(!selected){
        feedback.className='single-step-feedback bad';
        feedback.textContent='答えを1つ選んでください。';
        return;
      }
      const chosen=Number(selected.value);
      const labels=[...card.querySelectorAll('.multi-choice')];
      labels.forEach((label,ci)=>{
        label.querySelector('input').disabled=true;
        if(ci===step.a)label.classList.add('correct');
        if(ci===chosen && ci!==step.a)label.classList.add('wrong');
      });
      completed[si]=true;
      correctFlags[si]=chosen===step.a;
      button.disabled=true;
      feedback.className=`single-step-feedback ${correctFlags[si]?'good':'bad'}`;
      feedback.innerHTML=`<strong>${correctFlags[si]?'正解！':'正解を確認しましょう。'}</strong><div class="step-explanation">${step.e}</div>`;

      if(completed.every(Boolean)){
        answered=true;
        if(correctFlags.every(Boolean))score++;
        const final=document.createElement('div');
        final.className='final-dilution-explanation';
        final.textContent=item.finalSummary || `${item.stockC} mol/Lの溶液${item.stockMl} mLに水${item.waterMl} mLを加えると、${item.targetC.toFixed(2)} mol/Lの溶液${item.targetMl} mLが完成します。`;
        wrap.appendChild(final);
        showNextButton();
      }
    });

    wrap.appendChild(card);
  });
  $('choices').appendChild(wrap);
}

function showNextButton(){
  $('next-button').textContent=index===QUESTION_COUNT-1?'結果を見る':'次の問題へ';
  $('next-button').classList.remove('hidden');
}

function scrollToPageTop(){
  window.scrollTo({top:0,behavior:'smooth'});
}

$('next-button').addEventListener('click',()=>{
  if(index<QUESTION_COUNT-1){index++;render();scrollToPageTop();}
  else{showResult();scrollToPageTop();}
});

function showResult(){
  $('progress-bar').style.width='100%';
  $('counter').textContent=`${QUESTION_COUNT} / ${QUESTION_COUNT}`;
  $('question-area').classList.add('hidden');
  $('result-area').classList.remove('hidden');
  const passed=score>=PASS_COUNT;
  $('result-title').textContent=passed?'クリア！':'あと一歩！';
  $('score-circle').textContent=`${score} / ${QUESTION_COUNT}`;
  $('result-message').textContent=['solutionPrep','dilution'].includes(stage.key)
    ?(passed?'段階を追って実践問題を解けました。':'各設問の解説を確認し、単位変換から最終結果までの流れを復習しましょう。')
    :(passed?'クリアです。次のトレーニングへ進みましょう。':'4問正解でクリアです。もう一度挑戦してみましょう。');
  const next=$('next-stage-link');
  if(stageId<6){next.href=`stage.html?stage=${stageId+1}`;next.textContent='次へ';next.classList.remove('hidden');}
  else{next.href='index.html';next.textContent='一覧へ';}
  localStorage.setItem(`molStage${stageId}Best`,Math.max(score,Number(localStorage.getItem(`molStage${stageId}Best`)||0)));
  if(window.MolTracker){
    window.MolTracker.track('stage_result',{
      stageId,
      stageTitle:stage.title,
      score,
      questionCount:QUESTION_COUNT,
      passCount:PASS_COUNT,
      passed,
      elapsed:Math.round((Date.now()-stageStartedAt)/1000)
    });
  }
}

$('retry-button').addEventListener('click',start);
start();
