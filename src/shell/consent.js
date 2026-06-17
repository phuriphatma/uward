// First-use Terms of Use & Credits gate.
// Shown once per device (stored in localStorage); must be accepted before use.
// Imported by both shell.js (tool pages) and hub.js (home), so it appears
// everywhere a user might first land. Re-openable via openTerms() (hub footer /
// tool switcher) for reference.
import './consent.css';

const KEY = 'uward-terms-accepted-v2'; // bump the version to re-prompt if terms change
const REPO_ISSUES = 'https://github.com/phuriphatma/uward/issues';

const TERMS_HTML = `
  <div class="uc-credit">
    เว็บไซต์นี้จัดทำโดย <strong>นศพ. ภูริพัฒณ์ มหาพรหมรักษ์</strong> (Ung MDKKU50)
  </div>

  <h3>1. วัตถุประสงค์</h3>
  <p>เครื่องมือในเว็บไซต์นี้เป็นเพียง<strong>เครื่องมือช่วยคำนวณและอ้างอิงเพื่อการศึกษาและอำนวยความสะดวก</strong>แก่บุคลากรทางการแพทย์เท่านั้น <strong>มิใช่คำแนะนำทางการแพทย์ มิใช่อุปกรณ์การแพทย์</strong> และไม่อาจใช้แทนการวินิจฉัย การรักษา หรือดุลยพินิจของผู้ประกอบวิชาชีพได้</p>

  <h3>2. ความรับผิดชอบของผู้ใช้</h3>
  <p>ผู้ใช้งานต้อง<strong>ตรวจสอบความถูกต้อง ความเหมาะสม ความเป็นปัจจุบัน และบริบทของผู้ป่วยก่อนนำผลลัพธ์ใด ๆ ไปใช้จริงเสมอ</strong> การตัดสินใจทางคลินิกขั้นสุดท้ายถือเป็นความรับผิดชอบของผู้ใช้และผู้ประกอบวิชาชีพแต่เพียงผู้เดียว</p>

  <h3>3. ข้อจำกัดความรับผิด</h3>
  <p>เว็บไซต์นี้ให้บริการ <strong>“ตามสภาพที่เป็นอยู่” (as-is)</strong> โดยไม่มีการรับประกันใด ๆ ทั้งสิ้น ข้อมูล สูตร และผลการคำนวณ<strong>อาจมีข้อผิดพลาด อาจไม่เป็นปัจจุบัน</strong> และผู้จัดทำ<strong>อาจไม่มีเวลาในการแก้ไขหรือปรับปรุง</strong></p>
  <p>ผู้จัดทำ<strong>ไม่รับผิดชอบต่อความเสียหาย อันตราย การบาดเจ็บ การสูญเสีย หรือผลกระทบใด ๆ ทั้งทางตรงและทางอ้อม</strong> ที่เกิดขึ้นจากการใช้หรือการไม่สามารถใช้บริการนี้ โดยเฉพาะอย่างยิ่งการใช้โดยปราศจากการตรวจสอบหรือการใช้ดุลยพินิจทางวิชาชีพอย่างเหมาะสม</p>

  <h3>4. ข้อมูลและความเป็นส่วนตัว</h3>
  <p>ข้อมูลที่ท่านกรอกจะถูกจัดเก็บไว้ใน<strong>อุปกรณ์/เบราว์เซอร์ของท่าน</strong> (local storage) เท่านั้น ผู้จัดทำไม่ได้เก็บรวบรวมหรือเข้าถึงข้อมูลดังกล่าว ทั้งนี้บางฟังก์ชัน (เช่น การนำเข้าจาก Google Sheet หรือการเรียกข้อมูลอ้างอิงจากบริการภายนอก) อาจมีการรับส่งข้อมูลกับบุคคลที่สาม ผู้ใช้มีหน้าที่จัดการข้อมูลผู้ป่วยให้เป็นไปตาม<strong>กฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA)</strong> และระเบียบของสถานพยาบาล</p>
  <div class="uc-warn">
    ⚠️ <strong>ข้อมูลถูกเก็บไว้ในเครื่องนี้เท่านั้น</strong> — การ<strong>ล้างแคช ประวัติการเข้าชม หรือข้อมูลเว็บไซต์ (clear cache/history/site data)</strong> การใช้โหมดไม่ระบุตัวตน หรือการลบ/ถอนการติดตั้งแอป จะทำให้ข้อมูลที่บันทึกไว้ (ward, ผู้ป่วย, โน้ต ฯลฯ) <strong>หายอย่างถาวรและกู้คืนไม่ได้</strong> โปรด<strong>สำรองข้อมูล (ปุ่ม Back up ใน Ward Manager) อย่างสม่ำเสมอ</strong></div>

  <h3>5. การแจ้งปัญหา</h3>
  <p>หากพบข้อผิดพลาดหรือปัญหาในการใช้งาน โปรดแจ้งได้ที่ <a href="${REPO_ISSUES}" target="_blank" rel="noopener">GitHub repository</a></p>

  <p style="margin-top:12px;color:var(--u-muted,#64748b);font-size:13px;">การกดปุ่ม “ยอมรับและเข้าใช้งาน” และการใช้งานเว็บไซต์นี้ต่อไป ถือว่าท่านได้อ่าน เข้าใจ และตกลงยอมรับข้อกำหนดและข้อจำกัดความรับผิดข้างต้นทั้งหมดแล้ว</p>
`;

