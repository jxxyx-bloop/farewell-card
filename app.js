// ─── Constants ───
const REFRESH_INTERVAL = 60000; // auto-refresh every 60 seconds

const STICKY_COLORS = [
  {bg:"#FFF9C4",border:"#F9E547",shadow:"rgba(249,229,71,0.3)"},
  {bg:"#F8BBD0",border:"#EC407A",shadow:"rgba(236,64,122,0.3)"},
  {bg:"#C8E6C9",border:"#66BB6A",shadow:"rgba(102,187,106,0.3)"},
  {bg:"#BBDEFB",border:"#42A5F5",shadow:"rgba(66,165,245,0.3)"},
  {bg:"#FFE0D3",border:"#EE4D2D",shadow:"rgba(238,77,45,0.25)"},
  {bg:"#E1BEE7",border:"#AB47BC",shadow:"rgba(171,71,188,0.3)"},
  {bg:"#FFF3E0",border:"#FF7337",shadow:"rgba(255,115,55,0.25)"},
  {bg:"#FFCCBC",border:"#FF7043",shadow:"rgba(255,112,67,0.3)"},
];
const EMOJIS = ["❤️","🎉","🥳","👏","🌟","💐","🫶","😢","🍀","🎊","✨","🙏","💪","🤗","🎈","🥂","💛","🦋","🌈","🫡","🤣","😭","👀","🙋‍♀️"];
const FONTS = ["'Nunito',sans-serif","'Quicksand',sans-serif","'Nunito',sans-serif","'Quicksand',sans-serif"];
const BEACH_EMOJIS = ['🌊','🐚','🌴','🦀','⭐','🐠','🌺','☀️','🐬','🏄'];
let notes = [];
let isSaving = false;

// Track which note IDs belong to this browser session (persists across refreshes)
let myNoteIds = new Set(JSON.parse(localStorage.getItem('myNoteIds') || '[]'));
let myReplyIds = new Set(JSON.parse(localStorage.getItem('myReplyIds') || '[]'));
let editingNoteId = null;
let replyingToNoteId = null;

// ─── Card configuration (from config.js) ───
// Single source of truth for the recipient's name and copy. Falls back to
// safe generic defaults if config.js is missing or a field is unset.
const CARD = Object.assign(
  { recipientName: "Friend", subtitle: "A board full of love from your team", composePrompt: "Leave a note for" },
  (typeof window !== 'undefined' && window.CARD_CONFIG) || {}
);

/** Apply CARD_CONFIG to the page title, heading, subtitle, and compose prompt. */
function applyCardConfig() {
  const name = CARD.recipientName;
  document.title = `Farewell, ${name}!`;
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  set('cardTitle', `Farewell, ${name}!`);
  set('cardSubtitle', CARD.subtitle);
  // Append the name automatically — unless the prompt already includes it,
  // so "Leave a note for" and "Leave a note for Sam" both render correctly.
  const prompt = CARD.composePrompt.includes(name)
    ? CARD.composePrompt
    : `${CARD.composePrompt} ${name}`;
  set('composeHeading', `✍️ ${prompt}`);
}

// ─── Sanitization Helpers ───

/** Escape HTML special characters to prevent XSS */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ─── JSONBin Storage (proxied via Cloudflare Worker at /api/notes) ───
// Credentials never leave the server — the Worker holds them as secrets.
// When opened as a local file (file:// protocol) fall back to mock data.
function isConfigured() {
  return location.protocol !== 'file:';
}

