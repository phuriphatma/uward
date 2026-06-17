(function(){
const STORAGE_KEY='wardManagerData';
const WARD_WIDTH_KEY='wardSidebarWidth'; // renamed to avoid redeclare
const PROFILES_KEY='wardManagerProfiles-v1';
let data={wards:[]},selectedWardId=null,selectedBedId=null,dragSrcId=null,bedDragSrcId=null;
const STATUS_FILTER_KEY='wardStatusFilter-v1';
const WARDLIST_ONLY_BEDS_KEY='wardListOnlyBeds-v1';
// guard to prevent accidental bed open when clicking near "+ Add Bed"
let suppressBedClickUntil=0;

// Profiles store shape: { current: string, map: { [id]: { id, name, data } } }
let profileStore={ current: null, map:{} };
let currentProfileId=null;
function deepClone(o){ return JSON.parse(JSON.stringify(o||{})); }
function getCurrentStatusFilter(){
  const v=localStorage.getItem(STATUS_FILTER_KEY)||'both';
  return (v==='active'||v==='discharge')? v : 'both';
}
function getWardListOnlyBeds(){
  try{ return JSON.parse(localStorage.getItem(WARDLIST_ONLY_BEDS_KEY)||'false'); }catch{ return false; }
}
function setWardListOnlyBeds(val){
  try{ localStorage.setItem(WARDLIST_ONLY_BEDS_KEY, JSON.stringify(!!val)); }catch{}
}
function saveProfiles(){
  if(!currentProfileId){ return; }
  // persist current working data into store before saving
  if(profileStore.map[currentProfileId]){
    profileStore.map[currentProfileId].data = deepClone(data);
  }
  try{ localStorage.setItem(PROFILES_KEY, JSON.stringify(profileStore)); }catch{}
  // keep legacy key for compatibility (exports etc.)
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }catch{}
}
function loadProfiles(){
  const raw=localStorage.getItem(PROFILES_KEY);
  if(raw){
    try{ profileStore = JSON.parse(raw)||{current:null,map:{}}; }catch{ profileStore={current:null,map:{}}; }
  }
  if(!profileStore || !profileStore.current || !profileStore.map || Object.keys(profileStore.map).length===0){
    // seed from legacy STORAGE_KEY if present
    let legacy={wards:[]};
    try{ const js=localStorage.getItem(STORAGE_KEY); if(js) legacy=JSON.parse(js)||{wards:[]}; }catch{}
    const pid='p'+Date.now();
    profileStore={ current: pid, map: { } };
    profileStore.map[pid]={ id: pid, name: 'Default', data: deepClone(legacy) };
  }
  currentProfileId = profileStore.current;
  const cur = profileStore.map[currentProfileId];
  data = deepClone(cur?.data)||{wards:[]};
}
function switchProfile(pid){
  if(pid===currentProfileId) return;
  // save current first
  saveProfiles();
  // switch
  currentProfileId = pid;
  profileStore.current = pid;
  const cur=profileStore.map[pid];
  data = deepClone(cur?.data)||{wards:[]};
  selectedWardId=null; selectedBedId=null;
  refreshProfileUI();
  renderWards(); renderBeds(); backToBeds();
  saveProfiles();
}
function saveData(){
  // write into current profile and persist
  if(currentProfileId && profileStore.map[currentProfileId]){
    profileStore.map[currentProfileId].data = deepClone(data);
  }
  saveProfiles();
}
// Legacy direct loader (unused now)
function loadData(){const js=localStorage.getItem(STORAGE_KEY);if(js)try{data=JSON.parse(js)}catch{}}
function refreshProfileUI(){
  const btn=document.getElementById('profileMenuBtn');
  const list=document.getElementById('profileList');
  const cur=profileStore.map[currentProfileId];
  if(btn){
    if(cur){
      btn.innerHTML='<span class="chip-eyebrow">Profile</span><span class="chip-name"></span><span class="chip-caret">⌄</span>';
      btn.querySelector('.chip-name').textContent=cur.name;
    } else { btn.textContent='Profile'; }
  }
  const mob=document.querySelector('#mobileProfileChip .mpc-name');
  if(mob && cur) mob.textContent=cur.name;
  if(list){
    list.innerHTML='';
    Object.values(profileStore.map).forEach(p=>{
      const li=document.createElement('li');
      li.textContent=p.name||p.id;
      if(p.id===currentProfileId){ li.style.fontWeight='700'; li.style.color='var(--primary-700)'; li.style.background='var(--primary-tint)'; }
      li.addEventListener('click', ()=>{ switchProfile(p.id); closeProfilePanel(); });
      list.appendChild(li);
    });
  }
  // toggle Refresh visibility if current profile is a sheet profile
  const refreshBtn=document.getElementById('profRefreshSheetBtn');
  if(refreshBtn){
    const isSheet=!!(cur && cur.sheetConfig);
    refreshBtn.style.display = isSheet ? 'inline-block' : 'none';
  }
}
function uuid(){return 'x'+Date.now()+Math.floor(Math.random()*1000)}
function autoGrow(el){el.style.height='auto';el.style.height=el.scrollHeight+'px';}

// Select a ward and return to the beds view (shared by the sidebar list and the mobile ward picker)
function goToWard(wardId){
  selectedWardId=wardId; selectedBedId=null; renderWards(); renderBeds();
  const wwVisible = (wardWorkPage && wardWorkPage.style.display && wardWorkPage.style.display !== 'none');
  const notesVisible = (notesPage && notesPage.style.display && notesPage.style.display !== 'none');
  if(wwVisible){ backFromWW(); }
  else if(notesVisible){ backFromNotes(); }
  else { backToBeds(); }
}
// Populate the mobile ward-picker dropdown to mirror the sidebar ward list
function renderWardPicker(){
  const sel=document.getElementById('wardPicker'); if(!sel) return;
  sel.innerHTML='';
  const ph=document.createElement('option'); ph.value=''; ph.textContent='— Select ward —'; sel.appendChild(ph);
  (data.wards||[]).forEach(w=>{ const o=document.createElement('option'); o.value=w.id; o.textContent=w.name; sel.appendChild(o); });
  sel.value=selectedWardId||'';
  sel.onchange=()=>{ if(sel.value) goToWard(sel.value); };
}
function renderWards(){
  const ul=document.getElementById('wardList');ul.innerHTML='';
  // apply toggle state to checkbox if present
  const onlyToggle=document.getElementById('wardOnlyBedsToggle');
  if(onlyToggle){ onlyToggle.checked = !!getWardListOnlyBeds(); onlyToggle.onchange=()=>{ setWardListOnlyBeds(onlyToggle.checked); renderWards(); }; }
  data.wards.forEach(w=>{
    const li=document.createElement('li');
    li.dataset.wardId = w.id;
    // count beds by current status filter
    const filter=getCurrentStatusFilter();
    const count=(w.beds||[]).filter(b=>{
      const st=(b.status==='discharge')?'discharge':'active';
      if(filter==='active') return st!=='discharge';
      if(filter==='discharge') return st==='discharge';
      return true;
    }).length;
    // if preference is to show only wards with beds, skip if none
    if(getWardListOnlyBeds() && count===0){ return; }
    const hasBeds = count > 0;
    if(hasBeds) li.classList.add('has-beds');
    const nameEl=document.createElement('span'); nameEl.className='wl-name'; nameEl.textContent=w.name;
    const countEl=document.createElement('span'); countEl.className='wl-count'; countEl.textContent=count;
    li.appendChild(nameEl); li.appendChild(countEl);
    // Left accent: green when the ward has patients (by current filter), grey when empty
    li.style.boxShadow = `inset 3px 0 0 ${hasBeds ? '#22c55e' : '#cbd5e1'}`;
    li.dataset.wardId = w.id; // Add ward ID for mobile drag-and-drop
    if(w.id===selectedWardId)li.classList.add('selected');
    li.onclick=()=>goToWard(w.id);
    li.draggable=true;
    // Accept drop of beds to move between wards
    li.addEventListener('dragover',e=>{
      const types=[...(e.dataTransfer?.types||[])];
      if(types.includes('application/ward-beds')){ e.preventDefault(); li.classList.add('over'); }
    });
    li.addEventListener('dragleave',()=> li.classList.remove('over'));
    li.addEventListener('drop',e=>{
      const types=[...(e.dataTransfer?.types||[])]; li.classList.remove('over');
      if(!types.includes('application/ward-beds')) return;
      e.preventDefault(); e.stopPropagation();
      try{
        const payload=JSON.parse(e.dataTransfer.getData('application/ward-beds')||'{}');
        if(!payload || !Array.isArray(payload.bedIds)) return;
        moveBedsBetweenWards(payload.bedIds, payload.fromWardId, payload.fromProfileId, w.id, currentProfileId);
      }catch{}
    });
    li.addEventListener('dragstart',e=>{dragSrcId=w.id;e.dataTransfer.effectAllowed='move';});
    li.addEventListener('dragover',e=>{e.preventDefault();li.classList.add('over')});
    li.addEventListener('dragleave',()=>li.classList.remove('over'));
    li.addEventListener('drop',e=>{
      e.stopPropagation();li.classList.remove('over');
      if(!dragSrcId||dragSrcId===w.id)return;
      const from=data.wards.findIndex(x=>x.id===dragSrcId);
      const to=data.wards.findIndex(x=>x.id===w.id);
      const [m]=data.wards.splice(from,1);data.wards.splice(to,0,m);
      saveData();renderWards();
    });
    // inline delete that doesn't take extra space
    const del=document.createElement('button');
    del.className='ward-delete';
    del.textContent='×';
    del.title='Delete ward';
    del.onclick=(ev)=>{
      ev.stopPropagation();
      if(!confirm('Delete this ward?')) return;
      const idx=data.wards.findIndex(x=>x.id===w.id);
      if(idx>-1){ data.wards.splice(idx,1); saveData(); if(selectedWardId===w.id) selectedWardId=null; renderWards(); renderBeds(); }
    };
    li.appendChild(del);
    // remove long-press delete; overlay button handles deletion
    ul.appendChild(li);
  });
  renderWardPicker();
}

function renderBeds(){
  const bedList=document.getElementById('bedList');
  const title=document.getElementById('wardTitle');
  const addBtn=document.getElementById('addBedBtn');
  const selBtn=document.getElementById('selectBedsBtn');
  const moveSelBtn=document.getElementById('moveSelectedBtn');
  const clearSelBtn=document.getElementById('clearSelectionBtn');
  const statusSel=document.getElementById('statusFilter');
  bedList.innerHTML='';
  const ward=data.wards.find(w=>w.id===selectedWardId);
  if(!ward){
    title.textContent='Select a ward';
    addBtn.disabled=true;
    const resumeLabel = hasDraft() ? 'Resume Quick I/O Note' : 'Add / Calculate I/O';
    const resumeHint = hasDraft()
      ? 'You have an unsaved note in progress. Pick it up where you left off.'
      : 'Start a note and I/O calculation right away — no need to create a ward or bed first. Save it to a ward whenever you like.';
    bedList.innerHTML =
      '<div class="empty-state">'
      + '<div class="es-icon">⚡</div>'
      + '<p class="es-title">'+(hasDraft()?'Unsaved note in progress':'Nothing selected yet')+'</p>'
      + '<button id="emptyQuickIOBtn" class="quick-io-cta">'+resumeLabel+'</button>'
      + '<p class="hint">'+resumeHint+'</p>'
      + '</div>';
    const eqb=document.getElementById('emptyQuickIOBtn');
    if(eqb) eqb.addEventListener('click', openDraftNote);
    return;
  }
  title.textContent='Ward: '+ward.name;addBtn.disabled=false;
  // apply status filter
  const currentFilter = (localStorage.getItem(STATUS_FILTER_KEY)||'both');
  if(statusSel){ statusSel.value=currentFilter; statusSel.onchange=()=>{ localStorage.setItem(STATUS_FILTER_KEY, statusSel.value); renderWards(); renderBeds(); }; }
  const bedsToShow = ward.beds.filter(b=>{
    const st=(b.status||'active');
    if(currentFilter==='active') return st!=='discharge';
    if(currentFilter==='discharge') return st==='discharge';
    return true;
  });
  bedsToShow.forEach((b,i)=>{
    const div=document.createElement('div');
    div.className='bed-item';
    // Only allow HTML5 drag-to-reorder when NOT in selection mode
    div.draggable = !selectionMode;
    div.setAttribute('data-bed-id',b.id);

    div.addEventListener('dragstart',e=>{bedDragSrcId=b.id;e.dataTransfer.effectAllowed='move';setTimeout(()=>div.style.opacity=0.5,0);});
    div.addEventListener('dragend',()=>{div.style.opacity=1;});
    div.addEventListener('dragover',e=>{e.preventDefault();if(b.id!==bedDragSrcId)div.classList.add('over');});
    div.addEventListener('dragleave',()=>div.classList.remove('over'));
    div.addEventListener('drop',e=>{
      e.stopPropagation();div.classList.remove('over');
      if(!bedDragSrcId||bedDragSrcId===b.id)return;
      const beds=ward.beds;
      const from=beds.findIndex(x=>x.id===bedDragSrcId);
      const to=beds.findIndex(x=>x.id===b.id);
      const [moved]=beds.splice(from,1);
      beds.splice(to,0,moved);
      saveData();renderBeds();
    });

    // static bed display: ward/bed on first line, diagnosis hashtags on second line
    const textDiv=document.createElement('div');
    textDiv.className='bed-text';
    const line1=document.createElement('div');
    line1.className='line1';
    const line2=document.createElement('div');
    line2.className='line2';
    // compute ward/bed header
    const wardName = ward.name || '';
    const bedName = b.name || '';
    const header = wardName ? (wardName.includes('/') ? `${wardName} ${bedName}`.trim() : `${wardName}/${bedName}`.trim()) : bedName;
  line1.textContent = header;
  // status badge
  const st = (b.status==='discharge') ? 'discharge' : 'active';
  if(st==='discharge') div.classList.add('is-discharge');
    const badge=document.createElement('span');
  badge.className = 'status-badge ' + (st==='discharge' ? 'status-discharge' : 'status-active');
  badge.textContent = st==='discharge' ? 'Discharge' : 'Active';
    // non-interactive in list to avoid accidental changes; edit inside Quick Ward Note instead
  line1.appendChild(badge);
    // compute diagnosis hashtags from bed.details and show HN if present
    let dxText='';
    try{ const d=JSON.parse(b.details||'{}'); const raw=(d.dx||d.hashtags||'');
      if(raw){ dxText = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=> s.startsWith('#')? s : `#${s}`).join('\n'); }
    }catch{}
    const hnText = (b.hn && (''+b.hn).trim()) ? `HN: ${(''+b.hn).trim()}` : '';
    line2.textContent = hnText ? (dxText? `${hnText}\n${dxText}` : hnText) : dxText;
    textDiv.appendChild(line1);
    textDiv.appendChild(line2);
    // allow tap anywhere on the bed block to edit (except buttons); in selection mode, toggle selection instead
    div.addEventListener('click',(ev)=>{
      if(performance && performance.now && performance.now() < suppressBedClickUntil) return;
      if(ev.target.closest('button')) return; // buttons handle their own click
      if(selectionMode){ 
        // In selection mode, clicking anywhere (including checkbox) toggles selection
        toggleBedSelection(b.id, div); 
        ev.preventDefault(); // Prevent checkbox from toggling twice
      }
      else openProfilePage(b);
    });

    // Multi-move payload for drag onto other wards
    div.addEventListener('dragstart',e=>{
      const bedIds = (selectedBedIds.size>0 && selectedBedIds.has(b.id)) ? Array.from(selectedBedIds) : [b.id];
      try{ e.dataTransfer.setData('application/ward-beds', JSON.stringify({ bedIds, fromWardId: ward.id, fromProfileId: currentProfileId })); }catch{}
    });

    // Mobile long-press touch drag
    let touchStartEl = null;
    let willStartDrag = false;
    div.addEventListener('touchstart',(e)=>{
      // Only allow drag to other wards when in select mode (after "Select Beds" is pressed)
      if(!selectionMode) {
        return;
      }
      
      // Don't interfere with button/checkbox/input interactions
      if(e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }
      
      // Prevent browser default drag behavior immediately (when in select mode)
      e.preventDefault();
      
      touchStartEl = div;
      willStartDrag = true;
      const t=e.touches[0]; if(!t) return;
      const touchX = t.clientX;
      const touchY = t.clientY;
      lpStart={x:touchX, y:touchY};
      const bedIds=(selectedBedIds.size>0 && selectedBedIds.has(b.id))? Array.from(selectedBedIds): [b.id];
      clearTimeout(longPressTimer);
      
      longPressTimer=setTimeout(()=>{ 
        if(!willStartDrag) return;
        const syntheticTouch = {clientX: touchX, clientY: touchY};
        startMobileDrag(bedIds, ward.id, syntheticTouch); 
      }, LONG_PRESS_MS);
    }, {passive:false});
    
    // Prevent context menu on long press (Android Chrome) - only in selection mode
    div.addEventListener('contextmenu', (e) => {
      if(selectionMode) {
        e.preventDefault();
        return false;
      }
    });
    div.addEventListener('touchmove',(e)=>{
      const t=e.touches[0]; if(!t) return;
      
      if(!mobileDrag){
        // Only interfere with touchmove when in selection mode and waiting for drag
        if(!selectionMode || !willStartDrag) return;
        
        const dx=Math.abs(t.clientX-lpStart.x), dy=Math.abs(t.clientY-lpStart.y);
        
        if(dx>MOVE_CANCEL_PX || dy>MOVE_CANCEL_PX){ 
          clearTimeout(longPressTimer); 
          willStartDrag = false;
          return;
        }
        
        // Prevent default during long-press wait to avoid touchcancel
        e.preventDefault();
        return;
      }
      
      // During drag - always prevent default
      e.preventDefault();
      updateMobileDrag(t);
    }, {passive:false});
    div.addEventListener('touchend',(e)=>{
      clearTimeout(longPressTimer);
      const t=e.changedTouches[0]; 
      
      if(mobileDrag && t && touchStartEl === div){ 
        e.preventDefault();
        endMobileDrag(t); 
      } else if(selectionMode && willStartDrag && touchStartEl === div) {
        // Quick tap without long-press in selection mode - toggle selection
        e.preventDefault();
        toggleBedSelection(b.id, div);
      }
      
      willStartDrag = false;
      touchStartEl = null;
    }, {passive:false});
    div.addEventListener('touchcancel',(e)=>{ 
      clearTimeout(longPressTimer); 
      if(mobileDrag){ 
        mobileDrag.ghost.remove(); 
        mobileDrag=null; 
        clearWardOver();
        document.body.classList.remove('dragging-bed');
      }
      touchStartEl = null;
    });

  const actions=document.createElement('div');
    actions.className='actions-row';
  // selection checkbox
  const selectBox=document.createElement('input');
  selectBox.type='checkbox'; selectBox.className='select-box'; selectBox.style.display= selectionMode? 'inline-block':'none';
  selectBox.checked = selectedBedIds.has(b.id);
  // Checkbox click is handled by the bed div click handler, just prevent default checkbox behavior
  selectBox.addEventListener('click', (e)=>{ e.preventDefault(); });
    const moveBtn=document.createElement('button');
    moveBtn.textContent='Move';
    moveBtn.onclick=(e)=>{ e.stopPropagation(); openMoveBedModal({ bedId: b.id, fromWardId: ward.id, fromProfileId: currentProfileId }); };
  const delBtn=document.createElement('button');
    delBtn.className='delete';
    delBtn.textContent='Delete';
    delBtn.onclick=()=>{if(!confirm('Delete this bed?'))return;
      const idxAll=ward.beds.findIndex(x=>x.id===b.id); if(idxAll>-1){ ward.beds.splice(idxAll,1); saveData(); renderBeds(); renderWards(); }
    };
  actions.appendChild(selectBox);
    actions.appendChild(moveBtn);
    actions.appendChild(delBtn);
    div.appendChild(textDiv);
    div.appendChild(actions);
    if(selectionMode){ div.classList.add('select-mode'); if(selectedBedIds.has(b.id)) div.classList.add('selected'); }
    bedList.appendChild(div);
  });

  // selection toolbar visibility
  function updateSelToolbar(){
    const count=selectedBedIds.size;
    moveSelBtn.style.display = selectionMode? 'inline-block':'none';
    clearSelBtn.style.display = selectionMode? 'inline-block':'none';
    moveSelBtn.textContent = `Move selected (${count})`;
    // show/hide checkboxes
    bedList.querySelectorAll('.select-box').forEach(cb=> cb.style.display = selectionMode? 'inline-block':'none');
    bedList.querySelectorAll('.bed-item').forEach(item=> item.classList.toggle('select-mode', selectionMode));
  }
  updateSelToolbar();
  selBtn.onclick=()=>{ selectionMode=!selectionMode; if(!selectionMode) selectedBedIds.clear(); renderBeds(); };
  clearSelBtn.onclick=()=>{ selectedBedIds.clear(); renderBeds(); };
  moveSelBtn.onclick=()=>{
    if(selectedBedIds.size===0) return;
    openMoveBedModal({ bedIds: Array.from(selectedBedIds), fromWardId: ward.id, fromProfileId: currentProfileId });
  };
}

let selectionMode=false;
const selectedBedIds=new Set();
function toggleBedSelection(bedId, divEl, explicit){
  const shouldSelect = (explicit!=null)? explicit : !selectedBedIds.has(bedId);
  if(shouldSelect) selectedBedIds.add(bedId); else selectedBedIds.delete(bedId);
  if(divEl){ divEl.classList.toggle('selected', shouldSelect); const cb=divEl.querySelector('.select-box'); if(cb) cb.checked=shouldSelect; }
  // update toolbar count
  const moveSelBtn=document.getElementById('moveSelectedBtn'); if(moveSelBtn) moveSelBtn.textContent=`Move selected (${selectedBedIds.size})`;
}

// ===== Mobile touch drag-and-drop (fallback for iOS/Android) =====
let mobileDrag=null; // { ghost, bedIds, fromWardId }
let longPressTimer=null, lpStart={x:0,y:0};
const LONG_PRESS_MS=300, MOVE_CANCEL_PX=10;
function getWardAtPoint(x,y){
  const ul=document.getElementById('wardList'); 
  if(!ul) return null;
  let target=null;
  const wards = ul.querySelectorAll('li');
  wards.forEach(li=>{
    const r=li.getBoundingClientRect();
    if(x>=r.left && x<=r.right && y>=r.top && y<=r.bottom){ 
      target=li; 
    }
  });
  return target;
}
function clearWardOver(){ document.querySelectorAll('#wardList li.over').forEach(li=> li.classList.remove('over')); }

// Global touch handlers for mobile drag (Android Chrome compatibility)
let globalTouchMoveHandler = (e) => {
  if(!mobileDrag) return;
  const t = e.touches[0];
  if(!t) return;
  e.preventDefault();
  updateMobileDrag(t);
};

let globalTouchEndHandler = (e) => {
  if(!mobileDrag) return;
  const t = e.changedTouches[0];
  if(t) {
    e.preventDefault();
    endMobileDrag(t);
  }
};

document.addEventListener('touchmove', globalTouchMoveHandler, {passive: false});
document.addEventListener('touchend', globalTouchEndHandler, {passive: false});

function startMobileDrag(bedIds, fromWardId, touch){
  // CRITICAL: Add class to disable all touch actions and prevent scrolling
  document.body.classList.add('dragging-bed');
  
  // create ghost near finger (above so it's visible)
  const ghost=document.createElement('div');
  ghost.textContent = `${bedIds.length>1? bedIds.length+" beds" : "1 bed"}`;
  ghost.style.position='fixed'; ghost.style.left=(touch.clientX-40)+'px'; ghost.style.top=(touch.clientY-90)+'px';
  ghost.style.background='rgba(0,0,0,0.85)'; ghost.style.color='#fff'; ghost.style.padding='8px 12px'; ghost.style.borderRadius='8px'; ghost.style.fontSize='14px'; ghost.style.fontWeight='600'; ghost.style.pointerEvents='none'; ghost.style.zIndex='99999'; ghost.style.boxShadow='0 6px 14px rgba(0,0,0,0.35)';
  document.body.appendChild(ghost);
  mobileDrag={ ghost, bedIds, fromWardId };
  // prevent bed click opening editor shortly after drag
  try{ if(performance && performance.now) suppressBedClickUntil = performance.now() + 600; }catch{}
}
function updateMobileDrag(touch){
  if(!mobileDrag) return;
  const {ghost}=mobileDrag; 
  ghost.style.left=(touch.clientX-40)+'px'; 
  ghost.style.top=(touch.clientY-90)+'px';
  clearWardOver(); 
  const li=getWardAtPoint(touch.clientX, touch.clientY); 
  if(li) {
    li.classList.add('over');
  }
}
function endMobileDrag(touch){
  if(!mobileDrag) return;
  const {ghost, bedIds, fromWardId}=mobileDrag; 
  ghost.remove();
  clearWardOver();
  
  // CRITICAL: Remove class to re-enable touch actions and scrolling
  document.body.classList.remove('dragging-bed');
  
  const li=getWardAtPoint(touch.clientX, touch.clientY);
  
  if(li){
    const targetWardId = li.dataset.wardId;
    if(targetWardId && targetWardId !== fromWardId){ 
      moveBedsBetweenWards(bedIds, fromWardId, currentProfileId, targetWardId, currentProfileId);
    }
  }
  mobileDrag=null;
}

