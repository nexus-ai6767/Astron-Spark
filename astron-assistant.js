(function(){
  'use strict';
  const root=document.getElementById('astron-site-assistant'); if(!root)return;
  const panel=document.getElementById('astron-assistant-panel'), launch=document.getElementById('astron-assistant-launch'), close=document.getElementById('astron-assistant-close');
  const messages=document.getElementById('astron-assistant-messages'), form=document.getElementById('astron-assistant-form'), input=document.getElementById('astron-assistant-input'), send=document.getElementById('astron-assistant-send'), suggestions=document.getElementById('astron-assistant-suggestions'), note=document.getElementById('astron-assistant-note');
  const voiceButton=document.getElementById('astron-assistant-voice'), micButton=document.getElementById('astron-assistant-mic');
  const API=(window.ASTRON_ASSISTANT_API||window.ASTRON_PAYMENT_API||'/api').replace(/\/$/,'');
  const speech=window.speechSynthesis||null;
  let voiceEnabled=false, hasWelcomed=false, recognition=null, listening=false;
  const welcomeText='Hello! I am the ASTRON website guide. Ask me about ASTRON, its features, getting started, or the information published on this website.';
  const knowledge=[
    {keys:['what is astron','about astron','tell me about astron','what does astron do'],answer:'ASTRON is presented on this website as a cinematic personal AI system focused on voice, vision, automation, memory and local intelligence. The site describes it as designed to run on your own machine.'},
    {keys:['feature','capabilities','what can it do','voice','vision','memory','automation'],answer:'The website highlights voice assistance, vision tools, automation, memory and local AI. Exact capabilities depend on the specific ASTRON build and its configured components. Explore the feature sections on this page for the published details.'},
    {keys:['get started','getting started','install','installation','how do i start','download'],answer:'Use the Get Started buttons and follow the instructions on the relevant ASTRON page. Before installing, check the published requirements and make sure you choose the correct package for your device.'},
    {keys:['price','pricing','cost','free','₹','rupee','payment'],answer:'Please check the pricing cards currently displayed on this website for the latest listed price and plan details. I won’t guess prices or payment terms that may have changed.'},
    {keys:['windows','pc','computer','requirements','hardware'],answer:'ASTRON is described as a personal AI system that can run on your machine. Check the relevant product section for current operating-system, hardware and installation requirements; these may differ by version.'},
    {keys:['contact','support','help','problem','issue','error'],answer:'I can help explain the website and its published information. For account, payment, download or technical issues, use the official contact or support information listed on this website.'},
    {keys:['privacy','data','local ai','offline','internet'],answer:'The website describes ASTRON as emphasizing local intelligence, but data handling and offline availability can vary by feature and configuration. Check the relevant product documentation for specifics.'}
  ];
  function addMessage(text,who,meta){const el=document.createElement('div');el.className='as-assistant-msg '+who;el.textContent=text;if(meta){const small=document.createElement('small');small.textContent=meta;el.appendChild(small)}messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el;}
  function chooseVoice(){
    if(!speech)return null;
    const voices=speech.getVoices?speech.getVoices():[];
    if(!voices.length)return null;
    const en=voices.filter(v=>/^en([-_]|$)/i.test(v.lang));
    const pool=en.length?en:voices;
    // Prefer common feminine English voice names across Edge, Chrome, macOS and Android.
    const female=pool.find(v=>/aria|jenny|zira|samantha|ava|susan|michelle|sonia|natasha|hazel|libby|maisie|serena|karen|moira|tessa|victoria|female|google us english/i.test(v.name));
    if(female)return female;
    // Fall back to a voice not explicitly labelled male, then any English voice available.
    const notExplicitlyMale=pool.find(v=>!/guy|david|mark|christopher|eric|brian|daniel|male|james|ryan|george/i.test(v.name));
    return notExplicitlyMale||pool.find(v=>/en-US/i.test(v.lang))||pool[0]||null;
  }
  function speak(text){if(!voiceEnabled||!speech||!text)return false;try{speech.cancel();const utterance=new SpeechSynthesisUtterance(String(text).slice(0,1800));utterance.lang='en-US';utterance.rate=1;utterance.pitch=1.08;utterance.volume=1;const voice=chooseVoice();if(voice){utterance.voice=voice;utterance.lang=voice.lang||'en-US';}utterance.onerror=()=>{note.textContent='Voice playback was blocked or unavailable in this browser. You can still read the replies here.';};speech.speak(utterance);return true;}catch(err){note.textContent='Voice playback is not available in this browser. Replies remain visible in chat.';return false;}}
  function open(){panel.hidden=false;launch.setAttribute('aria-expanded','true');input.focus({preventScroll:true});if(!hasWelcomed){hasWelcomed=true;if(voiceEnabled)speak(welcomeText);}}
  function shut(){panel.hidden=true;launch.setAttribute('aria-expanded','false');if(listening&&recognition){try{recognition.stop()}catch(_){}}launch.focus({preventScroll:true});}
  launch.addEventListener('click',()=>panel.hidden?open():shut());close.addEventListener('click',shut);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)shut()});
  voiceButton.addEventListener('click',()=>{voiceEnabled=!voiceEnabled;voiceButton.textContent=voiceEnabled?'Voice on':'Voice off';voiceButton.setAttribute('aria-pressed',String(voiceEnabled));if(!voiceEnabled&&speech)speech.cancel();else speak('Voice replies are now on.');});
  function localAnswer(q){const text=q.toLowerCase();let best=null,score=0;for(const item of knowledge){const n=item.keys.reduce((sum,k)=>sum+(text.includes(k)?Math.max(1,k.length/8):0),0);if(n>score){score=n;best=item}}if(best)return best.answer;return 'I don’t have a verified answer to that specific question in the published website information yet. I can explain ASTRON’s listed features, getting started, or published pricing. For a more flexible answer, the site owner can configure the secure live-AI backend.';}
  async function ask(question){const q=question.trim();if(!q||send.disabled)return;addMessage(q,'user');input.value='';send.disabled=true;send.textContent='…';const waiting=addMessage('Checking ASTRON information…','bot');let answer,meta='Website guide';try{const response=await fetch(API+'/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q})});if(!response.ok)throw new Error('Assistant API unavailable');const data=await response.json();if(typeof data.answer!=='string'||!data.answer.trim())throw new Error('Empty response');answer=data.answer.trim();meta=data.mode==='ai'?'AI response':'Website guide';if(data.mode==='ai')note.textContent='Live AI connected. Spoken replies are enabled.';}catch(_){answer=localAnswer(q);meta='Website information';note.textContent='Guided website mode. Live AI replies require the server API and AI credentials to be configured.';}waiting.remove();addMessage(answer,'bot',meta);if(voiceEnabled)speak(answer);send.disabled=false;send.textContent='Send';input.focus({preventScroll:true});}
  form.addEventListener('submit',e=>{e.preventDefault();ask(input.value)});
  suggestions.addEventListener('click',e=>{const b=e.target.closest('button');if(b)ask(b.textContent)});
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(SpeechRecognition){recognition=new SpeechRecognition();recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=1;recognition.onstart=()=>{listening=true;micButton.classList.add('listening');micButton.setAttribute('aria-label','Listening — tap to stop');note.textContent='Listening… speak your question clearly.';};recognition.onresult=e=>{const transcript=e.results&&e.results[0]&&e.results[0][0]?e.results[0][0].transcript:'';if(transcript){input.value=transcript;ask(transcript);}};recognition.onerror=e=>{note.textContent=e.error==='not-allowed'?'Microphone permission was denied. Allow microphone access in your browser to ask by voice.':'Voice input could not start. You can type your question instead.';};recognition.onend=()=>{listening=false;micButton.classList.remove('listening');micButton.setAttribute('aria-label','Ask by voice');};micButton.addEventListener('click',()=>{if(listening){try{recognition.stop()}catch(_){}return;}try{recognition.start();}catch(_){note.textContent='Voice input is already starting. Please try again in a moment.';}});}else{micButton.disabled=true;micButton.title='Voice input is not supported in this browser';micButton.setAttribute('aria-label','Voice input not supported');}
  if(!speech){voiceButton.textContent='Voice n/a';voiceButton.setAttribute('aria-pressed','false');voiceButton.title='Speech synthesis is not supported in this browser';voiceEnabled=false;}
})();