async function loadNotes() {
  if (!isConfigured()) {
    hideLoader();
    notes = [{id:1,author:"The Team",message:`We'll miss you so much, ${CARD.recipientName}! \u{1F49B}\nYou made every day brighter.`,colorIdx:0,fontIdx:0,rotation:-2}];
    renderNotes();
    return;
  }
  setSyncStatus('saving');
  try {
    const res = await fetch('/api/notes');
    if (!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    notes = data.record.notes || [];
    renderNotes();
    setSyncStatus('synced');
  } catch(e) {
    console.error('Load error:',e);
    setSyncStatus('error');
  }
  hideLoader();
}

// Generic sync helper: fetches latest, applies transform, PUTs result back.
// transform receives the server notes array and must return the new notes array.
async function syncNotes(transform) {
  if (!isConfigured() || isSaving) return;
  isSaving = true; setSyncStatus('saving');
  try {
    const getRes = await fetch('/api/notes');
    if (!getRes.ok) throw new Error('HTTP '+getRes.status);
    const data = await getRes.json();
    const updated = transform(data.record.notes || []);
    const putRes = await fetch('/api/notes',{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({notes:updated})
    });
    if (!putRes.ok) throw new Error('HTTP '+putRes.status);
    notes = updated;
    renderNotes();
    setSyncStatus('synced');
  } catch(e) {
    console.error('Sync error:',e);
    setSyncStatus('error');
  }
  isSaving = false;
}

async function saveNotes(newNote) {
  await syncNotes(serverNotes => {
    const idSet = new Set(serverNotes.map(n => n.id));
    if (newNote && !idSet.has(newNote.id)) serverNotes.push(newNote);
    return serverNotes;
  });
}

// ─── Reactions ───

async function addReaction(noteId, emoji) {
  if (isSaving) { showToast('Hold on — reacting in a moment!'); return; }
  // Optimistic local update
  const note = notes.find(n => n.id === noteId);
  if (!note) return;
  if (!note.reactions) note.reactions = {};
  note.reactions[emoji] = (note.reactions[emoji] || 0) + 1;
  renderNotes();
  await syncNotes(serverNotes => serverNotes.map(n => {
    if (n.id !== noteId) return n;
    const reactions = { ...(n.reactions || {}) };
    reactions[emoji] = (reactions[emoji] || 0) + 1;
    return { ...n, reactions };
  }));
}

function toggleReactionPicker(noteId) {
  // Close any other open pickers first
  document.querySelectorAll('.reaction-picker-popover:not(.hidden)').forEach(el => {
    if (el.id !== 'rpicker-'+noteId) el.classList.add('hidden');
  });
  const picker = document.getElementById('rpicker-'+noteId);
  if (picker) picker.classList.toggle('hidden');
}

// Close reaction pickers when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.reactions-row')) {
    document.querySelectorAll('.reaction-picker-popover:not(.hidden)').forEach(el => el.classList.add('hidden'));
  }
});

// ─── Replies ───

function openReplyModal(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;
  replyingToNoteId = noteId;
  document.getElementById('replyNoteAuthor').textContent = note.author;
  document.getElementById('replyAuthorInput').value = '';
  document.getElementById('replyTextInput').value = '';
  document.getElementById('saveReplyBtn').disabled = true;
  renderReplyList(note);
  document.getElementById('replyOverlay').classList.remove('hidden');
}

function closeReplyModal() {
  replyingToNoteId = null;
  document.getElementById('replyOverlay').classList.add('hidden');
}

function validateReplyForm() {
  const a = document.getElementById('replyAuthorInput').value.trim();
  const t = document.getElementById('replyTextInput').value.trim();
  document.getElementById('saveReplyBtn').disabled = !a || !t;
}

function renderReplyList(note) {
  const list = document.getElementById('replyList');
  const replies = note.replies || [];
  if (replies.length === 0) {
    list.innerHTML = '<div class="no-replies">No replies yet — be the first! 💬</div>';
    return;
  }
  list.innerHTML = replies.map(r => {
    const safeAuthor = escapeHtml(r.author);
    const safeText = escapeHtml(r.text);
    const safeRid = Number(r.id);
    const delBtn = myReplyIds.has(r.id)
      ? '<button class="delete-reply-btn note-action-btn delete-btn" onclick="deleteReply('+Number(note.id)+','+safeRid+')" title="Delete your reply">🗑️</button>'
      : '';
    return '<div class="reply-item"><div class="reply-author">'+safeAuthor+'</div><div class="reply-text">'+safeText+'</div>'+delBtn+'</div>';
  }).join('');
}