function moveBedsBetweenWards(bedIds, fromWardId, fromProfileId, toWardId, toProfileId){
  try{
    const moving=[];
    const isFromCurrent = fromProfileId===currentProfileId;
    const isToCurrent = toProfileId===currentProfileId;

    if(isFromCurrent && isToCurrent){
      // within current profile: operate on live data
      const srcWard=data.wards.find(w=>w.id===fromWardId);
      const dstWard=data.wards.find(w=>w.id===toWardId);
      if(!srcWard||!dstWard) return;
      srcWard.beds = srcWard.beds.filter(b=>{ if(bedIds.includes(b.id)){ moving.push(b); return false; } return true; });
      dstWard.beds.push(...moving);
      saveData();
    } else if(isFromCurrent && !isToCurrent){
      // from current to another profile
      const srcWard=data.wards.find(w=>w.id===fromWardId);
      const dstProf=profileStore.map[toProfileId]; if(!srcWard||!dstProf) return;
      const dstWard=(dstProf.data.wards||[]).find(w=>w.id===toWardId); if(!dstWard) return;
      srcWard.beds = srcWard.beds.filter(b=>{ if(bedIds.includes(b.id)){ moving.push(b); return false; } return true; });
      dstWard.beds.push(...moving);
      saveData(); // persists current + entire profileStore
    } else if(!isFromCurrent && isToCurrent){
      // from another profile to current
      const srcProf=profileStore.map[fromProfileId]; if(!srcProf) return;
      const srcWard=(srcProf.data.wards||[]).find(w=>w.id===fromWardId); const dstWard=data.wards.find(w=>w.id===toWardId);
      if(!srcWard||!dstWard) return;
      srcWard.beds = srcWard.beds.filter(b=>{ if(bedIds.includes(b.id)){ moving.push(b); return false; } return true; });
      dstWard.beds.push(...moving);
      saveData();
    } else {
      // neither is current: operate only on store
      const srcProf=profileStore.map[fromProfileId]; const dstProf=profileStore.map[toProfileId];
      if(!srcProf||!dstProf) return;
      const srcWard=(srcProf.data.wards||[]).find(w=>w.id===fromWardId); const dstWard=(dstProf.data.wards||[]).find(w=>w.id===toWardId);
      if(!srcWard||!dstWard) return;
      srcWard.beds = srcWard.beds.filter(b=>{ if(bedIds.includes(b.id)){ moving.push(b); return false; } return true; });
      dstWard.beds.push(...moving);
      saveProfiles();
    }
    renderWards(); renderBeds();
    if(isFromCurrent && fromWardId===selectedWardId){ selectedBedIds.clear(); }
  }catch{}
}

// legacy profile panel functions removed

document.getElementById('addWardBtn').onclick=()=>{
  const name=prompt('Ward name');if(!name)return;
  data.wards.push({id:uuid(),name,beds:[]});
  saveData();renderWards();
};
const editWardsBtn=document.getElementById('editWardsBtn');
let wardsEditMode=false;
try{ wardsEditMode = JSON.parse(localStorage.getItem('wardsEditMode')||'false'); }catch{}
function applyWardsEditMode(){
  document.body.classList.toggle('edit-wards', !!wardsEditMode);
  if(editWardsBtn){
    editWardsBtn.textContent = wardsEditMode ? '✓' : '✎';
    editWardsBtn.title = wardsEditMode ? 'Done editing wards' : 'Edit / delete wards';
  }
}
applyWardsEditMode();
editWardsBtn.onclick=()=>{ wardsEditMode=!wardsEditMode; localStorage.setItem('wardsEditMode', JSON.stringify(wardsEditMode)); applyWardsEditMode(); };
const PRESETS_KEY='wardPresets-v1';
let presets={};
function loadPresets(){ try{ const raw=localStorage.getItem(PRESETS_KEY); if(raw) presets=JSON.parse(raw)||{}; }catch{ presets={}; } }
function savePresets(){ try{ localStorage.setItem(PRESETS_KEY, JSON.stringify(presets)); }catch{} }
function refreshPresetSelect(){ const sel=document.getElementById('presetSelect'); if(!sel) return; sel.innerHTML=''; const names=Object.keys(presets).sort(); names.forEach(n=>{ const opt=document.createElement('option'); opt.value=n; opt.textContent=n; sel.appendChild(opt); }); }
loadPresets();

const presetsBtn=document.getElementById('presetsBtn');
const presetsModal=document.getElementById('presetsModal');
const closePresetBtn=document.getElementById('closePresetBtn');
const savePresetBtn=document.getElementById('savePresetBtn');
const applyPresetBtn=document.getElementById('applyPresetBtn');
const loadPresetBtn=document.getElementById('loadPresetBtn');
const deletePresetBtn=document.getElementById('deletePresetBtn');
const presetNameInput=document.getElementById('presetName');
const presetWardsTa=document.getElementById('presetWards');
const presetSelect=document.getElementById('presetSelect');

function openPresets(){ presetsModal.style.display='flex'; refreshPresetSelect(); }
function closePresets(){ presetsModal.style.display='none'; }
presetsBtn.onclick=openPresets;
closePresetBtn.onclick=closePresets;
presetsModal.addEventListener('click',(e)=>{ if(e.target===presetsModal) closePresets(); });

loadPresetBtn.onclick=()=>{ const n=presetSelect.value; if(!n||!presets[n]) return; presetNameInput.value=n; presetWardsTa.value=(presets[n]||[]).join('\n'); };
deletePresetBtn.onclick=()=>{ const n=presetSelect.value; if(!n||!presets[n]) return; if(!confirm(`Delete preset "${n}"?`)) return; delete presets[n]; savePresets(); refreshPresetSelect(); if(presetNameInput.value===n){ presetNameInput.value=''; presetWardsTa.value=''; } };
savePresetBtn.onclick=()=>{ const n=(presetNameInput.value||'').trim(); if(!n) return alert('Enter a preset name'); const wards=(presetWardsTa.value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean); presets[n]=wards; savePresets(); refreshPresetSelect(); alert('Preset saved'); };
applyPresetBtn.onclick=()=>{ const wards=(presetWardsTa.value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean); if(wards.length===0) return alert('No ward names'); if(!confirm('Replace current wards with this preset?')) return; data.wards = wards.map(n=>({ id: uuid(), name: n, beds: [] })); saveData(); selectedWardId=null; renderWards(); renderBeds(); closePresets(); };
// Profiles UI bindings
// Compact profiles menu elements
const profileMenuBtn=document.getElementById('profileMenuBtn');
const profileMenuPanel=document.getElementById('profileMenuPanel');
const closeProfilePanelBtn=document.getElementById('closeProfilePanel');
const profNewBtn=document.getElementById('profNewBtn');
const profNewSheetBtn=document.getElementById('profNewSheetBtn');
const profDupBtn=document.getElementById('profDupBtn');
const profRenBtn=document.getElementById('profRenBtn');
const profDelBtn=document.getElementById('profDelBtn');
const profRefreshSheetBtn=document.getElementById('profRefreshSheetBtn');

// Sheet Profile Modal elements
const sheetProfileModal=document.getElementById('sheetProfileModal');
const sheetCsvUrl=document.getElementById('sheetCsvUrl');
const sheetHasHeader=document.getElementById('sheetHasHeader');
const sheetFetchBtn=document.getElementById('sheetFetchBtn');
const sheetFetchStatus=document.getElementById('sheetFetchStatus');
const sheetTabsRow=document.getElementById('sheetTabsRow');
const sheetTabName=document.getElementById('sheetTabName');
const sheetTabNamesWrap=document.getElementById('sheetTabNamesWrap');
const sheetTabChips=document.getElementById('sheetTabChips');
const sheetMapping=document.getElementById('sheetMapping');
const colWard=document.getElementById('colWard');
const colBed=document.getElementById('colBed');
const colName=document.getElementById('colName');
const colDx=document.getElementById('colDx');
const colHN=document.getElementById('colHN');
const colStatus=document.getElementById('colStatus');
const appendNameToBed=document.getElementById('appendNameToBed');
const sheetCancelBtn=document.getElementById('sheetCancelBtn');
const sheetCreateBtn=document.getElementById('sheetCreateBtn');
const sheetTableWrap=document.getElementById('sheetTableWrap');
const sheetTable=document.getElementById('sheetTable');
let sheetRowsCache=null;
const pickWardBtn=document.getElementById('pickWardBtn');
const pickBedBtn=document.getElementById('pickBedBtn');
const pickNameBtn=document.getElementById('pickNameBtn');
const pickStatusBtn=document.getElementById('pickStatusBtn');
const pickHNBtn=document.getElementById('pickHNBtn');
const pickDxBtn=document.getElementById('pickDxBtn');
const sheetPickStatus=document.getElementById('sheetPickStatus');
let pickTarget=null;

function createProfile(name, seedData){
  const pid='p'+Date.now()+Math.floor(Math.random()*1000);
  profileStore.map[pid]={ id: pid, name: name||('Profile '+Object.keys(profileStore.map).length), data: deepClone(seedData||{wards:[]}) };
  profileStore.current=pid; currentProfileId=pid; data=deepClone(profileStore.map[pid].data);
  selectedWardId=null; selectedBedId=null;
  saveProfiles(); refreshProfileUI(); renderWards(); renderBeds(); backToBeds();
}
function renameProfile(pid, newName){ if(profileStore.map[pid]){ profileStore.map[pid].name=newName; saveProfiles(); refreshProfileUI(); } }
function deleteProfile(pid){
  const keys=Object.keys(profileStore.map);
  if(keys.length<=1){ alert('At least one profile is required.'); return; }
  delete profileStore.map[pid];
  // choose another current
  const nextId = Object.keys(profileStore.map)[0];
  profileStore.current=nextId; currentProfileId=nextId; data=deepClone(profileStore.map[nextId].data);
  saveProfiles(); refreshProfileUI(); renderWards(); renderBeds(); backToBeds();
}

// --- Profile panel open/close -------------------------------------------------
// On phones the panel is shown as a fixed sheet near the top of the screen.
// The slide-over sidebar uses a CSS transform; a transformed ancestor becomes
// the containing block for position:fixed children and would drag the panel
// off-screen. So on phones we reparent the panel to <body> while it is open
// (restoring it to the sidebar for the desktop popover).
const profileMenuHome = profileMenuPanel ? profileMenuPanel.parentElement : null;
const isSlideOverWidth = ()=> window.matchMedia('(max-width: 768px)').matches;
let profileMenuBackdrop = null;
function ensureProfileBackdrop(){
  if(profileMenuBackdrop) return profileMenuBackdrop;
  profileMenuBackdrop = document.createElement('div');
  profileMenuBackdrop.id = 'profileMenuBackdrop';
  profileMenuBackdrop.addEventListener('click', ()=> closeProfilePanel());
  document.body.appendChild(profileMenuBackdrop);
  return profileMenuBackdrop;
}
function openProfilePanel(){
  if(!profileMenuPanel) return;
  if(isSlideOverWidth()){
    if(profileMenuPanel.parentElement !== document.body) document.body.appendChild(profileMenuPanel);
    ensureProfileBackdrop().style.display = 'block';
  } else if(profileMenuHome && profileMenuPanel.parentElement !== profileMenuHome){
    profileMenuHome.appendChild(profileMenuPanel);
  }
  profileMenuPanel.style.display = 'block';
}
function closeProfilePanel(){
  if(profileMenuPanel) profileMenuPanel.style.display = 'none';
  if(profileMenuBackdrop) profileMenuBackdrop.style.display = 'none';
}
function toggleProfilePanel(){
  if(profileMenuPanel && profileMenuPanel.style.display === 'block') closeProfilePanel();
  else openProfilePanel();
}
profileMenuBtn?.addEventListener('click', (e)=>{ e.stopPropagation(); toggleProfilePanel(); });
// Mobile profile chip in the bed view opens the same panel as a fixed sheet.
document.getElementById('mobileProfileChip')?.addEventListener('click', (e)=>{ e.stopPropagation(); openProfilePanel(); });
closeProfilePanelBtn?.addEventListener('click', ()=> closeProfilePanel());
// Click outside the menu (or its reparented panel) closes it.
document.addEventListener('click', (e)=>{
  if(!profileMenuPanel || profileMenuPanel.style.display !== 'block') return;
  const menu=document.getElementById('profilesMenu');
  if((menu && menu.contains(e.target)) || profileMenuPanel.contains(e.target)) return;
  closeProfilePanel();
});
profNewBtn?.addEventListener('click', ()=>{ const name=prompt('New profile name'); if(name==null) return; createProfile(name.trim()||'Untitled', {wards:[]}); });
profNewSheetBtn?.addEventListener('click', ()=>{ openSheetProfileModal(); });
profDupBtn?.addEventListener('click', ()=>{ const cur=profileStore.map[currentProfileId]; if(!cur) return; const name=prompt('Duplicate profile as', cur.name+' Copy'); if(name==null) return; createProfile(name.trim()||cur.name+' Copy', cur.data); });
profRenBtn?.addEventListener('click', ()=>{ const cur=profileStore.map[currentProfileId]; if(!cur) return; const name=prompt('Rename profile', cur.name); if(name==null) return; renameProfile(currentProfileId, name.trim()||cur.name); closeProfilePanel(); });
profDelBtn?.addEventListener('click', ()=>{ const cur=profileStore.map[currentProfileId]; if(!cur) return; if(!confirm(`Delete profile \"${cur.name}\"?`)) return; deleteProfile(currentProfileId); closeProfilePanel(); });
profRefreshSheetBtn?.addEventListener('click', ()=>{ refreshCurrentSheetProfile(); });

function openSheetProfileModal(){ sheetProfileModal.style.display='flex'; resetSheetModal(); }
function closeSheetProfileModal(){ sheetProfileModal.style.display='none'; }
function resetSheetModal(){
  sheetCsvUrl.value=''; sheetHasHeader.checked=true; sheetFetchStatus.textContent='';
  sheetMapping.style.display='none'; sheetCreateBtn.disabled=true;
  if(sheetTabsRow){ sheetTabsRow.style.display='block'; }
  if(sheetTabName){ sheetTabName.value=''; }
  ;[colWard,colBed,colName,colDx,colStatus].forEach(sel=> sel.innerHTML='');
}
sheetCancelBtn?.addEventListener('click', closeSheetProfileModal);
sheetProfileModal?.addEventListener('click', (e)=>{ if(e.target===sheetProfileModal) closeSheetProfileModal(); });

sheetFetchBtn?.addEventListener('click', async ()=>{
  let url=(sheetCsvUrl.value||'').trim(); if(!url) return alert('Enter CSV URL');
  url = normalizeGoogleCsvUrl(url);
  // If user typed a tab name, prefer GVIZ-by-name URL
  const typedName=(sheetTabName?.value||'').trim();
  const sid=extractSheetId(url);
  if(typedName && sid){
    url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(typedName)}`;
  }
  sheetCsvUrl.value = url;
  sheetFetchStatus.textContent='Fetching columns…';
  try{
    // Try to fetch and display tab names via XLSX export
    try{
      const sid2 = sid || extractSheetId(url);
      if(sid2 && window.XLSX){
        const names = await fetchSheetTabNamesXlsx(sid2);
        if(Array.isArray(names) && names.length){
          if(sheetTabNamesWrap) sheetTabNamesWrap.style.display='block';
          if(sheetTabChips){
            sheetTabChips.innerHTML='';
            names.forEach(n=>{
              const chip=document.createElement('button');
              chip.type='button'; chip.textContent=n; chip.style.cssText='padding:4px 8px;border-radius:999px;border:1px solid #ccd6e6;background:#f6f8ff;color:#1a2750;font-size:12px;';
              chip.onclick=()=>{ if(sheetTabName) sheetTabName.value=n; loadByTabName(n, sid2); };
              sheetTabChips.appendChild(chip);
            });
          }
        }
      }
    }catch{}
    const rows=await fetchCsvRows(url);
    if(!rows || rows.length===0) throw new Error('No rows');
    sheetRowsCache = rows;
    const header = sheetHasHeader.checked? (rows[0]||[]) : (rows[0]||[]);
    const cols = Math.max(...rows.map(r=>r.length));
  function fill(sel){ sel.innerHTML=''; for(let i=0;i<cols;i++){ const opt=document.createElement('option'); const label=(header[i]||'').toString().trim(); opt.value=String(i); opt.textContent = `Col ${i+1}${label? ' - '+label:''}`; sel.appendChild(opt); } }
  fill(colWard); fill(colBed); fill(colName); fill(colDx); fill(colStatus); if(colHN) fill(colHN);
    // Heuristic preselect by header names (Thai + English)
    const hRaw=header.map(x=> (x||'').toString().trim());
    const hLower=hRaw.map(x=> x.toLowerCase());
    function findIdx(keys){
      // exact match first
      for(let i=0;i<hLower.length;i++){ if(keys.some(k=> hLower[i]===k)) return i; }
      // then substring contains
      for(let i=0;i<hLower.length;i++){ if(keys.some(k=> hLower[i].includes(k))) return i; }
      return null;
    }
    const wardIdx=findIdx(['ตึก','ward','วอร์ด','ward/']); if(wardIdx!=null) colWard.value=String(wardIdx);
    const bedIdx=findIdx(['เตียง','bed','room','ห้อง']); if(bedIdx!=null) colBed.value=String(bedIdx);
    const nameIdx=findIdx(['ชื่อ','name','patient']); if(nameIdx!=null) colName.value=String(nameIdx);
  const dxIdx=findIdx(['diagnosis','dx','diag','โรค','diagn']); if(dxIdx!=null) colDx.value=String(dxIdx);
  const hnIdx=findIdx(['hn','mrn','hospital number']); if(hnIdx!=null && colHN) colHN.value=String(hnIdx);
  const statusIdx=findIdx(['status','สถานะ','sts','discharge','dc','d/c','active','adm']); if(statusIdx!=null) colStatus.value=String(statusIdx);
    sheetMapping.style.display='block';
    sheetFetchStatus.textContent='Columns loaded';
    sheetCreateBtn.disabled=false;
    renderSheetPreview();
    highlightSheetPreview();
  }catch(err){ sheetFetchStatus.textContent='Failed to fetch: '+err.message; }
});

// Global: allow Enter in tab name field to fetch via GVIZ using current sheet ID
sheetTabName?.addEventListener('keydown', async (e)=>{
  if(e.key!=='Enter') return;
  e.preventDefault();
  const base=(sheetCsvUrl.value||'').trim(); if(!base) return;
  const sid=extractSheetId(base); const name=(sheetTabName.value||'').trim();
  if(!sid || !name) return;
  const gviz=`https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
  sheetCsvUrl.value = gviz;
  sheetFetchStatus.textContent='Fetching tab by name…';
  try{
    const rows=await fetchCsvRows(gviz);
    sheetRowsCache=rows;
    sheetMapping.style.display='block'; sheetCreateBtn.disabled=false;
    renderSheetPreview(); highlightSheetPreview();
    sheetFetchStatus.textContent='Columns loaded (tab name)';
  }catch(err){ sheetFetchStatus.textContent='Failed (tab name): '+(err?.message||err); }
});

// Helper to load by tab name programmatically (used by chips)
async function loadByTabName(name, sidOverride){
  const base=(sheetCsvUrl.value||'').trim();
  const sid = sidOverride || extractSheetId(base);
  if(!sid || !name) return;
  const gviz=`https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
  sheetCsvUrl.value = gviz;
  sheetFetchStatus.textContent='Fetching tab: '+name+'…';
  try{
    const rows=await fetchCsvRows(gviz);
    sheetRowsCache=rows;
    sheetMapping.style.display='block'; sheetCreateBtn.disabled=false;
    renderSheetPreview(); highlightSheetPreview();
    sheetFetchStatus.textContent='Columns loaded ("'+name+'")';
  }catch(err){ sheetFetchStatus.textContent='Failed to load "'+name+'": '+(err?.message||err); }
}

// Fetch tab names via XLSX export
async function fetchSheetTabNamesXlsx(sheetId){
  const xurl=`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  const res=await fetch(xurl, { credentials:'omit', cache:'no-store' });
  if(!res.ok) throw new Error('HTTP '+res.status);
  const buf=await res.arrayBuffer();
  if(!window.XLSX) throw new Error('XLSX library not loaded');
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  return (wb && Array.isArray(wb.SheetNames))? wb.SheetNames : [];
}

sheetHasHeader?.addEventListener('change', ()=>{ if(sheetRowsCache){ renderSheetPreview(); highlightSheetPreview(); } });
;[colWard,colBed,colName,colDx,colStatus,colHN].forEach(sel=> sel?.addEventListener('change', highlightSheetPreview));

function renderSheetPreview(){
  const rows = sheetRowsCache||[];
  const hasHeader = !!sheetHasHeader.checked;
  const cols = rows.reduce((m,r)=>Math.max(m, r.length), 0);
  const thead=[]; const tbody=[];
  if(hasHeader){
    thead.push('<thead><tr>');
    for(let c=0;c<cols;c++){ const txt=((rows[0]||[])[c]||''); thead.push(`<th data-col=\"${c}\" style=\"position:sticky;top:0;background:#fafafa;border:1px solid #ddd;padding:4px;\">${escapeHtml(txt)}</th>`); }
    thead.push('</tr></thead>');
  }
  tbody.push('<tbody>');
  const start = hasHeader? 1 : 0;
  for(let r=start;r<rows.length;r++){
    const row=rows[r]||[]; tbody.push('<tr>');
    for(let c=0;c<cols;c++){
      const txt=(row[c]||'');
      tbody.push(`<td data-col="${c}" style="border:1px solid #eee;padding:4px;">${escapeHtml(txt)}</td>`);
    }
    tbody.push('</tr>');
  }
  tbody.push('</tbody>');
  sheetTable.innerHTML = thead.join('') + tbody.join('');
}

function escapeHtml(s){ return (''+s).replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }

function highlightSheetPreview(){
  if(!sheetTable) return;
  const wardIdx = parseInt(colWard.value||'-1');
  const bedIdx = parseInt(colBed.value||'-1');
  const nameIdx = colName.value!==''? parseInt(colName.value) : -1;
  const dxIdx = colDx.value!==''? parseInt(colDx.value) : -1;
  const statusIdx = colStatus.value!==''? parseInt(colStatus.value) : -1;
  const hnIdx = (colHN && colHN.value!=='')? parseInt(colHN.value) : -1;
  const colors = {};
  if(!Number.isNaN(wardIdx) && wardIdx>=0) colors[wardIdx] = '#e7f3ff';
  if(!Number.isNaN(bedIdx) && bedIdx>=0) colors[bedIdx] = '#e7ffe7';
  if(!Number.isNaN(nameIdx) && nameIdx>=0) colors[nameIdx] = '#fff7e0';
  if(!Number.isNaN(dxIdx) && dxIdx>=0) colors[dxIdx] = '#ffe7e7';
  if(!Number.isNaN(statusIdx) && statusIdx>=0) colors[statusIdx] = '#f0e7ff';
  if(!Number.isNaN(hnIdx) && hnIdx>=0) colors[hnIdx] = '#d7f9f9';
  // reset all cells
  sheetTable.querySelectorAll('td,th').forEach(el=> el.style.background='');
  // color headers
  sheetTable.querySelectorAll('thead th').forEach((th,i)=>{ if(colors[i]) th.style.background = colors[i]; });
  // color body cells by column index
  sheetTable.querySelectorAll('tbody td').forEach(td=>{ const c=parseInt(td.getAttribute('data-col')||'-1'); if(colors[c]) td.style.background=colors[c]; });
}

function startPick(target){
  pickTarget=target;
  if(sheetPickStatus){
    const label = target==='ward'?'Ward': target==='bed'?'Bed/Room': target==='name'?'Name': target==='dx'?'Dx':'Status';
    sheetPickStatus.textContent = `Click a column to set ${label}`;
    sheetPickStatus.style.display = 'block';
  }
  sheetTableWrap?.classList.add('picking');
}
function stopPick(){
  pickTarget=null;
  if(sheetPickStatus){ sheetPickStatus.style.display='none'; }
  sheetTableWrap?.classList.remove('picking');
}
pickWardBtn?.addEventListener('click', ()=> startPick('ward'));
pickBedBtn?.addEventListener('click', ()=> startPick('bed'));
pickNameBtn?.addEventListener('click', ()=> startPick('name'));
pickDxBtn?.addEventListener('click', ()=> startPick('dx'));
pickStatusBtn?.addEventListener('click', ()=> startPick('status'));
pickHNBtn?.addEventListener('click', ()=> startPick('hn'));

sheetTable?.addEventListener('click', (e)=>{
  if(!pickTarget) return;
  const cell = e.target.closest('td,th'); if(!cell) return;
  const idxAttr = cell.getAttribute('data-col');
  if(idxAttr==null) return;
  const idx = parseInt(idxAttr);
  if(Number.isNaN(idx)) return;
  if(pickTarget==='ward') colWard.value=String(idx);
  else if(pickTarget==='bed') colBed.value=String(idx);
  else if(pickTarget==='name') colName.value=String(idx);
  else if(pickTarget==='dx') colDx.value=String(idx);
  else if(pickTarget==='status') colStatus.value=String(idx);
  else if(pickTarget==='hn' && colHN) colHN.value=String(idx);
  highlightSheetPreview();
  stopPick();
});
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') stopPick(); });