let scrollLocked = false;
function lockScroll() { if (!scrollLocked) { document.documentElement.style.overflow = 'hidden'; scrollLocked = true; } }
function unlockScroll() { if (scrollLocked) { document.documentElement.style.overflow = ''; scrollLocked = false; } }

function close(backdrop) { backdrop.remove(); unlockScroll(); }

function build(gated) {
  const backdrop = document.createElement('div');
  backdrop.id = 'uconsent-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', 'ข้อกำหนดการใช้งาน');
  backdrop.innerHTML = `
    <div id="uconsent-card">
      <div class="uc-head">
        <h2>ข้อกำหนดการใช้งาน &amp; เครดิต</h2>
        <p class="uc-sub">uWard — เครื่องมือสำหรับบุคลากรทางการแพทย์</p>
      </div>
      <div class="uc-body">${TERMS_HTML}</div>
      <div class="uc-foot"></div>
    </div>`;
  const foot = backdrop.querySelector('.uc-foot');
  if (gated) {
    foot.innerHTML = `
      <label class="uc-check">
        <input type="checkbox" id="uconsent-agree">
        <span>ข้าพเจ้าได้อ่าน เข้าใจ และยอมรับข้อกำหนดการใช้งานและข้อจำกัดความรับผิดข้างต้น</span>
      </label>
      <div class="uc-actions">
        <button class="uc-accept" id="uconsent-accept" disabled>ยอมรับและเข้าใช้งาน</button>
      </div>`;
    const cb = foot.querySelector('#uconsent-agree');
    const btn = foot.querySelector('#uconsent-accept');
    cb.addEventListener('change', () => { btn.disabled = !cb.checked; });
    btn.addEventListener('click', () => {
      try { localStorage.setItem(KEY, new Date().toISOString()); } catch (e) { /* ignore */ }
      close(backdrop);
    });
  } else {
    foot.innerHTML = `<div class="uc-actions"><button id="uconsent-close">ปิด</button></div>`;
    foot.querySelector('#uconsent-close').addEventListener('click', () => close(backdrop));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(backdrop); });
  }
  return backdrop;
}

function show(gated) {
  if (document.getElementById('uconsent-backdrop')) return;
  document.body.appendChild(build(gated));
  lockScroll();
}

/** Re-open the terms for reference (not gated). */
export function openTerms() { show(false); }

function accepted() {
  try { return !!localStorage.getItem(KEY); } catch (e) { return true; } // if storage is blocked, don't hard-block usage
}

function init() { if (!accepted()) show(true); }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