async function submitReply() {
  const author = document.getElementById('replyAuthorInput').value.trim();
  const text = document.getElementById('replyTextInput').value.trim();
  if (!author || !text || !replyingToNoteId) return;
  const noteId = replyingToNoteId;
  const newReply = { id: Date.now(), author, text };
  myReplyIds.add(newReply.id);
  localStorage.setItem('myReplyIds', JSON.stringify([...myReplyIds]));
  // Optimistic local update
  const note = notes.find(n => n.id === noteId);
  if (note) {
    if (!note.replies) note.replies = [];
    note.replies.push(newReply);
    renderReplyList(note);
  }
  document.getElementById('replyAuthorInput').value = '';
  document.getElementById('replyTextInput').value = '';
  document.getElementById('saveReplyBtn').disabled = true;
  renderNotes();
  await syncNotes(serverNotes => serverNotes.map(n => {
    if (n.id !== noteId) return n;
    const replies = [...(n.replies || [])];
    if (!replies.find(r => r.id === newReply.id)) replies.push(newReply);
    return { ...n, replies };
  }));
}

async function deleteReply(noteId, replyId) {
  if (!confirm('Delete your reply? This cannot be undone.')) return;
  myReplyIds.delete(replyId);
  localStorage.setItem('myReplyIds', JSON.stringify([...myReplyIds]));
  // Optimistic local update
  const note = notes.find(n => n.id === noteId);
  if (note && note.replies) {
    note.replies = note.replies.filter(r => r.id !== replyId);
    if (replyingToNoteId === noteId) renderReplyList(note);
  }
  renderNotes();
  await syncNotes(serverNotes => serverNotes.map(n => {
    if (n.id !== noteId) return n;
    return { ...n, replies: (n.replies || []).filter(r => r.id !== replyId) };
  }));
}

async function deleteNote(id) {
  if (isSaving) { alert('Still saving — please try again in a moment.'); return; }
  if (!confirm('Delete your note? This cannot be undone.')) return;
  // Optimistic local removal
  notes = notes.filter(n => n.id !== id);
  myNoteIds.delete(id);
  localStorage.setItem('myNoteIds', JSON.stringify([...myNoteIds]));
  renderNotes();
  await syncNotes(serverNotes => serverNotes.filter(n => n.id !== id));
}

function openEdit(id) {
  if (isSaving) { alert('Still saving — please try again in a moment.'); return; }
  const note = notes.find(n => n.id === id);
  if (!note) return;
  editingNoteId = id;
  document.getElementById('editInput').value = note.message;
  document.getElementById('saveEditBtn').disabled = false;
  document.getElementById('editOverlay').classList.remove('hidden');
}

function closeEdit() {
  editingNoteId = null;
  document.getElementById('editOverlay').classList.add('hidden');
}

function validateEditForm() {
  document.getElementById('saveEditBtn').disabled =
    !document.getElementById('editInput').value.trim();
}

async function saveEdit() {
  const newMsg = document.getElementById('editInput').value.trim();
  if (!newMsg || !editingNoteId) return;
  const id = editingNoteId;
  // Optimistic local update
  const note = notes.find(n => n.id === id);
  if (note) note.message = newMsg;
  renderNotes();
  closeEdit();
  await syncNotes(serverNotes =>
    serverNotes.map(n => n.id === id ? {...n, message: newMsg} : n)
  );
}

async function refreshNotes() {
  if (!isConfigured()||isSaving) return;
  try {
    const res = await fetch('/api/notes');
    if (!res.ok) return;
    const data = await res.json();
    const fresh = data.record.notes||[];
    // Use ID-based comparison instead of just length — catches edits, reactions, and reply changes too
    const currentIds = new Set(notes.map(n => n.id));
    const freshIds = new Set(fresh.map(n => n.id));
    const hasChanges = fresh.length !== notes.length
      || fresh.some(n => !currentIds.has(n.id))
      || notes.some(n => !freshIds.has(n.id))
      || fresh.some(n => {
          const l = notes.find(x => x.id === n.id);
          return l && (
            l.message !== n.message ||
            JSON.stringify(l.reactions||{}) !== JSON.stringify(n.reactions||{}) ||
            (l.replies||[]).length !== (n.replies||[]).length
          );
        });
    if (hasChanges) { notes = fresh; renderNotes(); }
  } catch(e) {}
}