sheetCreateBtn?.addEventListener('click', async ()=>{
  const url=(sheetCsvUrl.value||'').trim(); if(!url) return;
  const cfg={
    csvUrl:url,
    hasHeader: !!sheetHasHeader.checked,
    wardCol: parseInt(colWard.value||'0'),
    bedCol: parseInt(colBed.value||'0'),
    nameCol: colName.value? parseInt(colName.value) : null,
    dxCol: colDx.value? parseInt(colDx.value) : null,
    statusCol: colStatus.value? parseInt(colStatus.value) : null,
    hnCol: (colHN && colHN.value)? parseInt(colHN.value) : null,
    appendNameToBed: !!appendNameToBed.checked
  };
  try{
    const rows=await fetchCsvRows(url);
    const dataObj=buildDataFromSheetRows(rows, cfg);
    // create sheet-backed profile
    const namePrompt=prompt('Profile name', 'Sheet Profile');
    const pname=(namePrompt||'Sheet Profile').trim();
    const pid='p'+Date.now()+Math.floor(Math.random()*1000);
    profileStore.map[pid]={ id: pid, name: pname, data: deepClone(dataObj), sheetConfig: cfg };
    profileStore.current=pid; currentProfileId=pid; data=deepClone(dataObj);
    saveProfiles(); refreshProfileUI(); renderWards(); renderBeds(); backToBeds();
    closeSheetProfileModal(); closeProfilePanel();
  }catch(err){ alert('Failed to create profile from sheet: '+err.message); }
});
document.getElementById('addBedBtn').onclick=(e)=>{
  if(e){ e.preventDefault(); e.stopPropagation(); }
  const w=data.wards.find(w=>w.id===selectedWardId);
  if(!w)return;
  const newBed={id:uuid(),name:'New Bed',status:'active',details:'{}'};
  w.beds.push(newBed);
  saveData();renderBeds();renderWards();
  // Temporarily suppress bed click handlers in case of retarget after reflow
  try{ if(performance && performance.now) suppressBedClickUntil = performance.now() + 300; }catch{}
  // Open editor immediately and select the bed name for quick rename
  setTimeout(()=> openProfilePage(newBed,{focusBed:true,selectBed:true}), 0);
};
document.getElementById('exportBtn').onclick=()=>{
  const pass=prompt('Export password');if(pass==null)return;
  const enc=CryptoJS.AES.encrypt(JSON.stringify(data),pass).toString();
  const blob=new Blob([enc],{type:'text/plain'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='ward-backup.txt';a.click();
  URL.revokeObjectURL(url);
};
document.getElementById('importBtn').onclick=()=>document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    const pass=prompt('Import password');if(pass==null)return;
    try{
      const dec=CryptoJS.AES.decrypt(ev.target.result,pass).toString(CryptoJS.enc.Utf8);
      const obj=JSON.parse(dec);
      if(!confirm('Overwrite current data?'))return;
      data=obj;saveData();selectedWardId=null;renderWards();renderBeds();alert('Import OK');
    }catch{alert('Bad password or corrupt file');}
  };
  r.readAsText(f);e.target.value='';
};

document.getElementById('expandSidebarBtn').onclick=()=>document.body.classList.remove('collapsed');

/* Mobile sidebar: slide-over behaviour.
   On phones the sidebar overlays the content (see CSS), so start collapsed,
   add a tap-to-close backdrop, and close it again once the user picks a
   ward or a nav item. */
(function(){
  const isPhone = ()=> window.matchMedia('(max-width: 768px)').matches;
  // Start collapsed on phones so the content gets the full width
  if(isPhone()) document.body.classList.add('collapsed');
  // Backdrop behind the open sidebar
  const backdrop=document.createElement('div');
  backdrop.id='sidebarBackdrop';
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', ()=> document.body.classList.add('collapsed'));
  // Auto-close after choosing a ward or a nav action (phones only)
  const sb=document.getElementById('sidebar');
  sb?.addEventListener('click', (e)=>{
    if(!isPhone()) return;
    if(e.target.closest('#wardList li') || e.target.closest('.side-nav button') || e.target.closest('#quickIOBtn')){
      setTimeout(()=> document.body.classList.add('collapsed'), 0);
    }
  });
  // If the window crosses the breakpoint (e.g. rotate), keep state sensible
  window.addEventListener('resize', ()=>{ if(!isPhone()) document.body.classList.remove('collapsed'); });
})();

/* Mobile bottom tab bar: drives navigation and reflects the current view.
   Uses local element refs (the outer consts aren't initialised yet here) and
   calls the hoisted nav functions. A MutationObserver keeps the active tab and
   bar visibility correct no matter how the view changed (tab, ward tap, Back). */
(function(){
  const bar=document.getElementById('mobileTabBar');
  if(!bar) return;
  const profileEl=document.getElementById('profilePage');
  const wwEl=document.getElementById('wardWorkPage');
  const notesEl=document.getElementById('notesPage');
  const bedsEl=document.getElementById('bedContainer');
  function currentView(){
    if(profileEl && profileEl.style.display==='flex') return 'quick';
    if(wwEl && wwEl.style.display==='flex') return 'work';
    if(notesEl && notesEl.style.display==='flex') return 'notes';
    return 'beds';
  }
  function sync(){
    const v=currentView();
    document.body.dataset.view=v;
    bar.querySelectorAll('button').forEach(b=> b.classList.toggle('active', b.dataset.tab===v));
  }
  bar.addEventListener('click', (e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const tab=btn.dataset.tab;
    if(tab==='beds') backToBeds();
    else if(tab==='work'){ if(currentView()!=='work') openWardWork(); }
    else if(tab==='quick') openDraftNote();
    else if(tab==='notes'){ if(currentView()!=='notes') openNotes(); }
    else if(tab==='more'){ document.body.classList.toggle('collapsed'); }
    setTimeout(sync, 0);
  });
  [bedsEl, wwEl, notesEl, profileEl].forEach(el=>{
    if(el) new MutationObserver(sync).observe(el, {attributes:true, attributeFilter:['style']});
  });
  sync();
})();

/* Swipe to hide/show sidebar.
   Goals: 
   - Expand on swipe-right from anywhere when collapsed (more sensitive, like IG/TikTok)
   - Collapse on swipe-left only when starting well inside content (avoid accidental while resizing)
   - Ignore gestures starting in sidebar/resizer and while resizing
   - Consider velocity OR distance to feel responsive */
let swipeStart=null;
const SWIPE_MIN_DISTANCE=30; // px
const SWIPE_MIN_VELOCITY=0.45; // px per ms (e.g., 45px in 100ms)
const SWIPE_DIR_RATIO=1.1; // require horizontal dominance: |dx| > |dy|*ratio
document.addEventListener('touchstart',e=>{
  // Don't detect swipes while dragging beds or waiting for long-press
  if(mobileDrag || (selectionMode && willStartDrag)) return;
  
  const t=e.touches[0];
  const target=e.target;
  const inSidebar=!!(target.closest && (target.closest('#sidebar')||target.closest('#resizer')));
  const sidebarEl=document.getElementById('sidebar');
  const sbw=sidebarEl? sidebarEl.getBoundingClientRect().width : 0;
  swipeStart={ x:t.clientX, y:t.clientY, inSidebar, sbw, t0:(performance&&performance.now?performance.now():Date.now()) };
},{passive:true});
document.addEventListener('touchend',e=>{
  // Don't process swipes while dragging beds or in selection mode
  if(mobileDrag || selectionMode) { swipeStart=null; return; }
  
  if(!swipeStart) return;
  const {x: sx, y: sy, inSidebar, sbw, t0} = swipeStart;
  swipeStart=null;
  // ignore if gesture started in sidebar/resizer or while resizing
  if(inSidebar || window.__isResizingSidebar__) return;
  const t=e.changedTouches[0];
  const dx=t.clientX - sx, dy=t.clientY - sy;
  const dt=(performance&&performance.now?performance.now():Date.now()) - (t0||0);
  const vel = dt>0 ? Math.abs(dx)/dt : 0;
  if(Math.abs(dx) > Math.abs(dy)*SWIPE_DIR_RATIO){
    const isCollapsed=document.body.classList.contains('collapsed');
    const fastRight = dx>0 && vel>SWIPE_MIN_VELOCITY;
    const farRight = dx>SWIPE_MIN_DISTANCE;
    const fastLeft = dx<0 && vel>SWIPE_MIN_VELOCITY;
    const farLeft = dx<-SWIPE_MIN_DISTANCE;
    // collapse only if started well inside content (not right next to sidebar border)
    if(!isCollapsed && (farLeft || fastLeft) && sx > sbw + 30){ document.body.classList.add('collapsed'); }
    // expand from anywhere when collapsed (distance OR velocity)
    else if(isCollapsed && (farRight || fastRight)){ document.body.classList.remove('collapsed'); }
  }
},{passive:true});

const sidebar = document.getElementById('sidebar');
const resizer = document.getElementById('resizer');
let isResizingSidebar = false; window.__isResizingSidebar__ = false;

// Load saved width
const savedW = localStorage.getItem(WARD_WIDTH_KEY);
if (savedW) sidebar.style.width = savedW + 'px';

function startResize(e) {
  isResizingSidebar = true; window.__isResizingSidebar__ = true;
  document.body.style.userSelect = 'none';
}
function doResize(e) {
  if (!isResizingSidebar) return;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const containerLeft = document.getElementById('container').getBoundingClientRect().left;
  let newWidth = clientX - containerLeft;
  if (newWidth < 100) newWidth = 100;
  if (newWidth > window.innerWidth * 0.8) newWidth = window.innerWidth * 0.8;
  sidebar.style.width = newWidth + 'px';
}
function stopResize() {
  if (!isResizingSidebar) return;
  localStorage.setItem(WARD_WIDTH_KEY, parseInt(sidebar.style.width));
  isResizingSidebar = false; window.__isResizingSidebar__ = false;
  document.body.style.userSelect = '';
}
resizer.addEventListener('mousedown', startResize);
document.addEventListener('mousemove', doResize);
document.addEventListener('mouseup', stopResize);
resizer.addEventListener('touchstart', startResize, { passive: true });
document.addEventListener('touchmove', doResize, { passive: false });
document.addEventListener('touchend', stopResize);

// Ward Work storage variables - declared early to avoid initialization errors
const WW_PROFILES_KEY='wardWorkProfiles-v2';
const WW_CURRENT_KEY='wardWorkCurrent-v2';
let wwProfiles = {}; // { [id]: { id, name, title, tasks: [{id,bed,task}] } }
let currentWWProfileId = null;

// Initialize profiles and UI
loadProfiles();
refreshProfileUI();
renderWards();renderBeds();

// Initialize WardWork profiles
loadWWProfiles();

// ===== Move Bed wiring =====
const moveBedModal=document.getElementById('moveBedModal');
const moveProfileSelect=document.getElementById('moveProfileSelect');
const moveWardSelect=document.getElementById('moveWardSelect');
const moveNewWardRow=document.getElementById('moveNewWardRow');
const moveNewWardName=document.getElementById('moveNewWardName');
const moveCancelBtn=document.getElementById('moveCancelBtn');
const moveConfirmBtn=document.getElementById('moveConfirmBtn');
let movingBedCtx=null;

function openMoveBedModal(ctx){
  // normalize to multiple
  if(ctx.bedId && !ctx.bedIds) ctx.bedIds=[ctx.bedId];
  movingBedCtx = ctx; // { bedIds, fromWardId, fromProfileId }
  // populate profiles
  moveProfileSelect.innerHTML='';
  Object.values(profileStore.map).forEach(p=>{
    const opt=document.createElement('option'); opt.value=p.id; opt.textContent=p.name; if(p.id===currentProfileId) opt.selected=true; moveProfileSelect.appendChild(opt);
  });
  populateMoveWards(moveProfileSelect.value);
  moveNewWardRow.style.display='none';
  moveNewWardName.value='';
  moveBedModal.style.display='flex';
}
function closeMoveBedModal(){ moveBedModal.style.display='none'; movingBedCtx=null; }
function populateMoveWards(profileId){
  moveWardSelect.innerHTML='';
  const p=profileStore.map[profileId];
  const wards=(p?.data?.wards)||[];
  wards.forEach(w=>{ const opt=document.createElement('option'); opt.value=w.id; opt.textContent=w.name; moveWardSelect.appendChild(opt); });
  const optNew=document.createElement('option'); optNew.value='__new__'; optNew.textContent='— Create new ward —'; moveWardSelect.appendChild(optNew);
  moveWardSelect.value = wards[0]?.id || '__new__';
  moveNewWardRow.style.display = (moveWardSelect.value==='__new__')? 'flex' : 'none';
}
moveProfileSelect?.addEventListener('change', ()=> populateMoveWards(moveProfileSelect.value));
moveWardSelect?.addEventListener('change', ()=>{ moveNewWardRow.style.display = (moveWardSelect.value==='__new__')? 'flex' : 'none'; });
moveCancelBtn?.addEventListener('click', ()=> closeMoveBedModal());
moveBedModal?.addEventListener('click', (e)=>{ if(e.target===moveBedModal) closeMoveBedModal(); });
moveConfirmBtn?.addEventListener('click', ()=>{
  if(!movingBedCtx) return;
  const destPid=moveProfileSelect.value;
  const destWid=moveWardSelect.value;
  let destProfile=profileStore.map[destPid]; if(!destProfile){ alert('Destination profile not found'); return; }
  // ensure destination ward
  let destWardId=destWid;
  if(destWid==='__new__'){
    const name=(moveNewWardName.value||'').trim(); if(!name) return alert('Enter new ward name');
    const newWard={ id: uuid(), name, beds: [] };
    destProfile.data.wards.push(newWard); destWardId=newWard.id;
  }
  const ids = Array.isArray(movingBedCtx.bedIds)? movingBedCtx.bedIds : (movingBedCtx.bedId? [movingBedCtx.bedId] : []);
  if(ids.length===0) return;
  moveBedsBetweenWards(ids, movingBedCtx.fromWardId, movingBedCtx.fromProfileId, destWardId, destPid);
  closeMoveBedModal();
  // no popup; UI updates immediately
});

// ========== Google Sheet profile helpers ==========
function parseCSV(text){
  const rows=[]; let cur=[], i=0, c='', q=false, val='';
  while(i<text.length){
    c=text[i++];
    if(q){
      if(c==='"'){
        if(text[i]==='"'){ val+='"'; i++; } else { q=false; }
      } else { val+=c; }
    } else {
      if(c==='"'){ q=true; }
      else if(c===','){ cur.push(val); val=''; }
      else if(c==='\n'){ cur.push(val); rows.push(cur); cur=[]; val=''; }
      else if(c==='\r'){ /* ignore */ }
      else { val+=c; }
    }
  }
  if(val.length>0 || cur.length>0) { cur.push(val); rows.push(cur); }
  return rows;
}