function setSyncStatus(s) {
  const dot = document.getElementById('syncDot'), txt = document.getElementById('syncText');
  dot.className = 'sync-dot';
  if (s==='synced'){ txt.textContent='Synced'; }
  else if (s==='saving'){ txt.textContent='Saving...'; dot.classList.add('saving'); }
  else { txt.textContent='Offline'; dot.classList.add('error'); }
}

function hideLoader() {
  const el = document.getElementById('loadingOverlay');
  el.classList.add('fade-out');
  setTimeout(()=>el.style.display='none',500);
}

// ─── Theme ───
function setTheme(theme) {
  const isBeach = theme === 'beach';
  document.body.classList.toggle('beach-theme', isBeach);
  localStorage.setItem('cw-theme', theme);

  // Toggle icon highlight
  document.getElementById('themeOrange').className =
    'theme-icon ' + (isBeach ? 'inactive' : 'active-orange');
  document.getElementById('themeBeach').className =
    'theme-icon ' + (isBeach ? 'active-beach' : 'inactive');

  // Swap mascot images. Reset display first so a mascot hidden by onerror in one
  // theme can reappear in the other if that theme's art exists (e.g. the bundled
  // beach SVGs still show even when an original-theme PNG hasn't been added yet).
  document.querySelectorAll('[data-beach-src]').forEach(img => {
    img.style.display = '';
    img.src = isBeach ? img.dataset.beachSrc : img.dataset.originalSrc;
  });

  // Re-render notes so they switch between sticky and postcard
  renderNotes();
}

function initTheme() {
  const saved = localStorage.getItem('cw-theme') || 'original';
  setTheme(saved);
  document.getElementById('themeOrange').addEventListener('click', () => setTheme('original'));
  document.getElementById('themeBeach').addEventListener('click',  () => setTheme('beach'));
}

// ─── Init ───
document.addEventListener('DOMContentLoaded',()=>{
  if (!isConfigured()) {
    console.warn(
      'Running without the backend (file:// or no Worker) — showing mock data. '
      + 'To sync notes for everyone, run via Cloudflare/Wrangler. See README.md.'
    );
  }
  applyCardConfig();
  buildEmojiPicker(); setupFormValidation(); initTheme();
  loadNotes();
  setInterval(refreshNotes,REFRESH_INTERVAL);
});

// ─── View ───

// ─── Emoji ───
function buildEmojiPicker(){
  const p=document.getElementById('emojiPicker');
  EMOJIS.forEach(em=>{
    const b=document.createElement('button');b.className='emoji-btn';b.textContent=em;
    b.onclick=()=>{document.getElementById('messageInput').value+=em;toggleEmoji();validateForm();};
    p.appendChild(b);
  });
}
function toggleEmoji(){
  document.getElementById('emojiPicker').classList.toggle('hidden');
  document.getElementById('emojiToggle').classList.toggle('emoji-active');
}


// ─── Form ───
function setupFormValidation(){
  document.getElementById('authorInput').addEventListener('input',validateForm);
  document.getElementById('messageInput').addEventListener('input',validateForm);
document.getElementById('messageInput').addEventListener('keydown',function(e){
  if((e.metaKey||e.ctrlKey)&&e.key==='Enter'&&!document.getElementById('pinBtn').disabled){
    e.preventDefault();pinNote();
  }
});
}
function validateForm(){
  const a=document.getElementById('authorInput').value.trim();
  const m=document.getElementById('messageInput').value.trim();
  document.getElementById('pinBtn').disabled=!a||!m;
}