function normalizeGoogleCsvUrl(url){
  try{
    const u=new URL(url);
    if(u.hostname.includes('docs.google.com') && u.pathname.includes('/spreadsheets/')){
      // If it's already a GVIZ CSV-by-name link, keep as-is
      if(u.pathname.includes('/gviz/')) return url;
      // If already a CSV export/published link, keep
      if(u.pathname.includes('/export') && (u.searchParams.get('format')||'').toLowerCase()==='csv') return url;
      if(u.pathname.includes('/pub') && (u.searchParams.get('output')||'').toLowerCase()==='csv') return url;
      // Transform an edit/view link to CSV export
      const parts=u.pathname.split('/');
      const idIdx=parts.indexOf('d');
      const sheetId = (idIdx>=0 && parts[idIdx+1]) ? parts[idIdx+1] : null;
      let gid = u.searchParams.get('gid');
      if(!gid && u.hash && u.hash.includes('gid=')){
        const m=u.hash.match(/gid=(\d+)/); if(m) gid=m[1];
      }
      if(sheetId){
        const out = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/export`);
        out.searchParams.set('format','csv');
        out.searchParams.set('gid', gid || '0');
        return out.toString();
      }
    }
  }catch{}
  return url;
}

function extractSheetId(url){
  try{
    const u=new URL(url);
    if(u.hostname.includes('docs.google.com') && u.pathname.includes('/spreadsheets/')){
      const parts=u.pathname.split('/');
      const idx=parts.indexOf('d');
      const sheetId=(idx>=0 && parts[idx+1])? parts[idx+1] : null;
      return sheetId;
    }
  }catch{}
  return null;
}

async function fetchCsvRows(url){
  // Add cache-busting to avoid stale cached responses
  const finalUrl = url + (url.includes('?')? '&' : '?') + 'cachebust=' + Date.now();
  let lastErr=null;
  for(let attempt=1; attempt<=3; attempt++){
    try{
      const res=await fetch(finalUrl, { credentials:'omit', cache:'no-store' });
      if(!res.ok) throw new Error('HTTP '+res.status);
      const ctype=(res.headers.get('content-type')||'').toLowerCase();
      const txt=await res.text();
      // Avoid HTML (means wrong link or not public)
      if(ctype.includes('text/html') || /^\s*<!doctype html|^\s*<html/i.test(txt)){
        const err=new Error('HTML_RESP'); err.name='HTML_RESP'; throw err;
      }
      return parseCSV(txt);
    }catch(e){
      lastErr=e; // brief backoff
      await new Promise(r=> setTimeout(r, attempt*300));
    }
  }
  // Build helpful message
  if(lastErr){
    const msg=(lastErr&&lastErr.message)||'';
    if(msg.includes('HTML_RESP')){
      throw new Error('URL returned HTML, not CSV. Publish the sheet to the web as CSV or use an /export?format=csv&gid=… link that is publicly accessible.');
    }
    if(/HTTP 403/.test(msg)){
      throw new Error('HTTP 403 (Forbidden). Make sure the sheet is public: File → Share → Publish to web (CSV) or set Anyone with the link → Viewer.');
    }
    if(/HTTP 404/.test(msg)){
      throw new Error('HTTP 404 (Not found). Check the sheet ID/gid in the URL and that the sheet/tab exists.');
    }
    if(/HTTP 429/.test(msg)){
      throw new Error('HTTP 429 (Rate limited). Try again in a moment.');
    }
    throw new Error('Failed to fetch CSV ('+msg+'). Check the URL and visibility.');
  }
  throw new Error('Failed to fetch CSV (unknown error)');
}

// Fetch list of tabs (title + gid) for a given sheetId by scraping the htmlview page
async function fetchSheetTabs(sheetId){
  try{
    const url=`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`;
    const res=await fetch(url, { credentials:'omit', cache:'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const html=await res.text();
    // Heuristic parse: find anchors with #gid= and capture the label nearby
    const map=new Map();
    // Pattern: <a [^>]*href="...#gid=12345"[^>]*>(Sheet Name)<
    const re=/<a[^>]+href=["'][^"']*#gid=(\d+)[^"']*["'][^>]*>([^<]{1,80})<\/a>/gi;
    let m;
    while((m=re.exec(html))){
      const gid=m[1];
      const title=m[2].trim();
      if(!map.has(gid) && title && !title.startsWith('<')){ map.set(gid, title); }
    }
    // Fallback: try data attributes used in tabs markup
    if(map.size===0){
      const re2=/gid=(\d+).*?>([^<]+)</gis;
      while((m=re2.exec(html))){ const gid=m[1]; const title=(m[2]||'').trim(); if(gid && title && !map.has(gid)) map.set(gid,title); }
    }
    return Array.from(map.entries()).map(([gid,title])=>({ gid, title }));
  }catch(e){ return []; }
}

function buildDataFromSheetRows(rows, opts){
  const { hasHeader, wardCol, bedCol, nameCol, dxCol, statusCol, hnCol, appendNameToBed } = opts;
  const start = hasHeader? 1 : 0;
  const wardsMap = new Map();
  for(let r=start;r<rows.length;r++){
    const row=rows[r]||[];
    const ward=(row[wardCol]||'').toString().trim();
    const bed=(row[bedCol]||'').toString().trim();
    const name=(nameCol!=null? (row[nameCol]||'').toString().trim(): '');
    let dx=(dxCol!=null? (row[dxCol]||'').toString(): '').trim();
    const hn=(hnCol!=null? (row[hnCol]||'').toString().trim() : '');
    const stRaw = (statusCol!=null? (row[statusCol]||'').toString(): '').trim();
    if(!ward && !bed && !name && !dx) continue;
    let bedName=bed;
    if(appendNameToBed && name){ bedName = (bedName? (bedName+' ') : '') + name; }
    // Normalize dx into hashtags, line-separated
    let tags='';
    if(dx){
      const parts = dx.split(/\r?\n|,|;|\|/).map(s=>s.trim()).filter(Boolean);
      tags = parts.map(s=> s.startsWith('#')? s : '#'+s).join('\n');
    }
    // Map status
    let status='active';
    if(stRaw){
      const s=stRaw.toLowerCase();
      if(s.includes('dis') || s==='dc' || s==='d/c' || s.includes('discharge')) status='discharge';
      else if(s.includes('act') || s.includes('adm') || s.includes('admit')) status='active';
      // numeric/flag cases: 0=discharge, 1=active (heuristic)
      else if(s==='0') status='discharge';
      else if(s==='1') status='active';
    }
    if(!wardsMap.has(ward)) wardsMap.set(ward, []);
    const beds=wardsMap.get(ward);
    const bedObj={ id: uuid(), name: bedName || (name||'Bed'), status, details: JSON.stringify({ bed: bedName, hashtags: tags, cli:'', mx:'', bt:'', pr:'', rr:'', bp:'', o2:'', io:[{in:[],out:[]},{in:[],out:[]}], preview:'', lastSegments:null }) };
    if(hn) bedObj.hn = hn;
    beds.push(bedObj);
  }
  const wards=[...wardsMap.entries()].map(([name,beds])=>({ id: uuid(), name: name||'Ward', beds }));
  return { wards };
}

async function refreshCurrentSheetProfile(){
  const cur=profileStore.map[currentProfileId];
  if(!cur || !cur.sheetConfig) return alert('Current profile is not configured with a Google Sheet');
  const cfg={...cur.sheetConfig, csvUrl: normalizeGoogleCsvUrl(cur.sheetConfig.csvUrl)};
  try{
    const rows=await fetchCsvRows(cfg.csvUrl);
    const dataObj=buildDataFromSheetRows(rows, cfg);
    data = dataObj;
    saveData(); // persists into profile
    renderWards(); renderBeds();
    alert('Sheet refreshed');
  }catch(err){ alert('Failed to refresh: '+err.message); }
}

/* Simplified notify editor adapted from test/app.js, scoped to avoid collisions */
const notifyEditor=(function(){
  const $$=(sel,root=document)=>root.querySelector(sel);

  function el(tag, attrs={}, ...children){
    const e=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==='class') e.className=v;
      else if(k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if(k==='dataset') Object.entries(v).forEach(([dk,dv])=> e.dataset[dk]=dv);
      else e.setAttribute(k,v);
    });
    children.flat().forEach(c=>{ if(c!=null) e.appendChild(typeof c==='string'?document.createTextNode(c):c); });
    return e;
  }
  function parseAmount(v){ if(!v) return 0; const m=(''+v).match(/-?\d+(?:[.,]\d+)?/); return m?parseFloat(m[0].replace(',','.')):0; }
  function sumLines(lines){ return Array.from(lines.querySelectorAll('input.amount')).reduce((s,inp)=> s+parseAmount(inp.value),0); }
  function getOverride(blockEl){
    const oi=blockEl.querySelector('.override-in'), oo=blockEl.querySelector('.override-out');
    return { in: parseAmount(oi?.value), out: parseAmount(oo?.value), hasIn: !!(oi && oi.value.trim()!==''), hasOut: !!(oo && oo.value.trim()!=='') };
  }
  
  // I/O Snippets storage
  const IO_SNIPPETS_KEY = 'io-snippets-v1';
  function loadIOSnippets(){
    try{
      const saved = JSON.parse(localStorage.getItem(IO_SNIPPETS_KEY) || '{}');
      return {
        in: saved.in || ['oral', 'ivf', 'นม'],
        out: saved.out || ['urine', 'drain']
      };
    }catch{
      return { in: ['oral', 'ivf', 'นม'], out: ['urine', 'drain'] };
    }
  }
  function saveIOSnippets(snippets){
    try{
      localStorage.setItem(IO_SNIPPETS_KEY, JSON.stringify(snippets));
    }catch{}
  }
  let ioSnippets = loadIOSnippets();
  
  // I/O Snippets Modal Setup
  const ioSnippetsModal = document.getElementById('ioSnippetsModal');
  const ioSnippetsClose = document.getElementById('ioSnippetsClose');
  const ioSnippetsList = document.getElementById('ioSnippetsList');
  const ioSnippetsNew = document.getElementById('ioSnippetsNew');
  const ioSnippetsAdd = document.getElementById('ioSnippetsAdd');
  const ioSnippetsTitle = document.getElementById('ioSnippetsTitle');
  let currentSnippetType = 'in'; // 'in' or 'out'

  function openIOSnippetsModal(type) {
    currentSnippetType = type;
    if(ioSnippetsTitle) ioSnippetsTitle.textContent = type === 'in' ? 'I Snippets' : 'O Snippets';
    buildIOSnippetsUI();
    if(ioSnippetsModal) ioSnippetsModal.style.display = 'flex';
  }

  function closeIOSnippetsModal() {
    if(ioSnippetsModal) ioSnippetsModal.style.display = 'none';
  }

  function buildIOSnippetsUI() {
    if(!ioSnippetsList) return;
    ioSnippetsList.innerHTML = '';
    const snippets = ioSnippets[currentSnippetType] || [];
    snippets.forEach((text, idx) => {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr auto';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = text;
      inp.style.padding = '8px';
      inp.addEventListener('input', () => {
        ioSnippets[currentSnippetType][idx] = inp.value;
        saveIOSnippets(ioSnippets);
      });
      
      const del = document.createElement('button');
      del.textContent = '×';
      del.className = 'ghost';
      del.title = 'Delete';
      del.onclick = () => {
        ioSnippets[currentSnippetType].splice(idx, 1);
        saveIOSnippets(ioSnippets);
        buildIOSnippetsUI();
      };
      
      row.appendChild(inp);
      row.appendChild(del);
      ioSnippetsList.appendChild(row);
    });
  }

  ioSnippetsClose?.addEventListener('click', closeIOSnippetsModal);
  ioSnippetsModal?.addEventListener('click', (e) => {
    if(e.target === ioSnippetsModal) closeIOSnippetsModal();
  });

  ioSnippetsAdd?.addEventListener('click', () => {
    const val = ioSnippetsNew?.value.trim();
    if(!val) return;
    if(!ioSnippets[currentSnippetType]) ioSnippets[currentSnippetType] = [];
    ioSnippets[currentSnippetType].push(val);
    saveIOSnippets(ioSnippets);
    if(ioSnippetsNew) ioSnippetsNew.value = '';
    buildIOSnippetsUI();
  });

  ioSnippetsNew?.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') {
      e.preventDefault();
      ioSnippetsAdd?.click();
    }
  });

  // Wire up snippet buttons using event delegation
  document.body.addEventListener('click', (e) => {
    if(e.target.classList.contains('io-snippets-btn')) {
      const type = e.target.getAttribute('data-type');
      openIOSnippetsModal(type);
    }
  });
  
  // Helper function for drag and drop positioning
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.io-line:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  
  function recalc(blockEl){
    const ov=getOverride(blockEl);
    const calcIn=sumLines(blockEl.querySelector('.lines.in'));
    const calcOut=sumLines(blockEl.querySelector('.lines.out'));
    const sumIn=ov.hasIn?ov.in:calcIn;
    const sumOut=ov.hasOut?ov.out:calcOut;
    const net=sumIn-sumOut;
    blockEl.querySelector('.sum-in').textContent=Math.round(sumIn);
    blockEl.querySelector('.sum-out').textContent=Math.round(sumOut);
    const netSpan=blockEl.querySelector('.net');
    netSpan.textContent=(net>=0?'+':'')+Math.round(net);
    netSpan.classList.toggle('neg', net<0);
    updatePreview();
  }
  function recalcAll(){ document.querySelectorAll('.io-block').forEach(b=>recalc(b)); }
  function addIOLine(container, kind){
    const line=el('div',{class:'io-line'});
    line.draggable = true;
    
    // Add drag handle
    const dragHandle = el('div', {class: 'drag-handle'});
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = 'Drag to reorder';
    
    // Remove button (top right)
    const rm=el('button',{
      class:'remove',
      type: 'button',
      onclick:()=>{ 
        line.remove(); 
        recalc(container.closest('.io-block')); 
        updatePreview();
        if(changeCb) changeCb(); 
      }
    },'×');
    
    // Create wrapper for kind input with dropdown button
    const kindWrapper = el('div', {class: 'kind-wrapper'});
    kindWrapper.style.position = 'relative';
    kindWrapper.style.display = 'flex';
    kindWrapper.style.alignItems = 'flex-start';
    
    const kindInput=el('textarea',{class:'kind',placeholder:kind==='in'?'oral / ivf / นม / ...':'urine / drain / ...'});
    kindInput.rows = 1;
    kindInput.style.paddingRight = '30px'; // Make room for dropdown button
    kindInput.style.resize = 'none';
    kindInput.style.overflow = 'hidden';
    
    // Auto-resize textarea as content grows
    kindInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
    
    const dropdownBtn = el('button', {class: 'snippet-dropdown-btn', type: 'button'});
    dropdownBtn.textContent = '▾';
    dropdownBtn.style.position = 'absolute';
    dropdownBtn.style.right = '4px';
    dropdownBtn.style.top = '8px';
    dropdownBtn.style.background = 'transparent';
    dropdownBtn.style.border = 'none';
    dropdownBtn.style.cursor = 'pointer';
    dropdownBtn.style.padding = '4px 8px';
    dropdownBtn.style.fontSize = '14px';
    dropdownBtn.style.color = '#666';
    dropdownBtn.title = 'Show snippets';
    
    kindWrapper.appendChild(kindInput);
    kindWrapper.appendChild(dropdownBtn);
    
    const displayInput=el('textarea',{class:'display',placeholder:'e.g., 500+ท1'});
    displayInput.rows = 1;
    displayInput.style.resize = 'none';
    displayInput.style.overflow = 'hidden';
    displayInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
    
    const amount=el('textarea',{class:'amount',placeholder:'500'});
    amount.rows = 1;
    amount.style.resize = 'none';
    amount.style.overflow = 'hidden';
    amount.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
    
    line.append(dragHandle, rm, kindWrapper, displayInput, amount);
    container.appendChild(line);
    
    // Drag and drop handlers
    line.addEventListener('dragstart', (e) => {
      line.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    line.addEventListener('dragend', (e) => {
      line.classList.remove('dragging');
      recalc(container.closest('.io-block'));
      if(changeCb) changeCb();
    });
    
    // Function to show snippet dropdown
    const showSnippetDropdown = (filter = '') => {
      const snippets = ioSnippets[kind] || [];
      if(snippets.length === 0) return;
      
      // Filter snippets based on input
      const filtered = filter ? snippets.filter(s => s.toLowerCase().includes(filter.toLowerCase())) : snippets;
      if(filtered.length === 0) return;
      
      // Remove existing dropdown
      const existing = document.querySelector('.io-snippet-suggestions');
      if(existing) existing.remove();
      const existingBackdrop = document.querySelector('.io-snippet-backdrop');
      if(existingBackdrop) existingBackdrop.remove();
      
      // Create backdrop for mobile (invisible, just to catch taps)
      const backdrop = document.createElement('div');
      backdrop.className = 'io-snippet-backdrop';
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.right = '0';
      backdrop.style.bottom = '0';
      backdrop.style.zIndex = '999';
      backdrop.style.background = 'transparent';
      backdrop.addEventListener('click', () => {
        const dropdown = document.querySelector('.io-snippet-suggestions');
        if(dropdown) dropdown.remove();
        backdrop.remove();
      });
      backdrop.addEventListener('touchstart', () => {
        const dropdown = document.querySelector('.io-snippet-suggestions');
        if(dropdown) dropdown.remove();
        backdrop.remove();
      });
      
      document.body.appendChild(backdrop);
      
      // Create suggestion dropdown
      const dropdown = document.createElement('div');
      dropdown.className = 'io-snippet-suggestions';
      dropdown.style.position = 'fixed'; // Changed from absolute to fixed
      dropdown.style.background = '#fff';
      dropdown.style.border = '1px solid #ddd';
      dropdown.style.borderRadius = '4px';
      dropdown.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      dropdown.style.zIndex = '1000';
      dropdown.style.maxHeight = '200px';
      dropdown.style.overflowY = 'auto';
      dropdown.style.minWidth = '150px';
      
      filtered.forEach(text => {
        const item = document.createElement('div');
        item.textContent = text;
        item.style.padding = '8px 12px';
        item.style.cursor = 'pointer';
        item.style.borderBottom = '1px solid #f0f0f0';
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          kindInput.value = text;
          dropdown.remove();
          const backdrop = document.querySelector('.io-snippet-backdrop');
          if(backdrop) backdrop.remove();
          displayInput.focus();
          updatePreview();
          if(changeCb) changeCb();
        });
        item.addEventListener('touchstart', (e) => {
          e.preventDefault();
          kindInput.value = text;
          dropdown.remove();
          const backdrop = document.querySelector('.io-snippet-backdrop');
          if(backdrop) backdrop.remove();
          displayInput.focus();
          updatePreview();
          if(changeCb) changeCb();
        });
        item.addEventListener('mouseover', () => {
          item.style.background = '#f0f0f0';
        });
        item.addEventListener('mouseout', () => {
          item.style.background = '';
        });
        dropdown.appendChild(item);
      });
      
      document.body.appendChild(dropdown);
      
      // Position dropdown below input using fixed positioning
      const rect = kindInput.getBoundingClientRect();
      dropdown.style.left = rect.left + 'px';
      dropdown.style.top = (rect.bottom + 2) + 'px';
      dropdown.style.width = Math.max(150, rect.width) + 'px';
      
      // Reposition on scroll (for mobile)
      const repositionDropdown = () => {
        if(document.body.contains(dropdown)) {
          const newRect = kindInput.getBoundingClientRect();
          dropdown.style.left = newRect.left + 'px';
          dropdown.style.top = (newRect.bottom + 2) + 'px';
        }
      };
      
      // Listen for scroll events
      let scrollTimeout;
      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(repositionDropdown, 10);
      };
      window.addEventListener('scroll', handleScroll, true);
      
      // Clean up scroll listener when dropdown is removed
      const originalRemove = dropdown.remove.bind(dropdown);
      dropdown.remove = () => {
        window.removeEventListener('scroll', handleScroll, true);
        const backdrop = document.querySelector('.io-snippet-backdrop');
        if(backdrop) backdrop.remove();
        originalRemove();
      };
      
      return dropdown;
    };
    
    // Show suggestions when typing (only if there's input)
    kindInput.addEventListener('input', () => {
      const val = kindInput.value.trim();
      if(val) {
        showSnippetDropdown(val);
      } else {
        // Remove dropdown if input is cleared
        const existing = document.querySelector('.io-snippet-suggestions');
        if(existing) existing.remove();
      }
      if(changeCb) changeCb();
    });
    
    // Dropdown button click - show all snippets
    let dropdownBtnClicked = false;
    let isScrolling = false;
    
    dropdownBtn.addEventListener('mousedown', (e) => {
      dropdownBtnClicked = true;
    });
    dropdownBtn.addEventListener('touchstart', (e) => {
      dropdownBtnClicked = true;
    });
    dropdownBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showSnippetDropdown('');
      setTimeout(() => {
        dropdownBtnClicked = false;
      }, 200);
    });
    
    // Track scrolling to prevent blur from closing dropdown
    let scrollTimer;
    const handleInputScroll = () => {
      isScrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isScrolling = false;
      }, 300);
    };
    window.addEventListener('scroll', handleInputScroll, true);
    window.addEventListener('touchmove', handleInputScroll, true);
    
    // Close dropdown on blur (unless dropdown button was clicked or user is scrolling)
    kindInput.addEventListener('blur', () => {
      setTimeout(() => {
        if(!dropdownBtnClicked && !isScrolling) {
          const dropdown = document.querySelector('.io-snippet-suggestions');
          if(dropdown) dropdown.remove();
          const backdrop = document.querySelector('.io-snippet-backdrop');
          if(backdrop) backdrop.remove();
        }
      }, 150);
    });
    
    // Auto-fill amount from display if display is just a number
    displayInput.addEventListener('input',()=>{ 
      const val = displayInput.value.trim();
      // Check if the value is purely numeric (optionally with decimal point)
      if(val && /^\d+(\.\d+)?$/.test(val)) {
        amount.value = val;
      } else {
        // If it contains text/symbols, clear the amount box
        amount.value = '';
      }
      updatePreview(); 
      if(changeCb) changeCb(); 
      recalc(container.closest('.io-block'));
    });
    
    // Any change in IO should autosave
    amount.addEventListener('input',()=>{ recalc(container.closest('.io-block')); if(changeCb) changeCb(); });
    kindInput.addEventListener('input',()=>{ updatePreview(); if(changeCb) changeCb(); });
  }
  function gatherIO(blockEl){
    const read=cls=>Array.from(blockEl.querySelectorAll(`.lines.${cls} .io-line`)).map(line=>{
      const kindEl = line.querySelector('.kind');
      const displayEl = line.querySelector('.display');
      const amountEl = line.querySelector('.amount');
      return {
        kind: kindEl?.value.trim()||'',
        display: displayEl?.value.trim()||'',
        amount: parseAmount(amountEl?.value||'')
      };
    }).filter(x=>x.kind||x.amount);
    const ov=getOverride(blockEl);
    return { in: read('in'), out: read('out'), override: ov };
  }
  function formatIO(label,data){
    const calcIn=data.in.reduce((s,x)=>s+x.amount,0);
    const calcOut=data.out.reduce((s,x)=>s+x.amount,0);
    const sumIn=data.override?.hasIn?data.override.in:calcIn;
    const sumOut=data.override?.hasOut?data.override.out:calcOut;
    const net=sumIn-sumOut;
    const fmtPairs=arr=>arr.map(x=>{
      const kind = x.kind || '?';
      // If display is provided, use it
      if(x.display && x.display.trim()) {
        return `${kind} ${x.display.trim()}`;
      }
      // If amount is 0 or empty, show only kind
      if(!x.amount || x.amount === 0) {
        return kind;
      }
      // Otherwise show kind + amount
      return `${kind} ${Math.round(x.amount)}`;
    }).join(', ');
    const lines=[];
    lines.push(`I/O ${label}:`);
    lines.push(`I: ${Math.round(sumIn)} (${fmtPairs(data.in)})`);
    lines.push(`O: ${Math.round(sumOut)} (${fmtPairs(data.out)})`);
    if(!Number.isNaN(net)) lines.push(`${net>=0?'Pos':'Neg'}${Math.round(Math.abs(net))}`);
    return lines.join('\n');
  }
  let currentWardName='';
  function buildSegments(){
    const bed=$$('#bed').value.trim();
    const hashtags=$$('#hashtags').value.trim();
    const cli=$$('#cli').value.trim();
    const mx=$$('#mx')?.value.trim();
    const vs={ bt: $$('#bt').value.trim(), pr: $$('#pr').value.trim(), rr: $$('#rr').value.trim(), bp: $$('#bp').value.trim(), o2: $$('#o2').value.trim() };
    const morning=gatherIO(document.querySelector('.io-block[data-block="morning"]'));
    const afternoon=gatherIO(document.querySelector('.io-block[data-block="afternoon"]'));
    const sumIn=a=>a.in.reduce((s,x)=>s+x.amount,0);
    const sumOut=a=>a.out.reduce((s,x)=>s+x.amount,0);
    const mIn= morning.override.hasIn?morning.override.in:sumIn(morning);
    const mOut= morning.override.hasOut?morning.override.out:sumOut(morning);
    const aIn= afternoon.override.hasIn?afternoon.override.in:sumIn(afternoon);
    const aOut= afternoon.override.hasOut?afternoon.override.out:sumOut(afternoon);
    const totalIn=mIn+aIn, totalOut=mOut+aOut, totalNet=totalIn-totalOut;

    const seg={};
    // Compose header: ward/bed unless ward already has '/'
    const ward = (currentWardName||'').trim();
    let header = bed;
    if(ward){
      header = ward.includes('/') ? `${ward} ${bed}`.trim() : `${ward}/${bed}`.trim();
    }
    seg.header = header;
    seg.hashtags=hashtags?hashtags.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>s.startsWith('#')?s:`#${s}`).join('\n'):'';
    seg.cli=cli?`\nCli: ${cli}`:'';
    const vsParts=[]; if(vs.bt)vsParts.push(`BT ${vs.bt}`); if(vs.pr)vsParts.push(`PR ${vs.pr}`); if(vs.rr)vsParts.push(`RR ${vs.rr}`); if(vs.bp)vsParts.push(`BP ${vs.bp}`); if(vs.o2)vsParts.push(`O2sat ${vs.o2.replace(/%?$/,'%')}`);
    seg.vs=vsParts.length?`\nV/S ${vsParts.join(' ')}`:'';
    const hasMorning = (morning.in?.length||0) > 0 || (morning.out?.length||0) > 0 || morning.override?.hasIn || morning.override?.hasOut;
    const hasAfternoon = (afternoon.in?.length||0) > 0 || (afternoon.out?.length||0) > 0 || afternoon.override?.hasIn || afternoon.override?.hasOut;
    seg.ioMorning = hasMorning ? ('\n' + formatIO('เช้า', morning)) : '';
    seg.ioAfternoon = hasAfternoon ? ('\n' + formatIO('บ่าย', afternoon)) : '';
    seg.total = (hasMorning || hasAfternoon) ? (`\nI/O รวม: ${Math.round(totalIn)}/${Math.round(totalOut)} (${totalNet>=0?'+':''}${Math.round(totalNet)})`) : '';
    seg.mx=mx?`\nMx: ${mx}`:'';
    return seg;
  }
  function compose(seg){
    const parts=[]; if(seg.header)parts.push(seg.header); if(seg.hashtags)parts.push(seg.hashtags); if(seg.cli)parts.push(seg.cli); if(seg.vs)parts.push(seg.vs); if(seg.ioMorning)parts.push(seg.ioMorning); if(seg.ioAfternoon)parts.push(seg.ioAfternoon); if(seg.total)parts.push(seg.total); if(seg.mx)parts.push(seg.mx);
    return parts.join('\n').replace(/\n\n\n+/g,'\n\n').trim();
  }
  let lastSegments=null;
  function updatePreview(){
    const segNew=buildSegments();
    const out=document.getElementById('output');
    let current=out.textContent||'';
    if(!current){ out.textContent=compose(segNew); lastSegments=segNew; return; }
    let updated=current;
    if(lastSegments){
      const keys=['header','hashtags','cli','vs','ioMorning','ioAfternoon','total','mx'];
      const presenceChanged = keys.some(k => !!(lastSegments[k]) !== !!(segNew[k]));
      if(presenceChanged){
        updated = compose(segNew);
      } else {
        for(const k of keys){
          const oldSeg=lastSegments[k]||''; const newSeg=segNew[k]||'';
          if(oldSeg && updated.includes(oldSeg)){
            updated = updated.replace(oldSeg,newSeg);
          }
        }
      }
    } else updated=compose(segNew);
    out.textContent=updated; lastSegments=segNew;
  }
  function initIO(){
    document.querySelectorAll('.io-block').forEach(block=>{
      const linesIn=block.querySelector('.lines.in');
      const linesOut=block.querySelector('.lines.out');
      // start with 1 line each; user can add more via + Add buttons
      addIOLine(linesIn,'in');
      addIOLine(linesOut,'out');
    });
  }
  function loadFromDetails(details){
    const d=details||{};
    $$('#bed').value=d.bed||''; $$('#hashtags').value=d.hashtags||d.dx||'';
    if($$('#hn')) $$('#hn').value = d.hn || '';
    $$('#cli').value=d.cli||''; $$('#mx').value=d.mx||'';
    $$('#bt').value=d.bt||''; $$('#pr').value=d.pr||''; $$('#rr').value=d.rr||''; $$('#bp').value=d.bp||''; $$('#o2').value=d.o2||'';
    const blocks=document.querySelectorAll('.io-block');
    const io=d.io||[{in:[],out:[]},{in:[],out:[]}];
    ['morning','afternoon'].forEach((_,idx)=>{
      const block=blocks[idx];
      const linesIn=block.querySelector('.lines.in'), linesOut=block.querySelector('.lines.out');
      linesIn.innerHTML=''; linesOut.innerHTML='';
      const inArr=io[idx]?.in||[], outArr=io[idx]?.out||[];
      for(let i=0;i<Math.max(3,inArr.length);i++){
        addIOLine(linesIn,'in');
        const last=linesIn.lastElementChild; const x=inArr[i]||{};
        last.querySelector('.kind').value=x.kind||''; last.querySelector('.display').value=x.display||''; last.querySelector('.amount').value=(x.amount??'');
      }
      for(let i=0;i<Math.max(3,outArr.length);i++){
        addIOLine(linesOut,'out');
        const last=linesOut.lastElementChild; const x=outArr[i]||{};
        last.querySelector('.kind').value=x.kind||''; last.querySelector('.display').value=x.display||''; last.querySelector('.amount').value=(x.amount??'');
      }
      const ov=io[idx]?.override||{};
      const oi=block.querySelector('.override-in'), oo=block.querySelector('.override-out');
      if(oi) oi.value = ov.hasIn ? ov.in : '';
      if(oo) oo.value = ov.hasOut ? ov.out : '';
    });
    updatePreview();
  }
  function getData(){
    const blocks=document.querySelectorAll('.io-block');
    const io=[...blocks].map(gatherIO);
    const seg=buildSegments(); // keep composed
    return {
      bed: $$('#bed').value, hn: ($$('#hn')?.value||''), hashtags: $$('#hashtags').value,
      cli: $$('#cli').value, mx: $$('#mx').value, bt: $$('#bt').value, pr: $$('#pr').value, rr: $$('#rr').value, bp: $$('#bp').value, o2: $$('#o2').value,
      io, preview: document.getElementById('output').textContent, lastSegments: null
    };
  }
  function bindActions(){
    const copyBtn=document.getElementById('copy');
    async function copyText(text){
      try{
        if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(text); return true; }
      }catch{}
      try{
        const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); const ok=document.execCommand('copy'); document.body.removeChild(ta); return ok;
      }catch{} return false;
    }
    copyBtn?.addEventListener('click', async ()=>{
      const ok=await copyText(document.getElementById('output').textContent);
      copyBtn.textContent=ok?'Copied':'Copy failed'; setTimeout(()=>copyBtn.textContent='Copy',1400);
    });
    // mobile sheet
    const sheet=document.getElementById('mobilePreviewSheet');
    const mobileBody=document.getElementById('mobilePreviewBody');
    const toggleBtn=document.getElementById('togglePreview');
    const closeSheet=document.getElementById('closeSheet');
    const copyMobile=document.getElementById('copyMobile');
    const grabber=document.getElementById('sheetGrabber');
  const PREVIEW_H_KEY='notify-preview-height-v1';
  const PREVIEW_OPEN_KEY='notify-preview-open-v1';
    // apply saved height
    try{
      const saved=localStorage.getItem(PREVIEW_H_KEY);
      if(saved){
        const val=parseFloat(saved);
        if(!Number.isNaN(val)) sheet.style.height = val + 'vh';
      }
    }catch{}
    function mountPreview(){
      let out=document.getElementById('output');
      if(out.parentElement!==mobileBody) mobileBody.appendChild(out);
    }
    window.addEventListener('resize', mountPreview); mountPreview();
    function openSheet(){
            // Tab name input handlers: build GVIZ CSV URL by name
            function applyTabNameFetch(){
              const name=(sheetTabName?.value||'').trim(); if(!name) return;
              const gviz=`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
              sheetFetchStatus.textContent='Fetching tab by name…';
              fetchCsvRows(gviz).then(rows2=>{
                sheetRowsCache=rows2; renderSheetPreview(); highlightSheetPreview(); sheetFetchStatus.textContent='Columns loaded (tab name)';
                sheetCsvUrl.value = gviz; // persist GVIZ URL for create/refresh
              }).catch(err=>{ sheetFetchStatus.textContent='Failed (tab name): '+err.message; });
            }
            sheetTabName?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); applyTabNameFetch(); }});
            sheetTabName?.addEventListener('blur', ()=>{ /* optional: fetch on blur if user typed */ });
      // ensure preview element is mounted into sheet
      const out=document.getElementById('output');
      if(out && out.parentElement!==mobileBody) mobileBody.appendChild(out);
      sheet.classList.add('open');
      try{ localStorage.setItem(PREVIEW_OPEN_KEY,'true'); }catch{}
    }
    function closeSheetFn(){ sheet.classList.remove('open'); try{ localStorage.setItem(PREVIEW_OPEN_KEY,'false'); }catch{} }
  toggleBtn?.addEventListener('click', ()=>{ if(sheet.classList.contains('open')) closeSheetFn(); else openSheet(); });
    closeSheet?.addEventListener('click', ()=> closeSheetFn());
    copyMobile?.addEventListener('click', async ()=>{
      const ok=await copyText(document.getElementById('output').textContent);
      copyMobile.textContent=ok?'Copied':'Copy failed'; setTimeout(()=>copyMobile.textContent='Copy',1400);
    });
    document.getElementById('mobilePreviewBody')?.addEventListener('click', (e)=>{
      const previewEl=document.getElementById('output'); const sel=window.getSelection(); const isEditing=document.activeElement===previewEl;
      if(!isEditing && sel && sel.isCollapsed){ closeSheetFn(); }
    });
    let openedOnce=false; const origUpdate=updatePreview;
    // Respect saved open/closed state; if no state saved, auto-open once on first edit
    try{
      const savedOpen=localStorage.getItem(PREVIEW_OPEN_KEY);
      if(savedOpen==='true'){ openSheet(); openedOnce=true; }
      else if(savedOpen==='false'){ sheet.classList.remove('open'); openedOnce=true; }
    }catch{}
    updatePreview=function(){ origUpdate(); if(!openedOnce){ openSheet(); openedOnce=true; } };
    document.getElementById('output').addEventListener('input', ()=>{ /* keep live edits */ if(changeCb) changeCb(); });
    // drag to resize preview height
    let resizing=false; let startY=0; let startH=0;
    function onStart(ev){
      resizing=true;
      startY = (ev.touches? ev.touches[0].clientY : ev.clientY);
      startH = sheet.getBoundingClientRect().height;
      document.body.style.userSelect='none';
    }
    function onMove(ev){
      if(!resizing) return;
      const y = (ev.touches? ev.touches[0].clientY : ev.clientY);
      const dy = startY - y; // drag up increases height
      let newH = startH + dy;
      const minH = window.innerHeight * 0.25;
      const maxH = window.innerHeight * 0.9;
      if(newH < minH) newH = minH;
      if(newH > maxH) newH = maxH;
      sheet.style.height = newH + 'px';
      if(ev.cancelable) ev.preventDefault();
    }
    function onEnd(){
      if(!resizing) return;
      resizing=false;
      document.body.style.userSelect='';
      // persist as vh
      const hpx = parseFloat(sheet.style.height);
      if(!Number.isNaN(hpx) && window.innerHeight){
          const vh = (hpx / window.innerHeight) * 100;
          const rounded = Math.round(vh*10)/10; // store to 0.1vh for smoother restore
          try{ localStorage.setItem(PREVIEW_H_KEY, String(rounded)); }catch{}
      }
    }
    grabber?.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove, { passive:false });
    document.addEventListener('mouseup', onEnd);
    grabber?.addEventListener('touchstart', onStart, { passive:true });
    document.addEventListener('touchmove', onMove, { passive:false });
    document.addEventListener('touchend', onEnd);
    // reset behavior
    const resetBtn=document.getElementById('resetFab');
    resetBtn?.addEventListener('click', ()=>{
      const ok=confirm('Reset current patient data?');
      if(!ok) return;
  ['bed','hn','hashtags','cli','mx','bt','pr','rr','bp','o2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      document.querySelectorAll('.io-block').forEach(block=>{
        const linesIn=block.querySelector('.lines.in');
        const linesOut=block.querySelector('.lines.out');
        linesIn.innerHTML=''; linesOut.innerHTML='';
        addIOLine(linesIn,'in');
        addIOLine(linesOut,'out');
        const oi=block.querySelector('.override-in'); if(oi) oi.value='';
        const oo=block.querySelector('.override-out'); if(oo) oo.value='';
      });
      const out=document.getElementById('output'); if(out) out.textContent='';
      lastSegments=null;
      updatePreview();
      if(changeCb) changeCb();
    });
    // input bindings
  ['bed','hn','hashtags','cli','mx','bt','pr','rr','bp','o2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('input', ()=>{ updatePreview(); if(changeCb) changeCb(); }); });
    // add buttons for IO
    document.querySelectorAll('.io-block').forEach(block=>{
      const addIn=block.querySelector('.add-in');
      const addOut=block.querySelector('.add-out');
      const linesIn=block.querySelector('.lines.in');
      const linesOut=block.querySelector('.lines.out');
      addIn?.addEventListener('click', ()=>{ addIOLine(linesIn,'in'); updatePreview(); if(changeCb) changeCb(); });
      addOut?.addEventListener('click', ()=>{ addIOLine(linesOut,'out'); updatePreview(); if(changeCb) changeCb(); });
      
      // Set up drag-and-drop reordering for I/O lines
      [linesIn, linesOut].forEach(container => {
        if(!container) return;
        container.addEventListener('dragover', (e) => {
          e.preventDefault();
          const afterElement = getDragAfterElement(container, e.clientY);
          const dragging = container.querySelector('.dragging');
          if (dragging) {
            if (afterElement == null) {
              container.appendChild(dragging);
            } else {
              container.insertBefore(dragging, afterElement);
            }
          }
        });
      });
    });
    document.querySelectorAll('.override-in, .override-out').forEach(inp=>{
      inp.addEventListener('input', ()=> { recalc(inp.closest('.io-block')); if(changeCb) changeCb(); });
    });
    
    // Edit button toggles for showing delete buttons on mobile
    document.querySelectorAll('.io-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const blockName = btn.getAttribute('data-block');
        const block = document.querySelector(`.io-block[data-block="${blockName}"]`);
        if(!block) return;
        
        const isEditing = block.classList.contains('editing');
        if(isEditing) {
          block.classList.remove('editing');
          btn.textContent = '✎ Edit';
          btn.style.color = '';
        } else {
          block.classList.add('editing');
          btn.textContent = '✓ Done';
          btn.style.color = '#5b9cff';
        }
      });
    });
    
    // Copy header buttons
    async function copyToClipboard(text, button) {
      try {
        if(navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.color = '#3ecf8e';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.color = '';
        }, 1500);
        return true;
      } catch (err) {
        alert('Failed to copy: ' + err.message);
        return false;
      }
    }
    
    const copyHeaderBtn = document.getElementById('copyHeaderBtn');
    const copyHeaderHNBtn = document.getElementById('copyHeaderHNBtn');
    
    copyHeaderBtn?.addEventListener('click', () => {
      const bed = $$('#bed')?.value.trim() || '';
      const ward = (currentWardName || '').trim();
      const hashtags = $$('#hashtags')?.value.trim() || '';
      
      let header = bed;
      if(ward) {
        header = ward.includes('/') ? `${ward} ${bed}`.trim() : `${ward}/${bed}`.trim();
      }
      
      const hashtagLines = hashtags ? hashtags.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(s => s.startsWith('#') ? s : `#${s}`).join('\n') : '';
      
      const text = [header, hashtagLines].filter(Boolean).join('\n');
      copyToClipboard(text, copyHeaderBtn);
    });
    
    copyHeaderHNBtn?.addEventListener('click', () => {
      const bed = $$('#bed')?.value.trim() || '';
      const ward = (currentWardName || '').trim();
      const hn = $$('#hn')?.value.trim() || '';
      const hashtags = $$('#hashtags')?.value.trim() || '';
      
      let header = bed;
      if(ward) {
        header = ward.includes('/') ? `${ward} ${bed}`.trim() : `${ward}/${bed}`.trim();
      }
      if(hn) {
        header = `${header} ${hn}`.trim();
      }
      
      const hashtagLines = hashtags ? hashtags.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(s => s.startsWith('#') ? s : `#${s}`).join('\n') : '';
      
      const text = [header, hashtagLines].filter(Boolean).join('\n');
      copyToClipboard(text, copyHeaderHNBtn);
    });
  }
  let changeCb=null;
  let initialized=false;
  function bootstrap(details){
    if(!initialized){
      initIO();
      bindActions();
      initialized=true;
    }
    currentWardName = details?.wardName || '';
    loadFromDetails(details);
  }
  function onChange(cb){ changeCb = cb; }
  return { bootstrap, getData, recalcAll, onChange };
})();