async function pinNote(){
  const ae=document.getElementById('authorInput'),me=document.getElementById('messageInput');
  const a=ae.value.trim(),m=me.value.trim();
  if(!a||!m) return;
  const newNote = {id:Date.now(),author:a,message:m,
    colorIdx:Math.floor(Math.random()*STICKY_COLORS.length),
    fontIdx:Math.floor(Math.random()*FONTS.length),
    rotation:(Math.random()-0.5)*6};
  // Remember this note belongs to us so we can edit/delete it later
  myNoteIds.add(newNote.id);
  localStorage.setItem('myNoteIds', JSON.stringify([...myNoteIds]));
  // Optimistically add to local view
  notes.push(newNote);
  ae.value='';me.value='';
  validateForm();renderNotes();fireConfetti();showMascotCelebration();
  // Milestone toast
  if(notes.length>0&&notes.length%10===0) showToast('🎉 '+notes.length+' notes of love!');
  // Scroll to & glow the newly pinned note (last wrapper in boardView)
  setTimeout(()=>{
    const wrappers=document.querySelectorAll('#boardView .note-wrapper');
    if(wrappers.length){
      const last=wrappers[wrappers.length-1];
      last.scrollIntoView({behavior:'smooth',block:'center'});
      last.querySelector('.sticky-note').classList.add('note-highlight');
    }
  },80);
  // Save with merge to avoid overwriting others
  await saveNotes(newNote);
}

// ─── Render ───
function pinSVG(color){
  return '<svg class="pin" width="20" height="20" viewBox="0 0 20 20">'
    +'<circle cx="10" cy="10" r="7" fill="'+escapeHtml(color)+'"/>'
    +'<circle cx="8" cy="8" r="2.5" fill="rgba(255,255,255,0.4)"/></svg>';
}

// Reactions + replies row, shared by both card themes so the comment and emoji
// reaction features stay at parity across the sticky-note and beach postcard views.
function reactionsRowHTML(n){
  const safeId = Number(n.id);
  const reactions = n.reactions || {};
  const chips = Object.entries(reactions)
    .filter(function(e){ return e[1] > 0; })
    .map(function(e){
      var emoji = e[0], count = e[1];
      return '<button class="reaction-chip" onclick="addReaction('+safeId+',\''+escapeHtml(emoji)+'\')" title="React with '+escapeHtml(emoji)+'">'
        +'<span>'+emoji+'</span><span class="count">'+Number(count)+'</span></button>';
    }).join('');
  const pickerBtns = EMOJIS.map(function(em){
    return '<button class="emoji-btn" onclick="addReaction('+safeId+',\''+escapeHtml(em)+'\');toggleReactionPicker('+safeId+')">'+em+'</button>';
  }).join('');
  const replyCount = (n.replies || []).length;
  return '<div class="reactions-row">'
    +chips
    +'<button class="react-add-btn" onclick="toggleReactionPicker('+safeId+')" title="Add reaction">+</button>'
    +'<div class="reaction-picker-popover hidden" id="rpicker-'+safeId+'">'+pickerBtns+'</div>'
    +'<button class="reply-btn" onclick="openReplyModal('+safeId+')">💬'+(replyCount > 0 ? ' '+replyCount : '')+'</button>'
    +'</div>';
}

function stickyHTML(n,d,noteW){
  const c=STICKY_COLORS[n.colorIdx%STICKY_COLORS.length],f=FONTS[n.fontIdx%FONTS.length],r=n.rotation||0;
  const safeMsg = escapeHtml(n.message);
  const safeAuthor = escapeHtml(n.author);
  // Sanitize rotation and id to numbers to prevent style/attribute injection
  const safeRotation = Number(r) || 0;
  const safeId = Number(n.id);
  const safeW = Number(noteW) > 0 ? Number(noteW) : 0;
  const widthStyle = safeW ? 'width:'+safeW+'px;' : '';
  // Show edit/delete controls only for notes pinned in this browser session
  const actions = myNoteIds.has(n.id)
    ? '<div class="note-actions">'
      +'<button class="note-action-btn edit-btn" onclick="openEdit('+safeId+')" title="Edit your note">✏️</button>'
      +'<button class="note-action-btn delete-btn" onclick="deleteNote('+safeId+')" title="Delete your note">🗑️</button>'
      +'</div>'
    : '';
  const reactionsRow = reactionsRowHTML(n);

  const initials = escapeHtml(safeAuthor.trim().split(/\s+/).map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase());
  return '<div class="sticky-note" style="'+widthStyle+'background:'+c.bg+';border-bottom:3px solid '+c.border+';box-shadow:3px 4px 12px '+c.shadow+',0 1px 3px rgba(0,0,0,0.08);transform:rotate('+safeRotation+'deg);animation:float-in 0.5s '+d+'s ease-out both;">'
    +pinSVG(c.border)
    +'<div class="message" style="font-family:'+f+'">'+safeMsg+'</div>'
    +'<div class="author"><span class="author-badge" style="background:'+c.border+'">'+initials+'</span>— '+safeAuthor+'</div>'
    +actions
    +reactionsRow
    +'</div>';
}

function postcardHTML(n, d, noteW) {
  const safeMsg    = escapeHtml(n.message);
  const safeAuthor = escapeHtml(n.author);
  const safeId     = Number(n.id);
  const safeW      = Number(noteW) > 0 ? Number(noteW) : 0;
  const safeRot    = Number(n.rotation) || 0;
  const widthStyle = safeW ? `width:${safeW}px;` : '';
  const emoji      = BEACH_EMOJIS[Math.floor(Math.random() * BEACH_EMOJIS.length)];

  const GRADIENTS = [
    ['#006D77','#00ACC1'], ['#26C6DA','#4DD0E1'],
    ['#00838F','#006D77'], ['#4DD0E1','#80DEEA'],
    ['#006D77','#26C6DA'], ['#80DEEA','#B2EBF2'],
  ];
  const grad = GRADIENTS[safeId % GRADIENTS.length];
  const headerBg = `linear-gradient(135deg,${grad[0]},${grad[1]})`;

  const initials = safeAuthor.trim().split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();

  const actions = myNoteIds.has(n.id)
    ? `<div class="note-actions">
        <button class="note-action-btn edit-btn"   onclick="openEdit(${safeId})"   title="Edit your note">✏️</button>
        <button class="note-action-btn delete-btn" onclick="deleteNote(${safeId})" title="Delete your note">🗑️</button>
       </div>`
    : '';

  return `<div class="postcard" style="${widthStyle}transform:rotate(${safeRot}deg);animation:float-in 0.5s ${d}s ease-out both;">
    <div class="pc-header" style="background:${headerBg};">
      <span class="pc-emoji">${emoji}</span>
    </div>
    <div class="pc-body">
      <div class="pc-msg">${safeMsg}</div>
      <hr class="pc-divider">
      <div class="pc-author">
        <span class="author-badge" style="background:${grad[0]}">${escapeHtml(initials)}</span>— ${safeAuthor}
      </div>
      ${actions}
      ${reactionsRowHTML(n)}
    </div>
  </div>`;
}

function getPositions(heights,noteW,cols){
  const gap=20,vgap=20;
  const colH=Array(cols).fill(0);
  return heights.map((h,i)=>{
    // Tetris: always place into the shortest column
    const col=colH.indexOf(Math.min(...colH));
    const x=col*(noteW+gap);
    const y=colH[col];
    colH[col]+=h+vgap;
    return{left:x,top:y,zIndex:i+1};
  });
}

// ─── Render Helper ───
function noteHTML(n, d, noteW) {
  return document.body.classList.contains('beach-theme')
    ? postcardHTML(n, d, noteW)
    : stickyHTML(n, d, noteW);
}

// Re-render when the board resizes (window resize / panel reflow)
let _boardResizeObserver=null;