/* Wiring: open/close profile page, Save */
const bedContainer=document.getElementById('bedContainer');
const profilePage=document.getElementById('profilePage');
const backToBedsBtn=document.getElementById('backToBedsBtn');
const saveBtn=document.getElementById('saveProfileBtn');
// Ward Work elements
const wardWorkBtn=document.getElementById('wardWorkBtn');
const wardWorkPage=document.getElementById('wardWorkPage');
const backToBedsFromWW=document.getElementById('backToBedsFromWW');
const wwDate=document.getElementById('wwDate');
const wwTitle=document.getElementById('wwTitle');
const wwAddBlock=document.getElementById('wwAddBlock');
const wwList=document.getElementById('wwList');
const wwPreviewTa=document.getElementById('wwPreviewTa');
const wwCopy=document.getElementById('wwCopy');
// WardWork Profile UI elements
const wwProfileMenuBtn=document.getElementById('wwProfileMenuBtn');
const wwProfileMenuPanel=document.getElementById('wwProfileMenuPanel');
const wwCloseProfilePanel=document.getElementById('wwCloseProfilePanel');
const wwProfileList=document.getElementById('wwProfileList');
const wwProfNewBtn=document.getElementById('wwProfNewBtn');
const wwProfDupBtn=document.getElementById('wwProfDupBtn');
const wwProfRenBtn=document.getElementById('wwProfRenBtn');
const wwProfDelBtn=document.getElementById('wwProfDelBtn');
// WardWork Rename Modal elements
const wwRenameModal=document.getElementById('wwRenameModal');
const wwRenameClose=document.getElementById('wwRenameClose');
const wwRenameNameInput=document.getElementById('wwRenameNameInput');
const wwRenameTitleInput=document.getElementById('wwRenameTitleInput');
const wwRenameCancel=document.getElementById('wwRenameCancel');
const wwRenameSave=document.getElementById('wwRenameSave');
// (Dynamic per-block bed lists will be generated). Global ward suggestions list:
const wwWardListGlobal=document.getElementById('wwWardListGlobal');
// Snippets UI
const wwSnippetBar=document.getElementById('wwSnippetBar');
const wwSnipToggle=document.getElementById('wwSnipToggle');
const wwSnipPanel=document.getElementById('wwSnipPanel'); // legacy hidden container
const wwSnipModal=document.getElementById('wwSnipModal');
const wwSnipListEl=document.getElementById('wwSnipList');
const wwSnipCloseBtn=document.getElementById('wwSnipClose');
const wwSnipAddBtn=document.getElementById('wwSnipAdd');
const wwSnipNewInput=document.getElementById('wwSnipNew');

// Ward Work storage variables declared earlier (before loadWWProfiles call)
// const WW_PROFILES_KEY='wardWorkProfiles-v2';
// const WW_CURRENT_KEY='wardWorkCurrent-v2';
// let wwProfiles = {}; // { [id]: { id, name, title, tasks: [{id,bed,task}] } }
// let currentWWProfileId = null;

function loadWWProfiles(){
  try{
    const raw = localStorage.getItem(WW_PROFILES_KEY);
    wwProfiles = raw ? JSON.parse(raw) : {};
    currentWWProfileId = localStorage.getItem(WW_CURRENT_KEY);
    
    // Migration from old date-based system
    if(Object.keys(wwProfiles).length === 0){
      const oldTasks = loadOldWWTasks();
      if(oldTasks.length > 0){
        // Group old tasks by date and create profiles
        const byDate = {};
        oldTasks.forEach(t => {
          if(!byDate[t.date]) byDate[t.date] = [];
          byDate[t.date].push({ id: t.id, bed: t.bed, task: t.task });
        });
        Object.keys(byDate).forEach(date => {
          const id = 'ww' + Date.now() + Math.floor(Math.random()*1000);
          const ddmmyy = wwFormatDDMMYY(date);
          wwProfiles[id] = {
            id,
            name: `WW ${ddmmyy}`,
            title: `🔆 WW ${ddmmyy} 🔆`,
            date: date,
            tasks: byDate[date]
          };
        });
      }
    }
    
    // Create default if empty
    if(Object.keys(wwProfiles).length === 0){
      const now = new Date();
      const iso = now.toISOString().slice(0,10);
      const ddmmyy = wwFormatDDMMYY(iso);
      const time = now.toTimeString().slice(0,5); // HH:MM
      const id = 'ww' + Date.now();
      wwProfiles[id] = {
        id,
        name: `ww ${ddmmyy} ${time}`,
        title: `🔆 WW ${ddmmyy} 🔆`,
        date: iso,
        tasks: []
      };
      currentWWProfileId = id;
    }
    
    // Ensure all profiles have a date field (migration)
    Object.values(wwProfiles).forEach(prof => {
      if(!prof.date) {
        prof.date = new Date().toISOString().slice(0,10);
      }
    });
    
    // Ensure current is valid
    if(!currentWWProfileId || !wwProfiles[currentWWProfileId]){
      currentWWProfileId = Object.keys(wwProfiles)[0];
    }
  }catch{
    wwProfiles = {};
    currentWWProfileId = null;
  }
}

function loadOldWWTasks(){
  const WW_KEY='wardWorkTasks-v1';
  try{ return JSON.parse(localStorage.getItem(WW_KEY)||'[]'); }catch{ return []; }
}

function saveWWProfiles(){
  try{
    localStorage.setItem(WW_PROFILES_KEY, JSON.stringify(wwProfiles));
    localStorage.setItem(WW_CURRENT_KEY, currentWWProfileId);
  }catch{}
}

function getCurrentWWProfile(){
  return wwProfiles[currentWWProfileId] || null;
}

function switchWWProfile(id){
  if(wwProfiles[id]){
    currentWWProfileId = id;
    saveWWProfiles();
    loadCurrentWWProfile();
  }
}

function createWWProfile(name, title, date){
  const id = 'ww' + Date.now() + Math.floor(Math.random()*1000);
  const today = new Date().toISOString().slice(0,10);
  wwProfiles[id] = { 
    id, 
    name: name || 'Untitled', 
    title: title || '🔆 Untitled 🔆', 
    date: date || today,
    tasks: [] 
  };
  currentWWProfileId = id;
  saveWWProfiles();
  loadCurrentWWProfile();
  return id;
}

function deleteWWProfile(id){
  if(Object.keys(wwProfiles).length <= 1){
    alert('Cannot delete the last WardWork document.');
    return;
  }
  delete wwProfiles[id];
  if(currentWWProfileId === id){
    currentWWProfileId = Object.keys(wwProfiles)[0];
  }
  saveWWProfiles();
  loadCurrentWWProfile();
}

function renameWWProfile(id, name, title){
  if(wwProfiles[id]){
    wwProfiles[id].name = name;
    wwProfiles[id].title = title;
    saveWWProfiles();
  }
}

function loadCurrentWWProfile(){
  const prof = getCurrentWWProfile();
  if(!prof) {
    wwTasks = [];
    renderWW();
    return;
  }
  
  // Load tasks from profile
  wwTasks = prof.tasks || [];
  
  // Update UI
  if(wwDate) wwDate.value = prof.date || new Date().toISOString().slice(0,10);
  if(wwTitle) wwTitle.value = prof.title || '';
  
  // Update profile selector button
  updateWWProfileUI();
  
  renderWW();
}

// Legacy functions (keeping for compatibility)
function loadWW(){ const prof = getCurrentWWProfile(); return prof ? prof.tasks : []; }
function saveWW(tasks){ 
  const prof = getCurrentWWProfile();
  if(prof){ 
    prof.tasks = tasks;
    saveWWProfiles();
  }
}
let wwTasks = []; // will be loaded from current profile
// WardWork snippets storage
const WW_SNIPPETS_KEY='ww-snippets-v1';
function loadWWSnippets(){ try{ return JSON.parse(localStorage.getItem(WW_SNIPPETS_KEY)||'[]'); }catch{ return []; } }
function saveWWSnippets(arr){ try{ localStorage.setItem(WW_SNIPPETS_KEY, JSON.stringify(arr||[])); }catch{} }
let wwSnippets=loadWWSnippets(); // array of { id, text }
// Internal separator for storing ward and bed together without interfering with user-entered '/'
const WW_BLOCK_SEP='\u001F';

// Block ordering persistence per profile (changed from date to profile ID)
const WW_BLOCK_ORDER_PREFIX='ww-block-order-v2:';
function loadBlockOrder(profileId){
  try{ return JSON.parse(localStorage.getItem(WW_BLOCK_ORDER_PREFIX+profileId)||'[]'); }catch{ return []; }
}
function saveBlockOrder(profileId, arr){
  try{ localStorage.setItem(WW_BLOCK_ORDER_PREFIX+profileId, JSON.stringify(arr||[])); }catch{}
}
function getOrderedLabels(profileId, labels){
  const existing=loadBlockOrder(profileId);
  // keep only labels that still exist, and remove duplicates
  let order=[];
  existing.forEach(x => {
    if(labels.includes(x) && !order.includes(x)) {
      order.push(x);
    }
  });
  // append any new labels not in order yet
  labels.forEach(l=>{ if(!order.includes(l)) order.push(l); });
  return order;
}
function moveBlock(profileId, fromLabel, toLabel){
  if(fromLabel===toLabel) return;
  const order=loadBlockOrder(profileId);
  const fi=order.indexOf(fromLabel); const ti=order.indexOf(toLabel);
  if(fi<0 || ti<0) return;
  const [m]=order.splice(fi,1);
  order.splice(ti,0,m);
  saveBlockOrder(profileId, order);
}
function appendBlockIfMissing(profileId, label){
  const order=loadBlockOrder(profileId);
  if(!order.includes(label)){ order.push(label); saveBlockOrder(profileId, order); }
}
function replaceBlockLabel(profileId, oldLabel, newLabel){
  const order=loadBlockOrder(profileId);
  const idx=order.indexOf(oldLabel);
  if(idx>=0){ order[idx]=newLabel; saveBlockOrder(profileId, order); }
}
function removeBlockLabel(profileId, label){
  const order=loadBlockOrder(profileId).filter(x=> x!==label);
  saveBlockOrder(profileId, order);
}

function openWardWork(){
  // Toggle: if already open, close it
  if(wardWorkPage.style.display === 'flex'){
    bedContainer.style.display='block';
    profilePage.style.display='none';
    wardWorkPage.style.display='none';
    notesPage.style.display='none';
    return;
  }
  
  bedContainer.style.display='none';
  profilePage.style.display='none';
  wardWorkPage.style.display='flex';
  notesPage.style.display='none';
  
  // Load profiles on first open
  if(!wwProfiles || Object.keys(wwProfiles).length === 0){
    loadWWProfiles();
  }
  
  // Ensure we have a current profile
  if(!currentWWProfileId || !wwProfiles[currentWWProfileId]){
    const firstId = Object.keys(wwProfiles)[0];
    if(firstId){
      currentWWProfileId = firstId;
    } else {
      // Create a default profile if none exist
      const now = new Date();
      const iso = now.toISOString().slice(0,10);
      const ddmmyy = wwFormatDDMMYY(iso);
      const time = now.toTimeString().slice(0,5); // HH:MM
      const id = 'ww' + Date.now();
      wwProfiles[id] = {
        id,
        name: `ww ${ddmmyy} ${time}`,
        title: `🔆 WW ${ddmmyy} 🔆`,
        date: iso,
        tasks: []
      };
      currentWWProfileId = id;
      saveWWProfiles();
    }
  }
  
  loadCurrentWWProfile();
  refreshWWSuggestions();
  buildWWSnippetsUI(); // ensure modal list is ready
}

function updateWWProfileUI(){
  const prof = getCurrentWWProfile();
  if(wwProfileMenuBtn){
    wwProfileMenuBtn.textContent = prof ? prof.name : 'Document';
  }
  
  if(wwProfileList){
    wwProfileList.innerHTML = '';
    Object.values(wwProfiles).forEach(p => {
      const li = document.createElement('li');
      li.textContent = p.name || p.id;
      li.style.padding = '8px 12px';
      li.style.cursor = 'pointer';
      if(p.id === currentWWProfileId){
        li.style.fontWeight = '600';
        li.style.background = '#f5f5f5';
      }
      li.addEventListener('click', () => {
        switchWWProfile(p.id);
        closeWWProfilePanel();
      });
      wwProfileList.appendChild(li);
    });
  }
}

function openWWProfilePanel(){
  if(wwProfileMenuPanel){
    updateWWProfileUI();
    wwProfileMenuPanel.style.display = 'block';
  }
}

function closeWWProfilePanel(){
  if(wwProfileMenuPanel) wwProfileMenuPanel.style.display = 'none';
}

// Profile menu bindings
wwProfileMenuBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = wwProfileMenuPanel && wwProfileMenuPanel.style.display === 'block';
  if(open) closeWWProfilePanel();
  else openWWProfilePanel();
});

wwCloseProfilePanel?.addEventListener('click', closeWWProfilePanel);

document.addEventListener('click', (e) => {
  const menu = document.getElementById('wwProfilesMenu');
  if(menu && !menu.contains(e.target)) closeWWProfilePanel();
});

wwProfNewBtn?.addEventListener('click', () => {
  const now = new Date();
  const iso = now.toISOString().slice(0,10);
  const ddmmyy = wwFormatDDMMYY(iso);
  const time = now.toTimeString().slice(0,5); // HH:MM
  
  const name = `ww ${ddmmyy} ${time}`;
  const title = `🔆 WW ${ddmmyy} 🔆`;
  
  createWWProfile(name, title, iso);
  closeWWProfilePanel();
});

wwProfDupBtn?.addEventListener('click', () => {
  const prof = getCurrentWWProfile();
  if(!prof) return;
  const name = prompt('Duplicate as', prof.name + ' Copy');
  if(name == null) return;
  const id = 'ww' + Date.now() + Math.floor(Math.random()*1000);
  wwProfiles[id] = {
    id,
    name: name.trim() || prof.name + ' Copy',
    title: (prof.title || '') + ' (copy)',
    date: prof.date || new Date().toISOString().slice(0,10),
    tasks: JSON.parse(JSON.stringify(prof.tasks || []))
  };
  currentWWProfileId = id;
  saveWWProfiles();
  loadCurrentWWProfile();
  closeWWProfilePanel();
});

wwProfRenBtn?.addEventListener('click', () => {
  const prof = getCurrentWWProfile();
  if(!prof) return;
  
  // Open rename modal with current values
  if(wwRenameNameInput) wwRenameNameInput.value = prof.name;
  if(wwRenameTitleInput) wwRenameTitleInput.value = prof.title || '';
  if(wwRenameModal) wwRenameModal.style.display = 'flex';
  
  // Select all text in name input for easy replacement
  setTimeout(() => {
    if(wwRenameNameInput) {
      wwRenameNameInput.focus();
      wwRenameNameInput.select();
    }
  }, 50);
  
  closeWWProfilePanel();
});

// WardWork Rename Modal handlers
function closeWWRenameModal() {
  if(wwRenameModal) wwRenameModal.style.display = 'none';
}

wwRenameClose?.addEventListener('click', closeWWRenameModal);
wwRenameCancel?.addEventListener('click', closeWWRenameModal);

wwRenameSave?.addEventListener('click', () => {
  const prof = getCurrentWWProfile();
  if(!prof) return;
  
  const newName = wwRenameNameInput?.value.trim() || prof.name;
  const newTitle = wwRenameTitleInput?.value.trim() || prof.title;
  
  renameWWProfile(prof.id, newName, newTitle);
  if(wwTitle) wwTitle.value = newTitle;
  updateWWProfileUI();
  closeWWRenameModal();
});

// Close modal on backdrop click
wwRenameModal?.addEventListener('click', (e) => {
  if(e.target === wwRenameModal) closeWWRenameModal();
});

// Handle Enter key to save
wwRenameNameInput?.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') {
    e.preventDefault();
    wwRenameTitleInput?.focus();
    wwRenameTitleInput?.select();
  }
});

wwRenameTitleInput?.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') {
    e.preventDefault();
    wwRenameSave?.click();
  }
});

wwProfDelBtn?.addEventListener('click', () => {
  const prof = getCurrentWWProfile();
  if(!prof) return;
  if(!confirm(`Delete "${prof.name}"?`)) return;
  deleteWWProfile(prof.id);
  closeWWProfilePanel();
});

// Date picker - update title when date changes
wwDate?.addEventListener('change', () => {
  const prof = getCurrentWWProfile();
  if(!prof) return;
  
  const dateStr = wwDate.value;
  if(!dateStr) return;
  
  // Update profile date
  prof.date = dateStr;
  
  // Auto-update title to match date format
  const ddmmyy = wwFormatDDMMYY(dateStr);
  const newTitle = `🔆 WW ${ddmmyy} 🔆`;
  prof.title = newTitle;
  if(wwTitle) wwTitle.value = newTitle;
  
  saveWWProfiles();
  updateWWPreview();
});

// Title input - update profile when title changes
wwTitle?.addEventListener('change', () => {
  const prof = getCurrentWWProfile();
  if(!prof) return;
  prof.title = wwTitle.value;
  saveWWProfiles();
  updateWWPreview();
});

function backFromWW(){ 
  wardWorkPage.style.display='none'; 
  bedContainer.style.display='block'; 
  profilePage.style.display='none';
  notesPage.style.display='none';
}
wardWorkBtn?.addEventListener('click', openWardWork);
backToBedsFromWW?.addEventListener('click', backFromWW);

// ======================
// NOTES SECTION
// ======================

const notesBtn = document.getElementById('notesBtn');
const notesPage = document.getElementById('notesPage');
const backToBedsFromNotes = document.getElementById('backToBedsFromNotes');
const notesTextarea = document.getElementById('notesTextarea');
// Notes Profile UI elements
const notesProfileMenuBtn = document.getElementById('notesProfileMenuBtn');
const notesProfileMenuPanel = document.getElementById('notesProfileMenuPanel');
const notesCloseProfilePanel = document.getElementById('notesCloseProfilePanel');
const notesProfileList = document.getElementById('notesProfileList');
const notesProfNewBtn = document.getElementById('notesProfNewBtn');
const notesProfDupBtn = document.getElementById('notesProfDupBtn');
const notesProfRenBtn = document.getElementById('notesProfRenBtn');
const notesProfDelBtn = document.getElementById('notesProfDelBtn');
const notesCopyBtn = document.getElementById('notesCopyBtn');
// Notes Rename Modal elements
const notesRenameModal = document.getElementById('notesRenameModal');
const notesRenameClose = document.getElementById('notesRenameClose');
const notesRenameInput = document.getElementById('notesRenameInput');
const notesRenameCancel = document.getElementById('notesRenameCancel');
const notesRenameSave = document.getElementById('notesRenameSave');

// Storage keys
const NOTES_PROFILES_KEY = 'notesProfiles-v1';
const NOTES_CURRENT_KEY = 'notesCurrent-v1';
let notesProfiles = {}; // { [id]: { id, name, content } }
let currentNotesProfileId = null;

function loadNotesProfiles(){
  try{
    const raw = localStorage.getItem(NOTES_PROFILES_KEY);
    notesProfiles = raw ? JSON.parse(raw) : {};
    currentNotesProfileId = localStorage.getItem(NOTES_CURRENT_KEY);
    
    // Create default if empty
    if(Object.keys(notesProfiles).length === 0){
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '/');
      const timeStr = now.toTimeString().slice(0,5);
      const id = 'notes' + Date.now();
      notesProfiles[id] = {
        id,
        name: `Note ${dateStr} ${timeStr}`,
        content: ''
      };
      currentNotesProfileId = id;
    }
    
    // Ensure current is valid
    if(!currentNotesProfileId || !notesProfiles[currentNotesProfileId]){
      currentNotesProfileId = Object.keys(notesProfiles)[0];
    }
  } catch(e){
    console.error('Error loading notes profiles:', e);
    notesProfiles = {};
    currentNotesProfileId = null;
  }
}

function saveNotesProfiles(){
  try{
    localStorage.setItem(NOTES_PROFILES_KEY, JSON.stringify(notesProfiles));
    localStorage.setItem(NOTES_CURRENT_KEY, currentNotesProfileId);
  } catch(e){
    console.error('Error saving notes profiles:', e);
  }
}

function getCurrentNotesProfile(){
  if(!currentNotesProfileId || !notesProfiles[currentNotesProfileId]){
    loadNotesProfiles();
  }
  return notesProfiles[currentNotesProfileId];
}

function renderNotesProfileList(){
  if(!notesProfileList) return;
  notesProfileList.innerHTML = '';
  
  const sortedIds = Object.keys(notesProfiles).sort((a,b)=> {
    const nameA = (notesProfiles[a].name||'').toLowerCase();
    const nameB = (notesProfiles[b].name||'').toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  sortedIds.forEach(id => {
    const prof = notesProfiles[id];
    const li = document.createElement('li');
    li.style.cssText = 'padding:8px 12px; cursor:pointer; border-radius:6px; margin:2px 6px;';
    if(id === currentNotesProfileId){
      li.style.backgroundColor = '#e3f2fd';
      li.style.fontWeight = '600';
    }
    li.textContent = prof.name || 'Untitled';
    li.onclick = () => {
      if(id !== currentNotesProfileId){
        saveCurrentNotesContent();
        currentNotesProfileId = id;
        saveNotesProfiles();
        loadCurrentNotesProfile();
        renderNotesProfileList();
      }
      notesProfileMenuPanel.style.display = 'none';
    };
    li.onmouseenter = () => { if(id !== currentNotesProfileId) li.style.backgroundColor = '#f5f5f5'; };
    li.onmouseleave = () => { if(id !== currentNotesProfileId) li.style.backgroundColor = ''; };
    notesProfileList.appendChild(li);
  });
}

function saveCurrentNotesContent(){
  const prof = getCurrentNotesProfile();
  if(prof && notesTextarea){
    prof.content = notesTextarea.value;
    saveNotesProfiles();
  }
}

function loadCurrentNotesProfile(){
  const prof = getCurrentNotesProfile();
  if(prof && notesTextarea){
    notesTextarea.value = prof.content || '';
    if(notesProfileMenuBtn){
      notesProfileMenuBtn.textContent = prof.name || 'Document';
    }
    // Re-render the editable content from textarea
    renderNotesContent();
  }
}

function openNotes(){
  // Toggle: if already open, close it
  if(notesPage.style.display === 'flex'){
    saveCurrentNotesContent();
    bedContainer.style.display='block';
    profilePage.style.display='none';
    wardWorkPage.style.display='none';
    notesPage.style.display='none';
    return;
  }
  
  bedContainer.style.display='none';
  profilePage.style.display='none';
  wardWorkPage.style.display='none';
  notesPage.style.display='flex';
  
  // Load profiles on first open
  if(!notesProfiles || Object.keys(notesProfiles).length === 0){
    loadNotesProfiles();
  }
  
  loadCurrentNotesProfile();
  renderNotesProfileList();
  renderNotesContent();
}

function backFromNotes(){ 
  saveCurrentNotesContent();
  notesPage.style.display='none'; 
  bedContainer.style.display='block'; 
  wardWorkPage.style.display='none';
}

notesBtn?.addEventListener('click', openNotes);
backToBedsFromNotes?.addEventListener('click', backFromNotes);

// Simple contentEditable with clickable checkboxes
const notesEditableContent = document.getElementById('notesEditableContent');

// Track if keyboard is currently visible
let notesKeyboardVisible = false;

// Update keyboard visibility when focus/blur happens
notesEditableContent?.addEventListener('focus', () => {
  // Focus means keyboard will appear
  setTimeout(() => {
    notesKeyboardVisible = true;
  }, 300); // Give keyboard time to appear
});

notesEditableContent?.addEventListener('blur', () => {
  notesKeyboardVisible = false;
});

// Detect keyboard hiding on mobile (Android back button doesn't trigger blur)
// When keyboard hides, viewport height increases
if (notesEditableContent) {
  let lastHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  
  const checkKeyboardHidden = () => {
    const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    
    // If viewport height increased significantly (>100px), keyboard was hidden
    if (currentHeight > lastHeight + 100) {
      notesKeyboardVisible = false;
    }
    // If viewport height decreased significantly, keyboard appeared
    else if (currentHeight < lastHeight - 100) {
      notesKeyboardVisible = true;
    }
    
    lastHeight = currentHeight;
  };
  
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', checkKeyboardHidden);
  } else {
    window.addEventListener('resize', checkKeyboardHidden);
  }
}

// Render initial content with clickable checkboxes
function renderNotesContent() {
  if (!notesTextarea || !notesEditableContent) return;
  
  const text = notesTextarea.value;
  const lines = text.split('\n');
  
  notesEditableContent.innerHTML = '';
  
  lines.forEach(line => {
    const lineDiv = document.createElement('div');
    
    // Empty line - add br to preserve it
    if (line === '') {
      lineDiv.appendChild(document.createElement('br'));
    }
    // Check if line starts with checkbox
    else if (line.match(/^(⭕️|⭕|✅)\s*/)) {
      const match = line.match(/^(⭕️|⭕|✅)\s*/);
      const checkbox = match[0];
      const isChecked = checkbox.includes('✅');
      const restOfLine = line.substring(match[0].length);
      
      // Create clickable checkbox span that preserves exact spacing
      const checkboxSpan = document.createElement('span');
      // Keep the exact match to preserve spacing
      checkboxSpan.textContent = isChecked ? match[0] : match[0].replace(/✅/, '⭕️').replace(/⭕/, '⭕️');
      checkboxSpan.contentEditable = 'false';
      checkboxSpan.style.cursor = 'pointer';
      checkboxSpan.style.userSelect = 'none';
      checkboxSpan.style.display = 'inline';
      
      checkboxSpan.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Prevent keyboard from showing
        notesEditableContent.blur();
        // Toggle based on current textContent
        const currentlyChecked = checkboxSpan.textContent.includes('✅');
        if (currentlyChecked) {
          checkboxSpan.textContent = checkboxSpan.textContent.replace('✅', '⭕️');
        } else {
          checkboxSpan.textContent = checkboxSpan.textContent.replace(/⭕️|⭕/, '✅');
        }
        syncToTextarea();
      };
      
      lineDiv.appendChild(checkboxSpan);
      lineDiv.appendChild(document.createTextNode(restOfLine));
    } else {
      lineDiv.textContent = line;
    }
    
    notesEditableContent.appendChild(lineDiv);
  });
}

// Sync from contentEditable back to textarea
function syncToTextarea() {
  if (!notesEditableContent || !notesTextarea) return;
  
  const lines = [];
  notesEditableContent.childNodes.forEach(node => {
    if (node.nodeName === 'DIV') {
      let lineText = '';
      node.childNodes.forEach(child => {
        lineText += child.textContent || '';
      });
      lines.push(lineText);
    } else if (node.nodeName === '#text') {
      // Handle direct text nodes
      const text = node.textContent || '';
      if (text) lines.push(text);
    } else if (node.nodeName === 'BR') {
      // Handle line breaks
      lines.push('');
    }
  });
  
  notesTextarea.value = lines.join('\n');
  saveCurrentNotesContent();
}

// Convert checkbox text to clickable spans without full re-render
function makeCheckboxesClickable(shouldNormalize = false) {
  if (!notesEditableContent) return;
  
  // Only normalize structure on paste, not on regular typing
  if (shouldNormalize) {
    normalizeContentStructure();
  }
  
  // Find all DIVs and check for checkboxes at the start
  const divs = notesEditableContent.querySelectorAll('div');
  divs.forEach(div => {
    // Skip if already has a checkbox span
    if (div.querySelector('.checkbox-toggle')) return;
    
    // Get the first text content (might be in nested elements)
    let firstTextNode = null;
    let textContent = '';
    
    // Walk through to find first text
    function findFirstText(node) {
      if (firstTextNode) return;
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        firstTextNode = node;
        textContent = node.textContent;
        return;
      }
      if (node.childNodes) {
        for (let child of node.childNodes) {
          findFirstText(child);
          if (firstTextNode) return;
        }
      }
    }
    
    findFirstText(div);
    
    if (!firstTextNode) return;
    
    const match = textContent.match(/^(⭕️|⭕|✅)\s*/);
    
    if (match) {
      const checkbox = match[0];
      const restOfText = textContent.substring(match[0].length);
      
      // Create clickable checkbox span
      const checkboxSpan = document.createElement('span');
      checkboxSpan.textContent = match[0];
      checkboxSpan.contentEditable = 'false';
      checkboxSpan.style.cursor = 'pointer';
      checkboxSpan.style.userSelect = 'none';
      checkboxSpan.style.display = 'inline';
      checkboxSpan.className = 'checkbox-toggle';
      
      // Prevent touch from focusing the contentEditable
      checkboxSpan.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
      
      // Prevent mousedown from focusing
      checkboxSpan.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      
      checkboxSpan.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Save keyboard state BEFORE toggling
        const keyboardWasVisible = notesKeyboardVisible;
        
        // Toggle checkbox immediately
        const currentlyChecked = checkboxSpan.textContent.includes('✅');
        if (currentlyChecked) {
          checkboxSpan.textContent = checkboxSpan.textContent.replace('✅', '⭕️');
        } else {
          checkboxSpan.textContent = checkboxSpan.textContent.replace(/⭕️|⭕/, '✅');
        }
        
        // Sync to textarea
        setTimeout(() => {
          syncToTextarea();
        }, 0);
        
        // Manage keyboard visibility after toggle
        if (!keyboardWasVisible) {
          // Keyboard was hidden - keep it hidden
          if (document.activeElement === notesEditableContent) {
            notesEditableContent.blur();
          }
        } else {
          // Keyboard was visible - keep it visible by restoring focus
          if (document.activeElement !== notesEditableContent) {
            notesEditableContent.focus();
          }
        }
      };
      
      // Replace the text node
      firstTextNode.textContent = restOfText;
      
      // Insert checkbox at the very beginning of the div
      if (div.firstChild) {
        div.insertBefore(checkboxSpan, div.firstChild);
      } else {
        div.appendChild(checkboxSpan);
      }
    }
  });
}

// Normalize content structure to ensure everything is in DIVs
function normalizeContentStructure() {
  if (!notesEditableContent) return;
  
  const children = Array.from(notesEditableContent.childNodes);
  const newChildren = [];
  
  children.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      // Wrap text nodes in DIVs, splitting by newlines
      const lines = child.textContent.split('\n');
      lines.forEach(line => {
        const div = document.createElement('div');
        if (line === '') {
          div.appendChild(document.createElement('br'));
        } else {
          div.textContent = line;
        }
        newChildren.push(div);
      });
    } else if (child.nodeName === 'BR') {
      // Convert BR to empty DIV
      const div = document.createElement('div');
      div.appendChild(document.createElement('br'));
      newChildren.push(div);
    } else if (child.nodeName === 'DIV') {
      // Check if DIV itself contains newlines in its text content
      const textContent = child.textContent;
      if (textContent.includes('\n')) {
        // Split this DIV into multiple DIVs
        const lines = textContent.split('\n');
        lines.forEach(line => {
          const div = document.createElement('div');
          if (line === '') {
            div.appendChild(document.createElement('br'));
          } else {
            div.textContent = line;
          }
          newChildren.push(div);
        });
      } else {
        // Keep DIV as is
        newChildren.push(child);
      }
    } else {
      // Wrap other elements in DIV
      const div = document.createElement('div');
      div.appendChild(child.cloneNode(true));
      newChildren.push(div);
    }
  });
  
  // Always update to ensure consistent structure
  if (newChildren.length > 0) {
    notesEditableContent.innerHTML = '';
    newChildren.forEach(child => notesEditableContent.appendChild(child));
  }
}

// Save on input (typing, pasting, etc.)
notesEditableContent?.addEventListener('input', () => {
  // Sync immediately to save content
  clearTimeout(window.notesSyncTimer);
  window.notesSyncTimer = setTimeout(() => {
    syncToTextarea();
  }, 300);
  
  // Convert checkboxes to clickable spans immediately (without normalizing)
  clearTimeout(window.notesCheckboxTimer);
  window.notesCheckboxTimer = setTimeout(() => {
    makeCheckboxesClickable(false); // Don't normalize on regular typing
  }, 100);
});

// Handle paste events - process immediately
notesEditableContent?.addEventListener('paste', (e) => {
  // Let the paste happen first, then process with cursor preservation
  setTimeout(() => {
    // Save cursor position
    const selection = window.getSelection();
    let cursorOffset = 0;
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(notesEditableContent);
      preRange.setEnd(range.startContainer, range.startOffset);
      cursorOffset = preRange.toString().length;
    }
    
    // Process the pasted content WITH normalization
    makeCheckboxesClickable(true);
    syncToTextarea();
    
    // Restore cursor
    if (cursorOffset >= 0) {
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        let charCount = 0;
        let found = false;
        
        function findPosition(node) {
          if (found) return;
          if (node.nodeType === Node.TEXT_NODE) {
            if (charCount + node.length >= cursorOffset) {
              range.setStart(node, cursorOffset - charCount);
              range.collapse(true);
              found = true;
              return;
            }
            charCount += node.length;
          } else if (node.childNodes) {
            for (let child of node.childNodes) {
              findPosition(child);
              if (found) return;
            }
            if (node.nodeName === 'DIV') charCount += 1;
          }
        }
        
        findPosition(notesEditableContent);
        
        if (found) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } catch (e) {
        console.log('Paste cursor restore error:', e);
      }
    }
  }, 20); // Quick but give browser time to insert content
});

// Profile menu toggle
notesProfileMenuBtn?.addEventListener('click', () => {
  const isVisible = notesProfileMenuPanel.style.display === 'block';
  notesProfileMenuPanel.style.display = isVisible ? 'none' : 'block';
  if(!isVisible) renderNotesProfileList();
});

notesCloseProfilePanel?.addEventListener('click', () => {
  notesProfileMenuPanel.style.display = 'none';
});

// Profile actions
notesProfNewBtn?.addEventListener('click', () => {
  saveCurrentNotesContent();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '/');
  const timeStr = now.toTimeString().slice(0,5);
  const id = 'notes' + Date.now();
  notesProfiles[id] = {
    id,
    name: `Note ${dateStr} ${timeStr}`,
    content: ''
  };
  currentNotesProfileId = id;
  saveNotesProfiles();
  loadCurrentNotesProfile();
  renderNotesProfileList();
  notesProfileMenuPanel.style.display = 'none';
});

notesProfDupBtn?.addEventListener('click', () => {
  const prof = getCurrentNotesProfile();
  if(!prof) return;
  saveCurrentNotesContent();
  const id = 'notes' + Date.now();
  notesProfiles[id] = {
    id,
    name: prof.name + ' (copy)',
    content: prof.content
  };
  currentNotesProfileId = id;
  saveNotesProfiles();
  loadCurrentNotesProfile();
  renderNotesProfileList();
  notesProfileMenuPanel.style.display = 'none';
});

notesProfRenBtn?.addEventListener('click', () => {
  const prof = getCurrentNotesProfile();
  if(!prof) return;
  notesRenameInput.value = prof.name || '';
  notesRenameModal.style.display = 'flex';
  notesProfileMenuPanel.style.display = 'none';
  setTimeout(() => notesRenameInput?.focus(), 100);
});

notesProfDelBtn?.addEventListener('click', () => {
  const prof = getCurrentNotesProfile();
  if(!prof) return;
  if(!confirm(`Delete "${prof.name}"?`)) return;
  
  delete notesProfiles[currentNotesProfileId];
  
  // Switch to another profile or create new one
  const remaining = Object.keys(notesProfiles);
  if(remaining.length > 0){
    currentNotesProfileId = remaining[0];
  } else {
    // Create a new default profile
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '/');
    const timeStr = now.toTimeString().slice(0,5);
    const id = 'notes' + Date.now();
    notesProfiles[id] = {
      id,
      name: `Note ${dateStr} ${timeStr}`,
      content: ''
    };
    currentNotesProfileId = id;
  }
  
  saveNotesProfiles();
  loadCurrentNotesProfile();
  renderNotesProfileList();
  notesProfileMenuPanel.style.display = 'none';
});

// Copy button - copy all notes text to clipboard
notesCopyBtn?.addEventListener('click', async () => {
  if (!notesTextarea) return;
  
  const text = notesTextarea.value;
  
  if (!text) {
    // Just show visual feedback, no alert
    notesCopyBtn.textContent = '⚠️';
    setTimeout(() => {
      notesCopyBtn.textContent = '📋';
    }, 1000);
    return;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    
    // Visual feedback - just change icon
    notesCopyBtn.textContent = '✅';
    notesCopyBtn.style.color = '#22c55e';
    
    setTimeout(() => {
      notesCopyBtn.textContent = '📋';
      notesCopyBtn.style.color = '';
    }, 1500);
  } catch (err) {
    // Fallback for older browsers
    notesTextarea.style.display = 'block';
    notesTextarea.select();
    document.execCommand('copy');
    notesTextarea.style.display = 'none';
    
    // Visual feedback only
    notesCopyBtn.textContent = '✅';
    notesCopyBtn.style.color = '#22c55e';
    
    setTimeout(() => {
      notesCopyBtn.textContent = '📋';
      notesCopyBtn.style.color = '';
    }, 1500);
  }
});

// Rename modal
notesRenameClose?.addEventListener('click', () => {
  notesRenameModal.style.display = 'none';
});

notesRenameCancel?.addEventListener('click', () => {
  notesRenameModal.style.display = 'none';
});

notesRenameSave?.addEventListener('click', () => {
  const prof = getCurrentNotesProfile();
  if(!prof) return;
  const newName = notesRenameInput.value.trim();
  if(!newName) return;
  
  prof.name = newName;
  saveNotesProfiles();
  loadCurrentNotesProfile();
  renderNotesProfileList();
  notesRenameModal.style.display = 'none';
});

notesRenameInput?.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){
    e.preventDefault();
    notesRenameSave?.click();
  } else if(e.key === 'Escape'){
    notesRenameModal.style.display = 'none';
  }
});

// Close modal on backdrop click
notesRenameModal?.addEventListener('click', (e) => {
  if(e.target === notesRenameModal){
    notesRenameModal.style.display = 'none';
  }
});

// ======================
// END NOTES SECTION
// ======================


function refreshWWSuggestions(){
  // Populate global ward names
  if(wwWardListGlobal){
    wwWardListGlobal.innerHTML='';
    (data.wards||[]).forEach(w=>{ const opt=document.createElement('option'); opt.value=(w.name||'').trim(); wwWardListGlobal.appendChild(opt); });
  }
  // For each existing block, rebuild its bed datalist based on ward value
  document.querySelectorAll('.ww-block').forEach(block=>{
    const wardInp=block.querySelector('.wwWard');
    const bedList=block.querySelector('datalist[data-bedlist]');
    if(!bedList) return;
    bedList.innerHTML='';
    const wardName=(wardInp?.value||'').trim();
    if(!wardName){
      // Show all beds across all wards
      (data.wards||[]).forEach(w=>{
        (w.beds||[]).forEach(b=>{
          if((b.status||'active').toLowerCase()==='discharge') return;
          const opt=document.createElement('option'); opt.value=(b.name||'').trim(); bedList.appendChild(opt);
        });
      });
    }else{
      const w=(data.wards||[]).find(x=> (x.name||'').trim()===wardName);
      if(w){
        (w.beds||[]).forEach(b=>{
          if((b.status||'active').toLowerCase()==='discharge') return;
          const opt=document.createElement('option'); opt.value=(b.name||'').trim(); bedList.appendChild(opt);
        });
      }
    }
  });
}

// --- WardWork Title decoration helpers ---
const WW_DECOR_RE = /^\s*🔆\s*(.*?)\s+(\d{1,2})\/(\d{1,2})\/(\d{2})\s*🔆\s*$/;
function wwFormatDDMMYY(dateStr){
  try{
    const [y,m,d]=dateStr.split('-').map(x=>parseInt(x,10));
    const yy=String(y).slice(-2);
    return `${d}/${m}/${yy}`;
  }catch{ return ''; }
}
function ensureDecoratedTitleForDate(){
  if(!wwTitle) return;
  const curDate = wwDate?.value || '';
  const saved = (wwTitle.value||'').trim();
  if(curDate){
    const ddmmyy = wwFormatDDMMYY(curDate);
    if(WW_DECOR_RE.test(saved)){
      const inner = saved.match(WW_DECOR_RE)[1];
      wwTitle.value = `🔆 ${inner} ${ddmmyy} 🔆`;
    } else {
      const base = saved || 'WW';
      wwTitle.value = `🔆 ${base} ${ddmmyy} 🔆`;
    }
  } else {
    if(!WW_DECOR_RE.test(saved)){
      const base = saved || 'WW';
      wwTitle.value = `🔆 ${base} 🔆`;
    }
  }
  try{ localStorage.setItem('ww-title', wwTitle.value||''); }catch{}
}

function formatWWHeader(dateStr){
  // dateStr is yyyy-mm-dd -> dd/mm/yy (Buddhist year or just yy?) Using dd/mm/yy like sample
  try{
    const [y,m,d]=dateStr.split('-').map(x=>parseInt(x,10));
    const yy=String(y).slice(-2);
    const base=`${d}/${m}/${yy}`;
    const title=(wwTitle?.value||'WW').trim()||'WW';
    return `🔆 ${title} ${base} 🔆`;
  }catch{ return '🔆 WW 🔆'; }
}
function updateWWPreview(){
  const prof = getCurrentWWProfile();
  if(!prof) return;
  
  const list = prof.tasks.filter(t => (t.task||'').trim() !== '');
  const groups = new Map();
  list.forEach(t => {
    if(!groups.has(t.bed)) groups.set(t.bed, []);
    groups.get(t.bed).push(t.task);
  });
  
  const decoratedTitle = (wwTitle?.value || prof.title || '').trim();
  const lines = [decoratedTitle || '🔆 WW 🔆', ''];
  
  // Get ordered bed labels
  const bedLabels = Array.from(groups.keys());
  const orderedLabels = getOrderedLabels(prof.id, bedLabels);
  
  // Iterate in the correct order
  orderedLabels.forEach(bed => {
    const tasks = groups.get(bed);
    if(!tasks) return;
    
    let display = bed;
    if(typeof bed === 'string' && bed.includes(WW_BLOCK_SEP)){
      const [w, b] = bed.split(WW_BLOCK_SEP);
      if(b){
        const sep = (w||'').includes('/') ? ' ' : '/';
        display = `${w}${sep}${b}`;
      } else {
        display = w;
      }
    }
    lines.push(display);
    tasks.forEach(tsk => lines.push('⭕️ ' + tsk));
    lines.push('');
  });
  
  wwPreviewTa.value = lines.join('\n').trim();
  const mob = document.getElementById('wwPreviewMobile');
  if(mob) mob.textContent = wwPreviewTa.value;
}
// Build / refresh snippet chips panel
function buildWWSnippetsUI(){
  if(!wwSnipListEl) return;
  wwSnipListEl.innerHTML='';
  wwSnippets.forEach(sn=>{
    const row=document.createElement('div'); row.style.display='grid'; row.style.gridTemplateColumns='1fr auto'; row.style.gap='8px'; row.style.alignItems='center';
    const inp=document.createElement('input'); inp.type='text'; inp.value=sn.text; inp.style.padding='8px'; inp.addEventListener('input', ()=>{ sn.text=inp.value; saveWWSnippets(wwSnippets); });
    const del=document.createElement('button'); del.textContent='×'; del.className='ghost'; del.title='Delete'; del.onclick=()=>{ wwSnippets=wwSnippets.filter(x=>x.id!==sn.id); saveWWSnippets(wwSnippets); buildWWSnippetsUI(); };
    row.appendChild(inp); row.appendChild(del); wwSnipListEl.appendChild(row);
  });
}
function openWWSnippetModal(){ if(!wwSnipModal) return; buildWWSnippetsUI(); wwSnipModal.style.display='flex'; }
function closeWWSnippetModal(){ if(!wwSnipModal) return; wwSnipModal.style.display='none'; }
wwSnipToggle?.addEventListener('click', openWWSnippetModal);
wwSnipCloseBtn?.addEventListener('click', closeWWSnippetModal);
wwSnipModal?.addEventListener('click', (e)=>{ if(e.target===wwSnipModal) closeWWSnippetModal(); });
wwSnipAddBtn?.addEventListener('click', ()=>{ const v=(wwSnipNewInput?.value||'').trim(); if(!v) return; wwSnippets.push({ id:'sn'+Date.now()+Math.floor(Math.random()*1000), text:v }); saveWWSnippets(wwSnippets); wwSnipNewInput.value=''; buildWWSnippetsUI(); });
wwSnipNewInput?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); wwSnipAddBtn?.click(); } });
// Insert snippet into current block (focus-first non-empty or create new block if none)
function quickInsertSnippet(text){
  const curDate=wwDate.value||''; if(!curDate) return;
  // Determine target block: last focused textarea or first block; fallback create block
  let targetBlock=document.querySelector('.ww-block textarea:focus')?.closest('.ww-block');
  if(!targetBlock){ targetBlock=document.querySelector('.ww-block'); }
  if(!targetBlock){
    // create new block
    const tempLabel = '(new) ' + (Date.now()%1e7) + '-' + Math.floor(Math.random()*1000);
    wwTasks.push({ id:'ww'+Date.now()+Math.floor(Math.random()*1000), date:curDate, bed: tempLabel, task:'' });
    saveWW(wwTasks); renderWW(); appendBlockIfMissing(curDate, tempLabel); targetBlock=[...document.querySelectorAll('.ww-block')].find(b=> b.dataset.label===tempLabel);
  }
  if(!targetBlock) return;
  const bedLabel=targetBlock.dataset.label;
  const newId='ww'+Date.now()+Math.floor(Math.random()*1000);
  wwTasks.push({ id:newId, date:curDate, bed: bedLabel, task: text });
  saveWW(wwTasks); renderWW();
  // focus new task
  setTimeout(()=>{ const ta=targetBlock.querySelector(`textarea[data-id="${newId}"]`); ta?.focus(); },60);
}
function renderWW(){
  const prof = getCurrentWWProfile();
  if(!prof){ wwList.innerHTML = ''; return; }
  
  wwTasks = prof.tasks; // Sync working array
  wwList.innerHTML='';
  const byBed=new Map();
  wwTasks.forEach(t=>{ const key=(t.bed||''); if(!byBed.has(key)) byBed.set(key, []); byBed.get(key).push(t); });
  const labelsOrdered = getOrderedLabels(prof.id, Array.from(byBed.keys()));
  labelsOrdered.forEach((bedLabel)=>{ wwList.appendChild(buildWWBlock(prof, bedLabel)); });
  updateWWPreview();
}