function renderNotes(){
  document.getElementById('noteCount').textContent=notes.length+' note'+(notes.length!==1?'s':'')+' pinned';
  const be=document.getElementById('boardView');

  if(notes.length===0){
    be.innerHTML='';
    return;
  }

  // Derive layout params from actual board width
  const boardW=be.offsetWidth||700;
  const hgap=20,minNoteW=240,maxNoteW=340;
  const cols=Math.max(2,Math.min(6,Math.floor((boardW+hgap)/(minNoteW+hgap))));
  const noteW=Math.min(maxNoteW,Math.floor((boardW-(cols-1)*hgap)/cols));

  // Pass 1: render off-screen with correct noteW to measure real heights
  const probe=document.createElement('div');
  probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;top:0;left:0;';
  be.appendChild(probe);
  const wrappers=notes.map(n=>{const w=document.createElement('div');w.innerHTML=noteHTML(n,0,noteW);probe.appendChild(w);return w;});
  const heights=wrappers.map(w=>w.firstElementChild.offsetHeight);
  be.removeChild(probe);

  // Pass 2: real render with actual heights + dynamic noteW
  const pos=getPositions(heights,noteW,cols);
  const mt=Math.max(...pos.map((p,i)=>p.top+heights[i]))+40;
  be.style.minHeight=Math.max(600,mt)+'px';
  be.innerHTML=notes.map((n,i)=>{
    const p=pos[i];
    return '<div class="note-wrapper" style="left:'+p.left+'px;top:'+p.top+'px;z-index:'+p.zIndex+'">'+noteHTML(n,i*0.08,noteW)+'</div>';
  }).join('');

  // Attach ResizeObserver once so layout reflows when window/panel resizes
  if(!_boardResizeObserver){
    _boardResizeObserver=new ResizeObserver(()=>renderNotes());
    _boardResizeObserver.observe(be);
  }
}



function showToast(msg){
  const t=document.createElement('div');
  t.className='toast';t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3200);
}

// ─── Admin ───
// Run this in the browser console to wipe the entire board (you only, as creator).
// Example: resetBoard()
window.resetBoard = async function() {
  if (!confirm('ADMIN: Permanently delete ALL notes from the board?')) return;
  if (!confirm('Are you absolutely sure? There is no undo.')) return;
  if (!isConfigured()) { console.error('JSONBin not configured.'); return; }
  await syncNotes(() => []);
  myNoteIds = new Set();
  localStorage.removeItem('myNoteIds');
  console.log('%c Board cleared successfully. ', 'background:#43A047;color:white;font-size:14px;padding:4px 8px;border-radius:4px;');
};

// ─── Confetti ───
function fireConfetti(){
  const c=document.getElementById('confetti');c.classList.remove('hidden');
  const cols=["#EE4D2D","#FF7337","#FB8C00","#43A047","#1E88E5","#8E24AA","#F06292","#FFD600"];
  let h='';
  for(let i=0;i<60;i++){const x=Math.random()*100,cl=cols[i%8],dl=Math.random()*0.5,du=1.5+Math.random()*1.5,sz=6+Math.random()*8,dr=(Math.random()-0.5)*80,ci=Math.random()>0.5;
    h+='<div class="confetti-piece" style="left:'+x+'%;width:'+sz+'px;height:'+(ci?sz:sz*1.5)+'px;border-radius:'+(ci?'50%':'2px')+';background:'+cl+';margin-left:'+dr+'px;animation:confetti-fall '+du+'s '+dl+'s ease-in forwards;"></div>';}
  c.innerHTML=h;
  setTimeout(()=>{c.classList.add('hidden');c.innerHTML='';},3500);
}

// ─── Mascot Celebration ───
function showMascotCelebration(){
  const el=document.getElementById('mascotCelebrate');
  if(!el) return;
  el.classList.remove('hidden','fade-out');
  clearTimeout(el._timer);
  el._timer=setTimeout(()=>{
    el.classList.add('fade-out');
    setTimeout(()=>el.classList.add('hidden'),500);
  },2000);
}