// Build one WardWork block (a ward/bed label and its tasks) and RETURN the
// element without inserting it. Callers append it, so "+ Block" / "add task"
// can update the DOM incrementally instead of re-rendering the whole list —
// a full re-render removes the focused field and makes the mobile keyboard
// dismiss-then-reopen (the "dizzy" jump).
function buildWWBlock(prof, bedLabel){
    const tasks = wwTasks.filter(t=> (t.bed||'')===bedLabel);
    const group=document.createElement('div');
    group.className='ww-block';
    group.style.border='1px solid #ddd'; group.style.borderRadius='10px'; group.style.padding='8px 10px'; group.style.background='#fafafa';
    group.setAttribute('draggable','true');
    group.dataset.label=bedLabel;
  const header=document.createElement('div'); header.style.display='flex'; header.style.flexDirection='column'; header.style.gap='8px'; header.style.marginBottom='6px';
  // Actions row (add/delete) above fields
  const actions=document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px'; actions.style.justifyContent='space-between'; actions.style.alignItems='center';
  const blockHandle=document.createElement('span'); blockHandle.textContent='≡'; blockHandle.className='ww-block-handle';
  // Editable ward/bed fields split into two inputs on the same line with tight separator
  const wbWrap=document.createElement('div'); wbWrap.style.display='flex'; wbWrap.style.alignItems='center'; wbWrap.style.gap='6px';
  const wardInp=document.createElement('input'); wardInp.type='text'; wardInp.placeholder='ward'; wardInp.className='wwWard';
  // Remove datalist to prevent browser autocomplete dropdown on mobile
  // wardInp.setAttribute('list','wwWardListGlobal');
  wardInp.style.fontSize='16px'; wardInp.style.padding='8px 10px'; wardInp.style.height='36px'; wardInp.style.lineHeight='20px';
  const sep=document.createElement('span'); sep.textContent='/'; sep.style.textAlign='center'; sep.style.color='#666'; sep.style.margin='0 4px';
  const bedInp=document.createElement('input'); bedInp.type='text'; bedInp.placeholder='bed/room'; bedInp.style.width='100%'; bedInp.className='wwBed';
  bedInp.style.fontSize='16px'; bedInp.style.padding='8px 10px'; bedInp.style.height='36px'; bedInp.style.lineHeight='20px';
  // Keep bedList element for backward compatibility but don't link it to input
  const bedList=document.createElement('datalist'); bedList.setAttribute('data-bedlist','1'); const bedListId='wwBedList-'+Math.floor(Math.random()*1e9); bedList.id=bedListId; 
  // bedInp.setAttribute('list', bedListId); // Removed to prevent browser autocomplete
  // picker buttons
  const wardPickBtn=document.createElement('button'); wardPickBtn.textContent='▾'; wardPickBtn.className='ghost'; wardPickBtn.title='Pick ward'; wardPickBtn.style.minWidth='36px'; wardPickBtn.style.height='36px';
  const bedPickBtn=document.createElement('button'); bedPickBtn.textContent='▾'; bedPickBtn.className='ghost'; bedPickBtn.title='Pick bed'; bedPickBtn.style.minWidth='36px'; bedPickBtn.style.height='36px';
    // Prefill ward/bed inputs using last-slash split.
    // Example: "กว6/1/9 บุญล้อม" -> ward "กว6/1", bed "9 บุญล้อม".
    if(!bedLabel || bedLabel.startsWith('(new) ') ){
      wardInp.value=''; bedInp.value='';
    } else if((bedLabel||'').includes(WW_BLOCK_SEP)){
      const [wPart,bPart]=(bedLabel||'').split(WW_BLOCK_SEP);
      wardInp.value=(wPart||'').trim();
      bedInp.value=(bPart||'').trim();
    } else {
      // No internal separator -> treat the whole label as ward text, leave bed empty
      wardInp.value=bedLabel||''; bedInp.value='';
    }
  const addBtn=document.createElement('button'); addBtn.textContent='+ Task'; addBtn.className='ghost'; addBtn.title='Add a task to this block';
  // Keep the on-screen keyboard from dismissing when tapping the button.
  addBtn.addEventListener('mousedown', e=> e.preventDefault());
  addBtn.onclick=()=>{ addEmptyTask(getCurrentLabel(), true); };
  // Quick snippet insertion button inside block for convenience
  const snQuick=document.createElement('button'); snQuick.textContent='⧉+'; snQuick.className='ghost'; snQuick.title='Insert snippet';
  snQuick.onclick=()=>{
    if(!wwSnippets.length){ alert('No snippets yet. Use Snippets panel to add some.'); return; }
    // Show simple chooser (reuse showMenu) with snippets
    showInlineSnippetMenu(snQuick, getCurrentLabel());
  };
    const delBtn=document.createElement('button'); delBtn.textContent='delete block'; delBtn.className='delete'; delBtn.onclick=()=>{
      const cur=getCurrentLabel();
      // Only delete the tasks that are currently in this block
      const taskIdsInBlock = tasks.map(t => t.id);
      wwTasks = wwTasks.filter(x=> !taskIdsInBlock.includes(x.id) );
      saveWW(wwTasks); renderWW();
      removeBlockLabel(prof.id, cur);
    };
  actions.appendChild(blockHandle); actions.appendChild(addBtn); actions.appendChild(snQuick); actions.appendChild(delBtn);
    header.appendChild(actions);
  wardInp.style.flex='0 0 auto'; bedInp.style.flex='1 1 0';
  wardInp.style.minWidth='90px';
  wbWrap.appendChild(wardInp); wbWrap.appendChild(wardPickBtn); wbWrap.appendChild(sep); wbWrap.appendChild(bedInp); wbWrap.appendChild(bedPickBtn);
    header.appendChild(wbWrap);
    header.appendChild(bedList);
  const listWrap=document.createElement('div'); listWrap.style.display='grid'; listWrap.style.gap='6px'; listWrap.setAttribute('data-listwrap','1');
    function getCombined(){
      const w=wardInp.value.trim();
      const b=bedInp.value.trim();
      if(w&&b) return w + WW_BLOCK_SEP + b;
      const combined = (w||b)||'';
      // If completely empty and this block has a (new) label, keep the unique label
      if(!combined && bedLabel && bedLabel.startsWith('(new) ')) {
        return bedLabel;
      }
      return combined;
    }
  function renameGroup(oldLabel,newLabel){ 
      if(newLabel===oldLabel) return; 
      wwTasks.forEach(t=>{ if(t.bed===oldLabel){ t.bed=newLabel; } }); 
      saveWW(wwTasks); 
      replaceBlockLabel(prof.id, oldLabel, newLabel); 
      // Update the block's label in DOM without full re-render to prevent flickering
      group.dataset.label = newLabel;
      // Only update preview, don't re-render entire view
      updateWWPreview();
    }
    // Use a function to get current label from DOM to handle multiple sequential changes
    const getCurrentLabel = () => group.dataset.label || bedLabel;
    wardInp.addEventListener('change', ()=> renameGroup(getCurrentLabel(), getCombined()));
    bedInp.addEventListener('change', ()=> renameGroup(getCurrentLabel(), getCombined()));
    // Build initial bed list and refresh suggestions when ward changes
    const rebuildBedList=()=>{
      bedList.innerHTML='';
      const wardName=wardInp.value.trim();
      const wards=(data.wards||[]);
      const addBedOpt=(b)=>{ if((b.status||'active').toLowerCase()==='discharge') return; const val=(b.name||'').trim(); if(!val) return; const opt=document.createElement('option'); opt.value=val; bedList.appendChild(opt); };
      if(wardName){
        const w=wards.find(x=> (x.name||'').trim()===wardName);
        if(w){ (w.beds||[]).forEach(addBedOpt); }
      } else {
        wards.forEach(w=> (w.beds||[]).forEach(addBedOpt));
      }
    };
    rebuildBedList();
    // Autosize ward input width to fit its text
    const sizer=document.createElement('span');
    sizer.style.position='fixed'; sizer.style.left='-9999px'; sizer.style.top='-9999px'; sizer.style.visibility='hidden'; sizer.style.whiteSpace='pre';
    sizer.style.fontSize=getComputedStyle(wardInp).fontSize; sizer.style.fontFamily=getComputedStyle(wardInp).fontFamily; sizer.style.fontWeight=getComputedStyle(wardInp).fontWeight;
    document.body.appendChild(sizer);
    const fitWard=()=>{
      const txt=(wardInp.value||wardInp.placeholder||'');
      sizer.textContent=txt;
      const extra=26; // padding + small buffer
      const maxPx=Math.max(140, Math.floor(wbWrap.clientWidth*0.6)||240);
      const w=Math.min(maxPx, sizer.getBoundingClientRect().width + extra);
      wardInp.style.width = w + 'px';
    };
    setTimeout(fitWard, 0);
    wardInp.addEventListener('input', fitWard);
    // Refit on picker selections
    const refitAndRename=()=>{ renameGroup(getCurrentLabel(), getCombined()); fitWard(); };
    
    wardInp.addEventListener('input', ()=>{ rebuildBedList(); });

    // Simple custom pickers using floating menu
    function showMenu(anchor, items, onPick){
      const menu=document.createElement('div');
      menu.style.position='fixed';
      menu.style.background='#fff'; menu.style.border='1px solid #ddd'; menu.style.borderRadius='8px'; menu.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)';
      menu.style.zIndex='10000'; menu.style.maxHeight='40vh'; menu.style.overflow='auto';
      const positionMenu=()=>{
        const rect=anchor.getBoundingClientRect();
        const vw=window.innerWidth; const vh=window.innerHeight;
        const menuWidth=Math.max(220, rect.width);
        menu.style.width=menuWidth+'px';
        let left=rect.left; let top=rect.bottom+4;
        if(left + menuWidth + 8 > vw) left = Math.max(8, vw - menuWidth - 8);
        if(!menu.parentElement) document.body.appendChild(menu);
        const mh=menu.getBoundingClientRect().height || 200;
        if(top + mh + 8 > vh) top = Math.max(8, vh - mh - 8);
        menu.style.left=left+'px'; menu.style.top=top+'px';
      };
      const close=()=>{ if(menu.parentElement){ document.body.removeChild(menu); } document.removeEventListener('click', onDoc); window.removeEventListener('resize', positionMenu); window.removeEventListener('scroll', positionMenu, true); };
      const onDoc=(e)=>{ if(!menu.contains(e.target) && e.target!==anchor) close(); };
      items.forEach(txt=>{
        const it=document.createElement('div'); it.textContent=txt; it.style.padding='8px 12px'; it.style.cursor='pointer';
        it.addEventListener('mouseenter', ()=> it.style.background='#f3f5f8');
        it.addEventListener('mouseleave', ()=> it.style.background='');
        it.addEventListener('click', ()=>{ onPick(txt); close(); });
        menu.appendChild(it);
      });
      positionMenu();
      document.addEventListener('click', onDoc);
      window.addEventListener('resize', positionMenu);
      window.addEventListener('scroll', positionMenu, true);
    }
    // Inline snippet suggestions (singleton menu per render)
    let wwSuggMenu=null; let wwSuggOnDoc=null; let wwSuggRepos=null;
    function closeSnippetSuggest(){
      if(wwSuggMenu && wwSuggMenu.parentElement){ document.body.removeChild(wwSuggMenu); }
      wwSuggMenu=null;
      if(wwSuggOnDoc){ document.removeEventListener('click', wwSuggOnDoc); wwSuggOnDoc=null; }
      if(wwSuggRepos){ window.removeEventListener('resize', wwSuggRepos); window.removeEventListener('scroll', wwSuggRepos, true); wwSuggRepos=null; }
    }
    function showSnippetSuggest(anchor, query, onPick){
      const q=(query||'').trim().toLowerCase();
      const all=(wwSnippets||[]).map(s=>s.text);
      const items = q ? all.filter(t=> t.toLowerCase().includes(q)).slice(0,8)
                      : all.slice(0,8);
      if(items.length===0){ closeSnippetSuggest(); return; }
      if(wwSuggMenu){ closeSnippetSuggest(); }
      const menu=document.createElement('div'); wwSuggMenu=menu;
      menu.style.position='fixed'; menu.style.background='#fff'; menu.style.border='1px solid #ddd'; menu.style.borderRadius='8px'; menu.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)';
      menu.style.zIndex='10000'; menu.style.maxHeight='40vh'; menu.style.overflow='auto';
      items.forEach(txt=>{
        const it=document.createElement('div'); it.textContent=txt; it.style.padding='8px 12px'; it.style.cursor='pointer';
        it.addEventListener('mouseenter', ()=> it.style.background='#f3f5f8');
        it.addEventListener('mouseleave', ()=> it.style.background='');
        it.addEventListener('click', ()=>{ onPick(txt); closeSnippetSuggest(); });
        menu.appendChild(it);
      });
      function position(){
        const rect=anchor.getBoundingClientRect();
        const vw=window.innerWidth; const vh=window.innerHeight;
        const menuWidth=Math.max(220, rect.width);
        menu.style.width=menuWidth+'px';
        let left=rect.left; let top=rect.bottom+4;
        if(left + menuWidth + 8 > vw) left = Math.max(8, vw - menuWidth - 8);
        if(!menu.parentElement) document.body.appendChild(menu);
        const mh=menu.getBoundingClientRect().height || 200;
        if(top + mh + 8 > vh) top = Math.max(8, vh - mh - 8);
        menu.style.left=left+'px'; menu.style.top=top+'px';
      }
      wwSuggOnDoc=(e)=>{ if(!menu.contains(e.target) && e.target!==anchor) closeSnippetSuggest(); };
      wwSuggRepos=()=> position();
      position();
      document.addEventListener('click', wwSuggOnDoc);
      window.addEventListener('resize', wwSuggRepos);
      window.addEventListener('scroll', wwSuggRepos, true);
    }
    function showInlineSnippetMenu(anchor, targetLabel){
      if(!wwSnippets.length){ return; }
      const items=wwSnippets.map(s=> s.text);
      showMenu(anchor, items, (val)=>{
        const newId='ww'+Date.now()+Math.floor(Math.random()*1000);
        wwTasks.push({ id:newId, bed: targetLabel, task: val });
        saveWW(wwTasks); renderWW();
        // Do not auto-focus the newly inserted task from the per-block snippets button
      });
    }
    wardPickBtn.addEventListener('click', ()=>{
      const wards=(data.wards||[]).map(w=> (w.name||'').trim()).filter(Boolean);
      showMenu(wardPickBtn, wards, (val)=>{ wardInp.value=val; refitAndRename(); rebuildBedList(); });
    });
    bedPickBtn.addEventListener('click', ()=>{
      const wn=wardInp.value.trim();
      let beds=[]; if(wn){ const w=(data.wards||[]).find(x=> (x.name||'').trim()===wn); if(w) beds=(w.beds||[]).filter(b=> (b.status||'active').toLowerCase()!=='discharge').map(b=> (b.name||'').trim()); }
      if(beds.length===0){ (data.wards||[]).forEach(w=> (w.beds||[]).forEach(b=>{ if((b.status||'active').toLowerCase()==='discharge') return; beds.push((b.name||'').trim()); })); }
      beds = Array.from(new Set(beds));
      showMenu(bedPickBtn, beds, (val)=>{ bedInp.value=val; renameGroup(getCurrentLabel(), getCombined()); });
    });
    const isTouch=('ontouchstart' in window)||(navigator.maxTouchPoints>0);
    function makeRow(t){
  const row=document.createElement('div'); row.style.display='grid'; row.style.gridTemplateColumns='auto 1fr auto auto'; row.style.gap='6px'; row.style.alignItems='center'; row.dataset.taskId=t.id;
      const dot=document.createElement('span'); dot.textContent='⭕️'; dot.setAttribute('aria-hidden','true'); dot.style.opacity='0.9'; dot.className='ww-task-handle';
  const inp=document.createElement('textarea'); inp.rows=1; inp.value=t.task; inp.style.width='100%'; inp.style.resize='vertical'; inp.dataset.id=t.id; inp.style.fontSize='15px'; inp.style.lineHeight='1.3'; inp.style.minHeight='34px'; inp.style.padding='6px 8px'; inp.style.minWidth='0';
  const autoresize=()=>{ inp.style.height='auto'; inp.style.height = (inp.scrollHeight)+'px'; };
  setTimeout(autoresize, 0);
  inp.addEventListener('input', ()=>{ const rec=wwTasks.find(x=>x.id===t.id); if(rec){ rec.task=inp.value; saveWW(wwTasks); updateWWPreview(); } autoresize(); showSnippetSuggest(inp, inp.value, (val)=>{ inp.value=val; autoresize(); const rec=wwTasks.find(x=>x.id===t.id); if(rec){ rec.task=inp.value; saveWW(wwTasks); updateWWPreview(); } }); });
    // show suggestions on focus as well (helpful on mobile)
    inp.addEventListener('focus', ()=>{ showSnippetSuggest(inp, inp.value, (val)=>{ inp.value=val; autoresize(); const rec=wwTasks.find(x=>x.id===t.id); if(rec){ rec.task=inp.value; saveWW(wwTasks); updateWWPreview(); } }); });
      // hide suggestions on blur (allow time for click)
    inp.addEventListener('blur', ()=> setTimeout(()=> closeSnippetSuggest(), 120));
  const dup=document.createElement('button'); dup.textContent='⧉'; dup.className='ghost'; dup.title='Duplicate'; dup.style.minWidth='36px'; dup.style.height='32px';
      dup.onclick=()=>{
        const newId='ww'+Date.now()+Math.floor(Math.random()*1000);
        wwTasks.push({ id:newId, bed: getCurrentLabel(), task: t.task });
        saveWW(wwTasks);
        // place after current
        const nextRow = row.nextElementSibling; const beforeId = nextRow && nextRow.hasAttribute('data-task-id') ? nextRow.getAttribute('data-task-id') : null;
        if(beforeId){ reorderTasks(getCurrentLabel(), newId, beforeId); }
        else { renderWW(); }
      };
  const del=document.createElement('button'); del.textContent='×'; del.className='ghost'; del.title='Delete'; del.style.minWidth='34px'; del.style.height='32px'; del.onclick=()=>{ wwTasks=wwTasks.filter(x=>x.id!==t.id); saveWW(wwTasks); renderWW(); };
      row.appendChild(dot); row.appendChild(inp); row.appendChild(dup); row.appendChild(del);
      if(!isTouch){
        // Only the dot is draggable; row is drop/move/duplicate target.
        dot.setAttribute('draggable','true');
        dot.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', t.id); row.style.opacity='0.55'; });
        dot.addEventListener('dragend', ()=>{ row.style.opacity=''; });
        row.addEventListener('dragover', (e)=>{ e.preventDefault(); row.style.background='#eef3ff'; });
        row.addEventListener('dragleave', ()=>{ row.style.background=''; });
        row.addEventListener('drop', (e)=>{ e.preventDefault(); row.style.background=''; const fromId=e.dataTransfer.getData('text/plain'); if(!fromId) return; const toId=t.id; const fromTask=wwTasks.find(x=> x.id===fromId); if(!fromTask) return;
          const currentLabel = getCurrentLabel();
          const isSameBlock = fromTask.bed===currentLabel;
          // Detect copy vs move: hold Alt/Option (or Cmd) to duplicate
          const duplicate = e.altKey || e.metaKey;
          if(duplicate){
            // Duplicate into this block before target
            const newId='ww'+Date.now()+Math.floor(Math.random()*1000);
            wwTasks.push({ id:newId, bed: currentLabel, task: fromTask.task });
            saveWW(wwTasks);
            reorderTasks(currentLabel, newId, toId);
            return;
          }
          if(isSameBlock){
            if(fromId!==toId) reorderTasks(currentLabel, fromId, toId);
          } else {
            moveTaskAcrossBlocks(fromId, currentLabel, toId);
          }
        });
        // Allow dropping at end of block (below all tasks)
        listWrap.addEventListener('dragover', (e)=>{ e.preventDefault(); });
        listWrap.addEventListener('drop', (e)=>{ const fromId=e.dataTransfer.getData('text/plain'); if(!fromId) return; const fromTask=wwTasks.find(x=> x.id===fromId); if(!fromTask) return; const duplicate=e.altKey||e.metaKey; const currentLabel = getCurrentLabel(); if(duplicate){ const newId='ww'+Date.now()+Math.floor(Math.random()*1000); wwTasks.push({id:newId,bed:currentLabel,task:fromTask.task}); saveWW(wwTasks); renderWW(); return;} if(fromTask.bed!==currentLabel){ moveTaskAcrossBlocks(fromId, currentLabel, null); }});
      } else {
        // Mobile long-press drag on dot
        let pressTimer=null; let touchId=null; let dragState=null; const LONG_MS=350; const CANCEL_MOVE=10;
        function clearTimer(){ if(pressTimer){ clearTimeout(pressTimer); pressTimer=null; } }
        dot.addEventListener('touchstart', (e)=>{
          if(e.touches.length!==1) return; touchId=e.touches[0].identifier; const startY=e.touches[0].clientY; const startX=e.touches[0].clientX;
          pressTimer=setTimeout(()=>{
            // start drag
            const r=row.getBoundingClientRect();
            const ph=document.createElement('div'); ph.style.height=r.height+'px'; ph.style.border='2px dashed #5b9cff'; ph.style.borderRadius='8px'; ph.style.margin='0';
            const container=listWrap; const sourceLabel=getCurrentLabel(); const taskId=t.id;
            container.insertBefore(ph, row.nextSibling);
            row.style.position='fixed'; row.style.left=r.left+'px'; row.style.top=r.top+'px'; row.style.width=r.width+'px'; row.style.zIndex='2000'; row.style.opacity='0.9'; row.style.background='#fff'; row.style.boxShadow='0 8px 24px rgba(0,0,0,0.25)'; row.style.pointerEvents='none';
            dragState={placeholder:ph,startY,startX,row,origIdx:Array.from(container.children).indexOf(row), container, sourceLabel, taskId};
            document.body.style.userSelect='none';
          }, LONG_MS);
        }, {passive:true});
        dot.addEventListener('touchmove', (e)=>{
          const t=[...e.touches].find(t=>t.identifier===touchId); if(!t) return;
          if(!dragState){
            // cancel long-press if moved significantly before start
            const dy=Math.abs(t.clientY - t.screenY); const dx=Math.abs(t.clientX - t.screenX);
            if(dy>CANCEL_MOVE || dx>CANCEL_MOVE) clearTimer();
            return;
          }
          e.preventDefault();
          const dy=t.clientY - dragState.startY; dragState.row.style.transform=`translateY(${dy}px)`;
          // Find target block under finger and its listWrap
          let targetBlock=document.elementFromPoint(t.clientX, t.clientY);
          targetBlock = targetBlock ? targetBlock.closest('.ww-block') : null;
          let targetContainer = targetBlock ? targetBlock.querySelector('[data-listwrap]') : null;
          if(!targetContainer) targetContainer = dragState.container; // fallback
          // reposition placeholder within target container
          const siblings=[...targetContainer.querySelectorAll('div[data-task-id]')].filter(el=> el!==dragState.row && el!==dragState.placeholder);
          let insertAfter=null; const center=t.clientY;
          siblings.forEach(s=>{ const sr=s.getBoundingClientRect(); if(center>sr.top + sr.height/2) insertAfter=s; });
          if(insertAfter){ targetContainer.insertBefore(dragState.placeholder, insertAfter.nextSibling); }
          else { targetContainer.insertBefore(dragState.placeholder, targetContainer.firstChild); }
          dragState.container = targetContainer;
        }, {passive:false});
        function finishDrag(){
          if(!dragState) return;
          const {row,placeholder, container, sourceLabel, taskId}=dragState; row.style.position=''; row.style.left=''; row.style.top=''; row.style.width=''; row.style.zIndex=''; row.style.opacity=''; row.style.background=''; row.style.boxShadow=''; row.style.transform=''; row.style.pointerEvents='';
          const targetBlock = placeholder.closest('.ww-block'); const targetLabel = targetBlock ? targetBlock.dataset.label : sourceLabel;
          // beforeId is the id of the element currently at placeholder position
          const nextEl = placeholder.nextElementSibling; const beforeId = nextEl && nextEl.hasAttribute('data-task-id') ? nextEl.getAttribute('data-task-id') : null;
          placeholder.replaceWith(row);
          if(targetLabel===sourceLabel){
            // same block: reorder using container order
            const idOrder=[...container.querySelectorAll('div[data-task-id]')].map(el=> el.dataset.taskId);
            const groupTasks=wwTasks.filter(x=> x.bed===sourceLabel);
            const sorted=groupTasks.slice().sort((a,b)=> idOrder.indexOf(a.id)-idOrder.indexOf(b.id));
            let k=0; for(let i=0;i<wwTasks.length;i++){ if(wwTasks[i].bed===sourceLabel){ wwTasks[i]=sorted[k++]; } }
            saveWW(wwTasks); renderWW();
          } else {
            moveTaskAcrossBlocks(taskId, targetLabel, beforeId);
          }
          dragState=null; document.body.style.userSelect='';
        }
        // Duplicate on double-tap of dot (mobile)
        let lastTap=0; dot.addEventListener('touchend', (e)=>{
          const now=Date.now(); if(!dragState && now-lastTap<250){
            const newId='ww'+Date.now()+Math.floor(Math.random()*1000); wwTasks.push({id:newId,bed:getCurrentLabel(),task:t.task}); saveWW(wwTasks); renderWW(); }
          lastTap=now;
        });
        function cancelDrag(){
          if(!dragState) return; const {row,placeholder}=dragState; row.style.position=''; row.style.transform=''; row.style.opacity=''; row.style.boxShadow=''; if(placeholder.parentElement) placeholder.remove(); dragState=null; document.body.style.userSelect=''; renderWW();
        }
        dot.addEventListener('touchend', ()=>{ clearTimer(); if(dragState) finishDrag(); });
        dot.addEventListener('touchcancel', ()=>{ clearTimer(); if(dragState) cancelDrag(); });
      }
      return row;
    }
    tasks.forEach(t=> listWrap.appendChild(makeRow(t)));
    // Incremental appender used by addEmptyTask so adding a task doesn't re-render
    // (and so the keyboard/focus stay put). Keeps the block's task list in sync.
    group.__appendTask=(taskObj)=>{ tasks.push(taskObj); const r=makeRow(taskObj); listWrap.appendChild(r); return r; };
    group.appendChild(header); group.appendChild(listWrap);
    // Drag-drop reordering for blocks
  group.addEventListener('dragstart', (e)=>{ if(!e.target.closest('.ww-block-handle')){ e.preventDefault(); return; } e.dataTransfer.setData('text/plain', getCurrentLabel()); group.style.opacity='0.5'; });
    group.addEventListener('dragend', ()=>{ group.style.opacity=''; group.style.borderColor='#ddd'; });
    group.addEventListener('dragover', (e)=>{ e.preventDefault(); group.style.borderColor='#5b9cff'; });
    group.addEventListener('dragleave', ()=>{ group.style.borderColor='#ddd'; });
    group.addEventListener('drop', (e)=>{ e.preventDefault(); group.style.borderColor='#ddd'; const from=e.dataTransfer.getData('text/plain'); const to=getCurrentLabel(); if(!from||from===to) return; const prof=getCurrentWWProfile(); moveBlock(prof.id, from, to); renderWW(); });
  // Mobile long-press drag support (use dedicated handle)
  enableMobileBlockDrag(blockHandle, group, getCurrentLabel(), prof.id);
  return group;
}

// Create empty block (no auto extra blank rows)
wwAddBlock?.addEventListener('mousedown', e=> e.preventDefault());
wwAddBlock?.addEventListener('click', ()=>{
  const prof = getCurrentWWProfile();
  if(!prof) return;
  const tempLabel = '(new) ' + (Date.now()%1e7) + '-' + Math.floor(Math.random()*1000);
  wwTasks.push({ id:'ww'+Date.now()+Math.floor(Math.random()*1000), bed: tempLabel, task:'' });
  saveWW(wwTasks);
  appendBlockIfMissing(prof.id, tempLabel);
  // Append just the new block (no full re-render) so the keyboard/scroll stay calm.
  const group=buildWWBlock(prof, tempLabel);
  wwList.appendChild(group);
  updateWWPreview();
  const w=group.querySelector('.wwWard');
  if(w){ w.focus(); }
  group.scrollIntoView({ block:'nearest', behavior:'smooth' });
});

// --- Mobile block drag (long press) ---
let mbDragState=null; // {el,label,profileId,startY,offsetY,placeholder}
function enableMobileBlockDrag(handleEl, dragEl, label, profileId){
  const LONG_PRESS_MS=350;
  let pressTimer=null; let touchId=null;
  function clearTimer(){ if(pressTimer){ clearTimeout(pressTimer); pressTimer=null; } }
  handleEl.addEventListener('touchstart', (e)=>{
    if(e.touches.length!==1) return; touchId=e.touches[0].identifier; const startY=e.touches[0].clientY;
    pressTimer=setTimeout(()=>{ startMobileBlockDrag(dragEl,label,profileId,startY); }, LONG_PRESS_MS);
  }, {passive:true});
  handleEl.addEventListener('touchmove', (e)=>{
    if(pressTimer && e.touches.length===1){
      const dy=Math.abs(e.touches[0].clientY - e.touches[0].screenY); // movement
      if(dy>12) clearTimer();
    }
    if(mbDragState){
      const t=[...e.touches].find(t=>t.identifier===touchId); if(!t) return;
      e.preventDefault(); moveMobileBlockDrag(t.clientY);
    }
  }, {passive:false});
  handleEl.addEventListener('touchend', (e)=>{
    clearTimer(); if(mbDragState){ finishMobileBlockDrag(); }
  });
  handleEl.addEventListener('touchcancel', ()=>{ clearTimer(); if(mbDragState){ cancelMobileBlockDrag(); } });
}
function startMobileBlockDrag(el,label,profileId,startY){
  const rect=el.getBoundingClientRect();
  const ph=document.createElement('div');
  ph.className='ww-block-placeholder';
  ph.style.height=rect.height+'px'; ph.style.border='2px dashed #5b9cff'; ph.style.borderRadius='10px'; ph.style.margin='0';
  el.parentElement.insertBefore(ph, el.nextSibling);
  el.style.position='fixed'; el.style.left=rect.left+'px'; el.style.top=rect.top+'px'; el.style.width=rect.width+'px'; el.style.zIndex='2000'; el.style.opacity='0.9'; el.style.boxShadow='0 10px 30px rgba(0,0,0,0.25)';
  mbDragState={el,label,profileId,startY,offsetY:0,placeholder:ph,origIndex:Array.from(wwList.children).indexOf(el)};
  document.body.style.userSelect='none';
}
function moveMobileBlockDrag(currentY){
  if(!mbDragState) return;
  const dy=currentY - mbDragState.startY; mbDragState.offsetY=dy; mbDragState.el.style.transform=`translateY(${dy}px)`;
  // Find target position
  const blocks=[...wwList.querySelectorAll('.ww-block')].filter(b=> b!==mbDragState.el);
  let insertAfter=null; const dragCenter=currentY;
  blocks.forEach(b=>{ const r=b.getBoundingClientRect(); if(dragCenter>r.top + r.height/2) insertAfter=b; });
  if(insertAfter){ wwList.insertBefore(mbDragState.placeholder, insertAfter.nextSibling); }
  else { wwList.insertBefore(mbDragState.placeholder, wwList.firstChild); }
}
function finishMobileBlockDrag(){
  const {el,label,profileId,placeholder}=mbDragState; el.style.position=''; el.style.left=''; el.style.top=''; el.style.width=''; el.style.zIndex=''; el.style.opacity=''; el.style.boxShadow=''; el.style.transform='';
  document.body.style.userSelect='';
  const siblings=[...wwList.querySelectorAll('.ww-block')].filter(b=> b!==el);
  const newIndex=[...wwList.children].indexOf(placeholder);
  placeholder.replaceWith(el);
  const order=siblings.map(b=> b.dataset.label);
  // Insert dragged label at newIndex relative to other labels
  order.splice(newIndex,0,label);
  saveBlockOrder(profileId, order);
  mbDragState=null; renderWW();
}
function cancelMobileBlockDrag(){
  const {el,placeholder}=mbDragState||{}; if(el){ el.style.position=''; el.style.transform=''; el.style.opacity=''; el.style.boxShadow=''; }
  if(placeholder&&placeholder.parentElement) placeholder.remove();
  document.body.style.userSelect=''; mbDragState=null; renderWW();
}

function addEmptyTask(bedLabel, focus=false){
  // Allow empty bedLabel - tasks can exist without ward/bed
  const label = bedLabel || '';
  const newId='ww'+Date.now()+Math.floor(Math.random()*1000);
  const task={ id:newId, bed: label, task:'' };
  wwTasks.push(task); saveWW(wwTasks);
  // Incremental append: don't re-render the whole list, so the keyboard and
  // scroll position stay put. Fall back to a full render if the block isn't found.
  const block=[...wwList.querySelectorAll('.ww-block')].find(b=> b.dataset.label===label);
  if(block && typeof block.__appendTask==='function'){
    const row=block.__appendTask(task);
    updateWWPreview();
    if(focus){ const ta=row.querySelector('textarea[data-id]'); if(ta){ ta.focus(); ta.selectionStart=ta.selectionEnd=ta.value.length; } }
  } else {
    renderWW();
    if(focus){
      setTimeout(()=>{
        const b2=[...wwList.querySelectorAll('.ww-block')].find(b=> b.dataset.label===label);
        const ta=b2?.querySelector(`textarea[data-id="${newId}"]`) || b2?.querySelector('textarea[data-id]:last-of-type');
        if(ta){ ta.focus(); ta.selectionStart=ta.selectionEnd=ta.value.length; }
      },60);
    }
  }
}

function reorderTasks(bedLabel, fromId, toId){
  const indices=[]; const groupTasks=[];
  wwTasks.forEach((t,i)=>{ if(t.bed===bedLabel){ indices.push(i); groupTasks.push(t); } });
  const orderIds=groupTasks.map(t=>t.id);
  const fromIdx=orderIds.indexOf(fromId); const toIdx=orderIds.indexOf(toId);
  if(fromIdx<0||toIdx<0) return;
  // remove and insert
  const [moved]=groupTasks.splice(fromIdx,1);
  groupTasks.splice(toIdx,0,moved);
  // write back
  for(let j=0;j<indices.length;j++){ wwTasks[indices[j]] = groupTasks[j]; }
  saveWW(wwTasks); renderWW();
}

// Move a task to a different block (bedLabel) optionally before another task id (beforeId); if beforeId null append
function moveTaskAcrossBlocks(taskId, targetBedLabel, beforeId){
  const task=wwTasks.find(t=> t.id===taskId);
  if(!task || !targetBedLabel) return;
  const originalBed=task.bed;
  if(originalBed===targetBedLabel){
    // same block: if beforeId provided reorder; else append at end
    if(beforeId){ reorderTasks(targetBedLabel, taskId, beforeId); return; }
    // append: remove then push to end
    const groupIndices=[]; const groupTasks=[];
    wwTasks.forEach((t,i)=>{ if(t.bed===targetBedLabel){ groupIndices.push(i); groupTasks.push(t); } });
    const idx=groupTasks.findIndex(t=> t.id===taskId); if(idx<0) return;
    const [mv]=groupTasks.splice(idx,1); groupTasks.push(mv);
    for(let j=0;j<groupIndices.length;j++){ wwTasks[groupIndices[j]] = groupTasks[j]; }
    saveWW(wwTasks); renderWW(); return;
  }
  // Different block: rebuild order for both affected blocks preserving overall sequence
  task.bed=targetBedLabel; // assign new block label
  // Build mapping of tasks by bed in desired order (keep existing order of wwTasks array except for task reposition)
  const byBed=new Map();
  wwTasks.forEach(t=>{ if(!byBed.has(t.bed)) byBed.set(t.bed, []); if(t.id!==taskId) byBed.get(t.bed).push(t); });
  // Insert moved task into target bed tasks at position
  const targetArr=byBed.get(targetBedLabel) || []; if(beforeId){
    const pos=targetArr.findIndex(x=> x.id===beforeId); const insertPos= pos>=0? pos : targetArr.length; targetArr.splice(insertPos,0, task);
  } else targetArr.push(task);
  byBed.set(targetBedLabel, targetArr);
  // Reconstruct wwTasks following saved block ordering
  const prof = getCurrentWWProfile();
  const orderLabels=getOrderedLabels(prof.id, Array.from(byBed.keys()));
  const rebuilt=[];
  orderLabels.forEach(lbl=>{ const arr=byBed.get(lbl)||[]; arr.forEach(t=> rebuilt.push(t)); });
  // Replace wwTasks entirely
  wwTasks = rebuilt;
  saveWW(wwTasks); renderWW();
}

// Template for extra entry blocks (Ward, Bed, Tasks)
// Dynamic entry blocks removed (rendered groups are now the input/edit surface)
wwCopy?.addEventListener('click', async ()=>{
  const text=wwPreviewTa.value||'';
  let ok=false;
  try{ await navigator.clipboard.writeText(text); ok=true; }catch{}
  if(!ok){
    try{
      const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); ok=true;
    }catch{}
  }
  wwCopy.textContent= ok? 'Copied' : 'Copy failed';
  setTimeout(()=> wwCopy.textContent='Copy', 1200);
});
// Mobile preview copy
document.getElementById('wwCopyMobile')?.addEventListener('click', async ()=>{
  const text=document.getElementById('wwPreviewMobile')?.textContent||'';
  let ok=false; try{ await navigator.clipboard.writeText(text); ok=true; }catch{}
  if(!ok){ try{ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); ok=true; }catch{} }
  const btn=document.getElementById('wwCopyMobile'); if(btn){ btn.textContent= ok? 'Copied':'Copy failed'; setTimeout(()=> btn.textContent='Copy',1200); }
});
// Mobile preview sheet interactions
const wwMobileSheet=document.getElementById('wwMobilePreviewSheet');
const wwTogglePreview=document.getElementById('wwTogglePreview');
const wwCloseSheet=document.getElementById('wwCloseSheet');
const wwSheetGrabber=document.getElementById('wwSheetGrabber');
const WW_MOBILE_H_KEY='ww-mobile-preview-h-v1';
const WW_MOBILE_OPEN_KEY='ww-mobile-preview-open-v1';
function wwOpenSheet(){ if(!wwMobileSheet) return; wwMobileSheet.classList.add('open'); try{ localStorage.setItem(WW_MOBILE_OPEN_KEY,'true'); }catch{} }
function wwCloseSheetFn(){ if(!wwMobileSheet) return; wwMobileSheet.classList.remove('open'); try{ localStorage.setItem(WW_MOBILE_OPEN_KEY,'false'); }catch{} }
wwTogglePreview?.addEventListener('click', ()=>{ if(wwMobileSheet.classList.contains('open')) wwCloseSheetFn(); else wwOpenSheet(); });
wwCloseSheet?.addEventListener('click', wwCloseSheetFn);
// resize by drag
let wwResizing=false, wwStartY=0, wwStartH=0;
function wwStartResize(ev){ if(!wwMobileSheet) return; wwResizing=true; wwStartY=(ev.touches?ev.touches[0].clientY:ev.clientY); wwStartH=wwMobileSheet.getBoundingClientRect().height; document.body.style.userSelect='none'; }
function wwDoResize(ev){ if(!wwResizing||!wwMobileSheet) return; const y=(ev.touches?ev.touches[0].clientY:ev.clientY); const dy=wwStartY - y; let newH = wwStartH + dy; const vh = window.innerHeight; if(newH < vh*0.25) newH = vh*0.25; if(newH > vh*0.9) newH = vh*0.9; wwMobileSheet.style.height = newH + 'px'; }
function wwStopResize(){ if(!wwResizing) return; wwResizing=false; document.body.style.userSelect=''; try{ const h = wwMobileSheet.getBoundingClientRect().height; const vh=window.innerHeight; localStorage.setItem(WW_MOBILE_H_KEY, ((h/vh)*100).toFixed(2)); }catch{} }
wwSheetGrabber?.addEventListener('mousedown', wwStartResize); document.addEventListener('mousemove', wwDoResize); document.addEventListener('mouseup', wwStopResize);
wwSheetGrabber?.addEventListener('touchstart', wwStartResize, {passive:true}); document.addEventListener('touchmove', wwDoResize, {passive:false}); document.addEventListener('touchend', wwStopResize);
// apply saved height/open state
try{ const hPerc=parseFloat(localStorage.getItem(WW_MOBILE_H_KEY)||''); if(!Number.isNaN(hPerc)&&wwMobileSheet){ wwMobileSheet.style.height = hPerc + 'vh'; } }catch{}
try{ const open=localStorage.getItem(WW_MOBILE_OPEN_KEY); if(open==='true') wwOpenSheet(); }catch{}

// No ward picker; suggestions are in wwBed datalist

// Persist title and live-update preview
wwTitle?.addEventListener('input', ()=>{
  const prof = getCurrentWWProfile();
  if(prof){
    prof.title = wwTitle.value || '';
    saveWWProfiles();
  }
  updateWWPreview();
});

// Re-render when switching profiles (removed date change handler)

// Preview show/hide toggle (persisted)
const wwPreviewSection=document.getElementById('wwPreviewSection');
const wwPreviewToggle=document.getElementById('wwPreviewToggle');
const WW_PREVIEW_OPEN_KEY='ww-preview-open-v1';
function applyWWPreviewOpen(open){
  if(!wwPreviewSection||!wwPreviewToggle) return;
  wwPreviewSection.querySelector('textarea')?.classList.toggle('collapsed', !open);
  wwPreviewSection.style.display = open? '' : 'none';
  wwPreviewToggle.textContent = open? 'Hide' : 'Show';
}
wwPreviewToggle?.addEventListener('click', ()=>{
  const isOpen = wwPreviewSection.style.display !== 'none';
  const next=!isOpen; applyWWPreviewOpen(next); try{ localStorage.setItem(WW_PREVIEW_OPEN_KEY, JSON.stringify(next)); }catch{}
});
try{ const saved=JSON.parse(localStorage.getItem(WW_PREVIEW_OPEN_KEY)||'true'); applyWWPreviewOpen(!!saved); }catch{ applyWWPreviewOpen(true); }

// Enter key flows
// Removed standalone bed/task entry keyboard handling (inline editing only now)

// Removed automatic blank row mechanism; manual add only

/* ===========================================================================
   Quick I/O draft note
   ---------------------------------------------------------------------------
   Lets a user open the Quick Ward Note + I/O calculator WITHOUT first creating
   a ward/bed. Work is autosaved to a localStorage "draft" slot and can be
   attached to a ward (new bed) later via the Save button.
   =========================================================================== */
const DRAFT_KEY='wardManagerDraftNote-v1';
let draftMode=false;
function loadDraft(){ try{ return JSON.parse(localStorage.getItem(DRAFT_KEY)||'null'); }catch{ return null; } }
function saveDraft(obj){ try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(obj||{})); }catch{} }
function clearDraft(){ try{ localStorage.removeItem(DRAFT_KEY); }catch{} }
function hasDraft(){ const d=loadDraft(); return !!(d && Object.keys(d).length); }

// Switch the profile-page header/Save button between "bed" and "draft" looks.
function setProfileChrome(isDraft){
  const sub=document.getElementById('profileSubtitle');
  if(sub) sub.textContent = isDraft
    ? '📝 Draft — not saved to a ward yet'
    : 'Fast template for bedside updates';
  if(saveBtn) saveBtn.textContent = isDraft ? 'Save to Ward…' : 'Save';
}

function persistDraft(){
  if(!draftMode) return;
  const headerSel=document.getElementById('headerStatusSelect');
  const cur=notifyEditor.getData();
  saveDraft({ ...cur, status: headerSel ? headerSel.value : 'active' });
}

function openDraftNote(){
  draftMode=true;
  selectedBedId=null;
  const saved=loadDraft()||{};
  bedContainer.style.display='none';
  wardWorkPage.style.display='none';
  notesPage.style.display='none';
  profilePage.style.display='flex';
  setProfileChrome(true);
  notifyEditor.bootstrap({
    bed: saved.bed||'', hn: saved.hn||'', hashtags: saved.hashtags||'',
    cli: saved.cli||'', mx: saved.mx||'',
    bt: saved.bt||'', pr: saved.pr||'', rr: saved.rr||'', bp: saved.bp||'', o2: saved.o2||'',
    io: saved.io || [{in:[],out:[]},{in:[],out:[]}],
    wardName: ''
  });
  const headerSel=document.getElementById('headerStatusSelect');
  const applyHeaderStatus=(val)=>{
    if(!headerSel) return;
    headerSel.classList.toggle('status-discharge', val==='discharge');
    headerSel.classList.toggle('status-active', val!=='discharge');
  };
  if(headerSel){
    headerSel.value = (saved.status==='discharge') ? 'discharge' : 'active';
    applyHeaderStatus(headerSel.value);
    headerSel.onchange=()=>{ applyHeaderStatus(headerSel.value); const st=document.getElementById('statusSelect'); if(st) st.value=headerSel.value; persistDraft(); };
  }
  const stSel=document.getElementById('statusSelect');
  if(stSel){
    stSel.value = headerSel ? headerSel.value : 'active';
    stSel.onchange=()=>{ if(headerSel){ headerSel.value=stSel.value; applyHeaderStatus(stSel.value); } persistDraft(); };
  }
  notifyEditor.onChange(persistDraft);
  // Focus the bed field for an immediate start
  setTimeout(()=>{ const bedInput=document.getElementById('bed'); if(bedInput) bedInput.focus(); }, 50);
}

function openSaveDraftModal(){
  const modal=document.getElementById('saveDraftModal');
  const sel=document.getElementById('saveDraftWardSelect');
  const newRow=document.getElementById('saveDraftNewWardRow');
  if(!modal||!sel) return;
  sel.innerHTML='';
  data.wards.forEach(w=>{ const o=document.createElement('option'); o.value=w.id; o.textContent=w.name||'(unnamed ward)'; sel.appendChild(o); });
  const newOpt=document.createElement('option'); newOpt.value='__new__'; newOpt.textContent='➕ New ward…'; sel.appendChild(newOpt);
  if(selectedWardId && data.wards.some(w=>w.id===selectedWardId)) sel.value=selectedWardId;
  else if(data.wards.length===0) sel.value='__new__';
  const syncNewRow=()=>{ if(newRow) newRow.style.display = (sel.value==='__new__') ? 'flex' : 'none'; };
  sel.onchange=syncNewRow; syncNewRow();
  modal.style.display='flex';
  setTimeout(()=>{ if(sel.value==='__new__'){ const i=document.getElementById('saveDraftNewWardName'); if(i) i.focus(); } }, 50);
}
function closeSaveDraftModal(){ const m=document.getElementById('saveDraftModal'); if(m) m.style.display='none'; }
function confirmSaveDraft(){
  const sel=document.getElementById('saveDraftWardSelect');
  if(!sel) return;
  let ward;
  if(sel.value==='__new__'){
    const name=(document.getElementById('saveDraftNewWardName')?.value||'').trim();
    if(!name){ alert('Please enter a ward name'); return; }
    ward={ id:uuid(), name, beds:[] };
    data.wards.push(ward);
  } else {
    ward=data.wards.find(w=>w.id===sel.value);
    if(!ward){ alert('Ward not found'); return; }
  }
  const d=notifyEditor.getData();
  const headerSel=document.getElementById('headerStatusSelect');
  const status=(headerSel && headerSel.value==='discharge') ? 'discharge' : 'active';
  const compat={ dx:d.hashtags, note:d.cli };
  const bed={ id:uuid(), name:(d.bed||'').trim()||'New Bed', status, details:JSON.stringify({ ...compat, ...d }) };
  const hn=(d.hn||'').trim(); if(hn) bed.hn=hn;
  ward.beds.push(bed);
  saveData();
  clearDraft();
  draftMode=false;
  selectedWardId=ward.id;
  renderWards(); renderBeds();
  closeSaveDraftModal();
  // Continue editing the now-saved bed (further edits autosave to it)
  openProfilePage(bed);
}

function openProfilePage(bed, opts={}){
  draftMode=false;
  selectedBedId=bed.id;
  setProfileChrome(false);
  // Load existing bed.details (JSON) into editor
  let d={};
  try{ d=JSON.parse(bed.details||'{}'); }catch{}
  const ward=data.wards.find(w=>w.id===selectedWardId);
  bedContainer.style.display='none';
  profilePage.style.display='flex';
  notifyEditor.bootstrap({
    bed: bed.name||'',
    hn: bed.hn || d.hn || '',
    hashtags: d.dx || d.hashtags || '',
    cli: d.cli || d.note || '',
    mx: d.mx || '',
    bt: d.bt || '', pr: d.pr || '', rr: d.rr || '', bp: d.bp || '', o2: d.o2 || '',
    io: d.io || [{in:[],out:[]},{in:[],out:[]}],
    wardName: ward?.name || ''
  });
  // header status select (always visible)
  const headerSel=document.getElementById('headerStatusSelect');
  const applyHeaderStatus=(val)=>{
    if(!headerSel) return;
    headerSel.classList.toggle('status-discharge', val==='discharge');
    headerSel.classList.toggle('status-active', val!=='discharge');
  };
  if(headerSel){
    headerSel.value = (bed.status==='discharge')? 'discharge':'active';
    applyHeaderStatus(headerSel.value);
    headerSel.onchange=()=>{
      const w=data.wards.find(w=>w.id===selectedWardId); if(!w) return;
      const sb=w.beds.find(x=>x.id===selectedBedId); if(!sb) return;
      sb.status = headerSel.value;
      applyHeaderStatus(sb.status);
      const stSel=document.getElementById('statusSelect'); if(stSel) stSel.value=sb.status;
      saveData(); renderWards(); renderBeds();
    };
  }
  // init status select
  const stSel=document.getElementById('statusSelect');
  if(stSel){
    stSel.value = (bed.status==='discharge')? 'discharge':'active';
    stSel.onchange=()=>{
      const w=data.wards.find(w=>w.id===selectedWardId); if(!w) return;
      const sb=w.beds.find(x=>x.id===selectedBedId); if(!sb) return;
      sb.status = stSel.value;
      // sync header select
      const headerSel=document.getElementById('headerStatusSelect');
      if(headerSel){ headerSel.value=sb.status; headerSel.classList.toggle('status-discharge', sb.status==='discharge'); headerSel.classList.toggle('status-active', sb.status!=='discharge'); }
      saveData(); renderWards(); renderBeds();
    };
  }
  // autosave while editing
  notifyEditor.onChange(()=>{
    const ward=data.wards.find(w=>w.id===selectedWardId);
    if(!ward) return;
    const selBed=ward.beds.find(x=>x.id===selectedBedId);
    if(!selBed) return;
    const cur=notifyEditor.getData();
    selBed.name=cur.bed || selBed.name;
    selBed.details=JSON.stringify({ ...cur, note: cur.cli });
    // persist HN as top-level field for easy access/list rendering
    const hn=(cur.hn||'').trim();
    if(hn) selBed.hn=hn; else delete selBed.hn;
    saveData();
    renderWards();
    renderBeds();
  });
  // Focus and select bed field if requested
  if(opts?.focusBed || opts?.selectBed){
    setTimeout(()=>{
      const bedInput=document.getElementById('bed');
      if(bedInput){ bedInput.focus(); if(opts.selectBed) bedInput.select(); }
    }, 50);
  }
}

function backToBeds(){
  // Leaving the page exits draft mode but keeps the draft saved so it can be resumed.
  draftMode=false;
  profilePage.style.display='none';
  bedContainer.style.display='block';
  wardWorkPage.style.display='none';
  notesPage.style.display='none';
  renderBeds();
}

backToBedsBtn.onclick=backToBeds;

// Quick I/O entry points (sidebar button + empty-state CTA)
document.getElementById('quickIOBtn')?.addEventListener('click', openDraftNote);
// Save Draft modal wiring
document.getElementById('saveDraftCancelBtn')?.addEventListener('click', closeSaveDraftModal);
document.getElementById('saveDraftConfirmBtn')?.addEventListener('click', confirmSaveDraft);
document.getElementById('saveDraftModal')?.addEventListener('click', (e)=>{ if(e.target.id==='saveDraftModal') closeSaveDraftModal(); });

saveBtn.onclick=()=>{
  if(draftMode){ openSaveDraftModal(); return; }
  const ward=data.wards.find(w=>w.id===selectedWardId);
  if(!ward) return;
  const bed=ward.beds.find(x=>x.id===selectedBedId);
  if(!bed) return;
  const d=notifyEditor.getData();
  // Keep compatibility fields
  bed.name=d.bed || bed.name;
  const compat={ dx: d.hashtags, note: d.cli };
  bed.details=JSON.stringify({ ...compat, ...d });
  const hn=(d.hn||'').trim(); if(hn) bed.hn=hn; else delete bed.hn;
  saveData(); renderWards(); renderBeds(); backToBeds();
};


// removed legacy modal/profile handlers

})();
