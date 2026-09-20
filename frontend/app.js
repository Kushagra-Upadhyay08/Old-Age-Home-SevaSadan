document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // AUTH CHECK
  // ============================================================
  const token = localStorage.getItem('auth_token');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  if (!token || !userData.username) { window.location.href = '/'; return; }

  const userRole = userData.role;
  const API = (url, opts = {}) => {
    opts.headers = { ...(opts.headers || {}), 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const fullUrl = window.getApiUrl ? window.getApiUrl(url) : url;
    return fetch(fullUrl, opts);
  };

  // ============================================================
  // LANGUAGE & THEME
  // ============================================================
  let currentLang = localStorage.getItem('app_lang') || 'en';
  let currentTheme = localStorage.getItem('app_theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  function updateLangDisplay() {
    document.querySelectorAll('.display-lang-en').forEach(el => el.style.display = currentLang === 'en' ? '' : 'none');
    document.querySelectorAll('.display-lang-gu').forEach(el => el.style.display = currentLang === 'gu' ? '' : 'none');
  }

  function updateThemeIcons() {
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    if (lightIcon && darkIcon) {
      lightIcon.style.display = currentTheme === 'light' ? '' : 'none';
      darkIcon.style.display = currentTheme === 'dark' ? '' : 'none';
    }
  }

  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('app_theme', currentTheme);
    updateThemeIcons();
  });

  document.getElementById('lang-toggle-btn')?.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'gu' : 'en';
    localStorage.setItem('app_lang', currentLang);
    updateLangDisplay();
  });

  updateLangDisplay();
  updateThemeIcons();

  // ============================================================
  // USER DISPLAY
  // ============================================================
  const userNameEl = document.getElementById('user-name');
  const userRoleBadge = document.getElementById('user-role-badge');
  const userAvatarEl = document.getElementById('user-avatar');

  if (userNameEl) userNameEl.textContent = userData.username.charAt(0).toUpperCase() + userData.username.slice(1);
  if (userRoleBadge) userRoleBadge.textContent = userRole;
  if (userData.profilePhoto && userAvatarEl) {
    const avatarUrl = window.getAssetUrl ? window.getAssetUrl(userData.profilePhoto) : userData.profilePhoto;
    userAvatarEl.innerHTML = `<img src="${avatarUrl}" alt="Profile">`;
  }

  // Admin can see all sections including forms

  // ============================================================
  // SIDEBAR NAVIGATION
  // ============================================================
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  const contentArea = document.getElementById('content-area');
  const pageTitle = document.getElementById('page-title');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  let currentView = null;

  sidebarToggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));

  document.getElementById('nav-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/';
  });

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      navigateTo(view);
      sidebar?.classList.remove('open');
    });
  });

  function navigateTo(view) {
    navItems.forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (activeNav) activeNav.classList.add('active');
    currentView = view;
    renderView(view);
  }

  // ============================================================
  // VIEW RENDERER
  // ============================================================
  function renderView(view) {
    contentArea.innerHTML = '<div class="loading-spinner"><div class="spinner-lg"></div></div>';
    contentArea.style.animation = 'none';
    void contentArea.offsetHeight;
    contentArea.style.animation = 'fadeIn 0.3s ease';

    const titles = {
      'admission-form': currentLang === 'en' ? 'Admission Form' : 'પ્રવેશ ફોર્મ',
      'donation-form': currentLang === 'en' ? 'Donation Receipt' : 'દાન રસીદ',
      'view-forms': currentLang === 'en' ? 'Forms' : 'ફોર્મ',
      'view-donations': currentLang === 'en' ? 'Donation Receipts' : 'દાન રસીદો',
      'settings': currentLang === 'en' ? 'Settings' : 'સેટિંગ્સ'
    };
    if (pageTitle) pageTitle.textContent = titles[view] || 'Dashboard';

    setTimeout(() => {
      switch (view) {
        case 'admission-form': renderAdmissionForm(); break;
        case 'donation-form': renderDonationForm(); break;
        case 'view-forms': renderFormsList(); break;
        case 'view-donations': renderDonationsList(); break;
        case 'settings': renderSettings(); break;
        default: renderFormsList();
      }
      updateLangDisplay();
    }, 100);
  }

  // ============================================================
  // ADMISSION FORM VIEW (with all corrections)
  // ============================================================
  let childRowCount = 4;
  let nomineeCount = 1;

  function renderAdmissionForm() {
    childRowCount = 4;
    nomineeCount = 1;
    const today = new Date().toISOString().split('T')[0];
    contentArea.innerHTML = `
      <div style="max-width:900px;">
        <form id="admission-form" novalidate>

          <!-- General Info -->
          <div class="form-card">
            <div class="card-header"><h2><span class="display-lang-en">Application General Info</span><span class="display-lang-gu" style="display:none;">સામાન્ય વિગત</span></h2></div>
            <div class="form-row-3">
              <div class="form-group"><label><span class="display-lang-en">Application Number</span><span class="display-lang-gu" style="display:none;">અરજી નંબર</span></label><input type="text" name="application_number" placeholder="Auto-generated" readonly class="text-input"></div>
              <div class="form-group"><label><span class="display-lang-en">Date</span><span class="display-lang-gu" style="display:none;">તારીખ</span></label><input type="date" name="application_date" class="text-input" value="${today}" required></div>
              <div class="form-group"><label><span class="display-lang-en">Room Number (Pref)</span><span class="display-lang-gu" style="display:none;">રૂમ નંબર</span></label><input type="text" name="room_number" class="text-input" placeholder="e.g. 102"></div>
            </div>
          </div>

          <!-- Section 1: Applicant Details -->
          <div class="form-card">
            <div class="card-header border-coral"><h2><span class="display-lang-en">1. Details of the Applicant</span><span class="display-lang-gu" style="display:none;">૧. અરજદારે ભરવાની વિગતો</span></h2></div>
            <div class="form-group"><label class="required"><span class="display-lang-en">Applicant's Full Name</span><span class="display-lang-gu" style="display:none;">અરજદારનું પૂરું નામ</span></label><input type="text" name="full_name" class="text-input" required placeholder="Enter full name"><div class="error-msg" id="err-full_name"></div></div>
            <div class="form-group"><label class="required"><span class="display-lang-en">Applicant's Address</span><span class="display-lang-gu" style="display:none;">અરજદારનું સરનામું</span></label><textarea name="address" class="text-input textarea-field" required placeholder="Full residential address"></textarea><div class="error-msg" id="err-address"></div></div>
            <div class="form-row">
              <div class="form-group"><label class="required"><span class="display-lang-en">Telephone - Home</span><span class="display-lang-gu" style="display:none;">ટેલીફોન નંબર (ઘર)</span></label><input type="tel" name="phone_home" class="text-input" required placeholder="e.g. 02699XXXX"><div class="error-msg" id="err-phone_home"></div></div>
              <div class="form-group"><label><span class="display-lang-en">Telephone - Office</span><span class="display-lang-gu" style="display:none;">ટેલીફોન નંબર (ઓફિસ)</span></label><input type="tel" name="phone_office" class="text-input" placeholder="e.g. 02699XXXX"></div>
            </div>
            <div class="form-row-3">
              <div class="form-group"><label class="required"><span class="display-lang-en">Age</span><span class="display-lang-gu" style="display:none;">ઉંમર</span></label><input type="number" name="age" class="text-input" required min="1" max="120" placeholder="e.g. 65"><div class="error-msg" id="err-age"></div></div>
              <div class="form-group"><label class="required"><span class="display-lang-en">Date of Birth</span><span class="display-lang-gu" style="display:none;">જન્મ તારીખ</span></label><input type="date" name="date_of_birth" class="text-input" required><div class="error-msg" id="err-date_of_birth"></div></div>
              <div class="form-group"><label><span class="display-lang-en">Place of Birth</span><span class="display-lang-gu" style="display:none;">જન્મ સ્થાન</span></label><input type="text" name="place_of_birth" class="text-input" placeholder="City / Town"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Marital Status</span><span class="display-lang-gu" style="display:none;">વૈવાહિક પરિસ્થિતિ</span></label><select name="marital_status" class="text-input select-field"><option value="Unmarried">Unmarried / કુંવારા</option><option value="Married">Married / પરિણિત</option><option value="Widower">Widower / વિધુર</option><option value="Widow">Widow / વિધવા</option></select></div>
              <div class="form-group"><label><span class="display-lang-en">Current Occupation</span><span class="display-lang-gu" style="display:none;">વ્યવસાય</span></label><input type="text" name="occupation" class="text-input" placeholder="Current profession"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Previous Occupation</span><span class="display-lang-gu" style="display:none;">પૂર્વેનો વ્યવસાય</span></label><input type="text" name="previous_occupation" class="text-input" placeholder="Former profession"></div>
              <div class="form-group"><label><span class="display-lang-en">Annual Income (₹)</span><span class="display-lang-gu" style="display:none;">વાર્ષિક આવક</span></label><input type="text" name="annual_income" class="text-input" placeholder="Annual income in Rupees"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Source of Income</span><span class="display-lang-gu" style="display:none;">આવકનો સ્ત્રોત</span></label><input type="text" name="income_source" class="text-input" placeholder="Where does it come from?"></div>
              <div class="form-group"><label><span class="display-lang-en">Pension Details</span><span class="display-lang-gu" style="display:none;">પેન્શનની વિગત</span></label><input type="text" name="pension_details" class="text-input" placeholder="If receiving pension"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Movable / Immovable Property</span><span class="display-lang-gu" style="display:none;">સ્થાવર-જંગમ મિલકત</span></label><input type="text" name="movable_immovable_property" class="text-input" placeholder="Details of properties"></div>
              <div class="form-group"><label><span class="display-lang-en">Caste and Sub-caste</span><span class="display-lang-gu" style="display:none;">જ્ઞાતિ અને પેટા જ્ઞાતિ</span></label><input type="text" name="caste_subcaste" class="text-input" placeholder="Caste detail"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Native Place (Hometown)</span><span class="display-lang-gu" style="display:none;">મૂળવતન</span></label><input type="text" name="native_place" class="text-input" placeholder="Hometown"></div>
              <div class="form-group"><label><span class="display-lang-en">Stayed in other old-age home before?</span><span class="display-lang-gu" style="display:none;">આ પહેલાં કોઈ બીજા વૃદ્ધાશ્રમમાં રહ્યા છો?</span></label><input type="text" name="previous_ashram_stay" class="text-input" placeholder="Yes / No (If yes, specify name)"></div>
            </div>
            <div class="form-group"><label><span class="display-lang-en">Brief self-introduction (nature, skills, hobbies, what service can you offer at the ashram?)</span><span class="display-lang-gu" style="display:none;">પોતાનો પરિચય ટૂંકમાં આપો (સ્વભાવ-આવડત-શોખ-આશ્રમમાં શું સેવા આપી શકો?)</span></label><textarea name="self_introduction" class="text-input textarea-field" placeholder="Share a few lines about yourself"></textarea></div>
          </div>

          <!-- Section 2: Health Details -->
          <div class="form-card">
            <div class="card-header border-coral"><h2><span class="display-lang-en">2. Physical and Mental Condition Details</span><span class="display-lang-gu" style="display:none;">૨. શારીરિક તેમજ માનસિક પરિસ્થિતિની વિગત</span></h2></div>
            <div class="form-row-3">
              <div class="form-group"><label><span class="display-lang-en">Height</span><span class="display-lang-gu" style="display:none;">ઊંચાઈ</span></label><input type="text" name="height" class="text-input" placeholder="e.g. 5'6''"></div>
              <div class="form-group"><label><span class="display-lang-en">Weight</span><span class="display-lang-gu" style="display:none;">વજન</span></label><input type="text" name="weight" class="text-input" placeholder="e.g. 60 kg"></div>
              <div class="form-group"><label><span class="display-lang-en">Blood Group</span><span class="display-lang-gu" style="display:none;">બ્લડગ્રુપ</span></label><input type="text" name="blood_group" class="text-input" placeholder="e.g. B+"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Identification Mark</span><span class="display-lang-gu" style="display:none;">નોંધપાત્ર નિશાન</span></label><input type="text" name="identification_mark" class="text-input" placeholder="Any visible mark"></div>
              <div class="form-group"><label><span class="display-lang-en">Blood Pressure</span><span class="display-lang-gu" style="display:none;">બ્લડ પ્રેશર</span></label><input type="text" name="blood_pressure" class="text-input" placeholder="Normal / High / Low"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Diabetes</span><span class="display-lang-gu" style="display:none;">ડાયાબીટીસ</span></label><input type="text" name="diabetes" class="text-input" placeholder="Yes / No (If yes, specify)"></div>
              <div class="form-group"><label><span class="display-lang-en">Chronic Illness?</span><span class="display-lang-gu" style="display:none;">કાયમી બિમારી?</span></label><input type="text" name="chronic_illness" class="text-input" placeholder="Any chronic condition"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Serious Illness?</span><span class="display-lang-gu" style="display:none;">ગંભીર બિમારી?</span></label><input type="text" name="serious_illness" class="text-input" placeholder="Any serious condition"></div>
              <div class="form-group"><label><span class="display-lang-en">Any Operation?</span><span class="display-lang-gu" style="display:none;">કોઈ ઓપરેશન?</span></label><input type="text" name="any_operation" class="text-input" placeholder="Details of surgeries"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Cataract or other operation done?</span><span class="display-lang-gu" style="display:none;">મોતીયા કે અન્ય કોઈ ઓપરેશન કરાવ્યું છે?</span></label><input type="text" name="cataract_or_other_operation" class="text-input" placeholder="Cataract details"></div>
              <div class="form-group"><label><span class="display-lang-en">Teeth condition</span><span class="display-lang-gu" style="display:none;">દાંત</span></label><input type="text" name="teeth" class="text-input" placeholder="Natural / Dentures"></div>
            </div>
            <div class="form-group"><label><span class="display-lang-en">Regular Medication</span><span class="display-lang-gu" style="display:none;">કાયમી દવા</span></label><textarea name="regular_medication" class="text-input textarea-field" placeholder="List daily medications"></textarea></div>
            <div class="note-box alert-warning">
              <p><span class="display-lang-en">⚠️ Note: A doctor's health certificate is required to be submitted at the time of admission.</span><span class="display-lang-gu" style="display:none;">⚠️ ડૉક્ટરનું સર્ટીફિકેટ તમારા સ્વાસ્થ્ય અંગેનું લાવવું જરૂરી છે.</span></p>
            </div>
            <div class="form-row-3">
              <div class="form-group"><label><span class="display-lang-en">Doctor's Signature / Name</span><span class="display-lang-gu" style="display:none;">ડૉક્ટરની સહી / નામ</span></label><input type="text" name="doctor_signature" class="text-input" placeholder="Dr. Name"></div>
              <div class="form-group"><label><span class="display-lang-en">Responsible Person (Name)</span><span class="display-lang-gu" style="display:none;">જવાબદાર વ્યક્તિ (નામ)</span></label><input type="text" name="responsible_person_name_side" class="text-input" placeholder="Signee Name"></div>
              <div class="form-group"><label><span class="display-lang-en">Telephone Number</span><span class="display-lang-gu" style="display:none;">ટેલીફોન નંબર</span></label><input type="tel" name="responsible_person_phone_side" class="text-input" placeholder="Phone"></div>
            </div>
          </div>

          <!-- Section 3: Family Details -->
          <div class="form-card">
            <div class="card-header border-coral"><h2><span class="display-lang-en">3. Family Situation</span><span class="display-lang-gu" style="display:none;">૩. કૌટુંબિક પરિસ્થિતિ</span></h2></div>
            <p class="section-desc"><span class="display-lang-en">Details of children (Son / Daughter):</span><span class="display-lang-gu" style="display:none;">પુત્ર / પુત્રીની વિગતો:</span></p>
            <div class="table-responsive">
              <table class="family-table">
                <thead><tr>
                  <th><span class="display-lang-en">Name of Son/Daughter</span><span class="display-lang-gu" style="display:none;">પુત્ર/પુત્રીના નામ</span></th>
                  <th><span class="display-lang-en">Age</span><span class="display-lang-gu" style="display:none;">ઉંમર</span></th>
                  <th><span class="display-lang-en">Occupation</span><span class="display-lang-gu" style="display:none;">વ્યવસાય</span></th>
                  <th><span class="display-lang-en">Annual Income</span><span class="display-lang-gu" style="display:none;">વાર્ષિક આવક</span></th>
                  <th><span class="display-lang-en">Residence & Phone</span><span class="display-lang-gu" style="display:none;">રહેઠાણ સ્થળ, ટેલીફોન નં.</span></th>
                </tr></thead>
                <tbody id="children-rows">
                  ${[1,2,3,4].map(i => `<tr id="child-row-${i}"><td><input type="text" name="child_${i}_name" class="table-input"></td><td><input type="text" name="child_${i}_age" class="table-input"></td><td><input type="text" name="child_${i}_occupation" class="table-input"></td><td><input type="text" name="child_${i}_income" class="table-input"></td><td><input type="text" name="child_${i}_contact" class="table-input"></td></tr>`).join('')}
                </tbody>
              </table>
            </div>
            <button type="button" id="add-child-row-btn" class="button-secondary" style="margin-bottom:20px;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span class="display-lang-en">Add Row</span><span class="display-lang-gu" style="display:none;">વધુ ઉમેરો</span>
            </button>

            <p class="section-desc" style="margin-top:16px;"><span class="display-lang-en">Spouse Details (Husband / Wife):</span><span class="display-lang-gu" style="display:none;">પતિ / પત્નીની વિગત:</span></p>
            <div class="form-row-3">
              <div class="form-group"><label><span class="display-lang-en">Spouse Name</span><span class="display-lang-gu" style="display:none;">પતિ / પત્નીનું નામ</span></label><input type="text" name="spouse_name" class="text-input" placeholder="Spouse name"></div>
              <div class="form-group"><label><span class="display-lang-en">Age</span><span class="display-lang-gu" style="display:none;">ઉંમર</span></label><input type="number" name="spouse_age" class="text-input" placeholder="Age"></div>
              <div class="form-group"><label><span class="display-lang-en">Occupation</span><span class="display-lang-gu" style="display:none;">વ્યવસાય</span></label><input type="text" name="spouse_occupation" class="text-input" placeholder="Occupation"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label><span class="display-lang-en">Annual Income</span><span class="display-lang-gu" style="display:none;">વાર્ષિક આવક</span></label><input type="text" name="spouse_income" class="text-input" placeholder="Annual Income"></div>
              <div class="form-group"><label><span class="display-lang-en">Residence & Contact Phone</span><span class="display-lang-gu" style="display:none;">રહેઠાણ તેમજ ફોન નંબર</span></label><input type="text" name="spouse_contact" class="text-input" placeholder="Address and Phone"></div>
            </div>
          </div>

          <!-- Section 4: Nominee Details -->
          <div class="form-card">
            <div class="card-header border-coral"><h2><span class="display-lang-en">4. Details of the Applicant's Nominee</span><span class="display-lang-gu" style="display:none;">૪. અરજદારના નોમીનીની વિગત</span></h2></div>
            <div id="nominees-container">
              <div class="nominee-block" data-nominee="1">
                <div class="form-row">
                  <div class="form-group"><label class="required"><span class="display-lang-en">Nominee Name</span><span class="display-lang-gu" style="display:none;">નોમીનીનું નામ</span></label><input type="text" name="nominee_name" class="text-input" required placeholder="Full name of nominee"><div class="error-msg" id="err-nominee_name"></div></div>
                  <div class="form-group"><label class="required"><span class="display-lang-en">Relation to Applicant</span><span class="display-lang-gu" style="display:none;">અરજદાર સાથે સંબંધ (સગાઈ)</span></label><input type="text" name="nominee_relation" class="text-input" required placeholder="e.g. Son, Daughter, Friend"><div class="error-msg" id="err-nominee_relation"></div></div>
                </div>
                <div class="form-group"><label><span class="display-lang-en">Address</span><span class="display-lang-gu" style="display:none;">સરનામું</span></label><textarea name="nominee_address" class="text-input textarea-field" placeholder="Nominee's address"></textarea></div>
                <div class="form-row-3">
                  <div class="form-group"><label class="required"><span class="display-lang-en">Telephone Number</span><span class="display-lang-gu" style="display:none;">ટેલીફોન નંબર</span></label><input type="tel" name="nominee_phone" class="text-input" required placeholder="Phone number"><div class="error-msg" id="err-nominee_phone"></div></div>
                  <div class="form-group"><label><span class="display-lang-en">Date</span><span class="display-lang-gu" style="display:none;">તારીખ</span></label><input type="date" name="nominee_date" class="text-input"></div>
                  <div class="form-group"><label><span class="display-lang-en">Applicant's Signature/Consent</span><span class="display-lang-gu" style="display:none;">અરજદારની સહી/સંમતિ</span></label><input type="text" name="applicant_signature" class="text-input" placeholder="Type name to sign"></div>
                </div>
              </div>
            </div>
            <div id="extra-nominees"></div>
            <button type="button" id="add-nominee-btn" class="button-secondary" style="margin-top:12px;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span class="display-lang-en">Add Nominee</span><span class="display-lang-gu" style="display:none;">નોમીની ઉમેરો</span>
            </button>
          </div>

          <!-- Section 5: Responsible Person / Emergency -->
          <div class="form-card">
            <div class="card-header border-coral"><h2><span class="display-lang-en">5. For Illness / Emergency & Expenses</span><span class="display-lang-gu" style="display:none;">૫. માંદગી અથવા ઈમરજન્સી વખતે તથા માસિક અને અન્ય ખર્ચ માટે</span></h2></div>
            <div class="form-row">
              <div class="form-group"><label class="required"><span class="display-lang-en">Responsible Person Name</span><span class="display-lang-gu" style="display:none;">જવાબદાર વ્યક્તિનું નામ</span></label><input type="text" name="responsible_person_name" class="text-input" required placeholder="Full name"><div class="error-msg" id="err-responsible_person_name"></div></div>
              <div class="form-group"><label class="required"><span class="display-lang-en">Relation to Applicant</span><span class="display-lang-gu" style="display:none;">સંબંધ (નાતો)</span></label><input type="text" name="responsible_person_relation" class="text-input" required placeholder="e.g. Son, Daughter"><div class="error-msg" id="err-responsible_person_relation"></div></div>
            </div>
            <div class="form-group"><label class="required"><span class="display-lang-en">Responsible Person's Address</span><span class="display-lang-gu" style="display:none;">જવાબદાર વ્યક્તિનું સરનામું</span></label><textarea name="responsible_person_address" class="text-input textarea-field" required placeholder="Address"></textarea><div class="error-msg" id="err-responsible_person_address"></div></div>
            <div class="form-row">
              <div class="form-group"><label class="required"><span class="display-lang-en">Mobile / Telephone</span><span class="display-lang-gu" style="display:none;">મો. / ટેલીફોન નંબર</span></label><input type="tel" name="responsible_person_phone" class="text-input" required placeholder="Phone number"><div class="error-msg" id="err-responsible_person_phone"></div></div>
              <div class="form-group"><label><span class="display-lang-en">Telephone Number</span><span class="display-lang-gu" style="display:none;">ટેલીફોન નંબર</span></label><input type="tel" name="responsible_person_landline" class="text-input" placeholder="Landline"></div>
            </div>

            <!-- Declaration -->
            <div class="declaration-box">
              <h3><span class="display-lang-en">Declaration / ઘોષણા</span><span class="display-lang-gu" style="display:none;">ઘોષણા</span></h3>
              <p class="declaration-text" id="dec-text-en">
                <span class="display-lang-en">The applicant <strong id="dec-name-en">[Applicant Name]</strong> is my <strong id="dec-rel-en">[Relation]</strong>. They want to enter the ashram of their own free will. They are fully aware of the rules. I bind myself to take them back when notified by trustees. In case of death during their stay, if I am unable to be present, I authorize trustees to conduct the final rites. I bind myself to pay the monthly costs within the first week of every month as determined from time to time.</span>
                <span class="display-lang-gu" style="display:none;">અરજદારશ્રી <strong id="dec-name-gu">[અરજદારનું નામ]</strong> મારા <strong id="dec-rel-gu">[સંબંધ]</strong> છે. પોતાની રાજીખુશીથી આશ્રમમાં દાખલ થવા માંગે છે. આશ્રમના નીતિનિયમોથી તેમને સંપૂર્ણપણે વાકેફ કરવામાં આવેલ છે. આશ્રમના નિયામક/ટ્રસ્ટીઓ જ્યારે ખબર આપશે ત્યારે તેમને લઈ જવા હું બંધાઉં છું. તેમનું મૃત્યુ આશ્રમના રહેઠાણ દરમ્યાન થાય અને જો હાજર ન રહી શકું તો આશ્રમના નિયામક/ટ્રસ્ટીઓને તેમનો અગ્નિ સંસ્કાર કરવાની વિનંતી કરું છું. તેમનો આશ્રમમાં રહેવાનો ખર્ચ વખતોવખત જે નક્કી થાય તે દર માસના પહેલા અઠવાડિયાની અંદર આપવા માટે હું બંધાઉ છું.</span>
              </p>
            </div>

            <div class="form-row-3" style="margin-top:16px;">
              <div class="form-group"><label><span class="display-lang-en">Date</span><span class="display-lang-gu" style="display:none;">તારીખ</span></label><input type="date" name="responsible_date" class="text-input" value="${today}"></div>
              <div class="form-group"><label><span class="display-lang-en">Responsible Person's Signature</span><span class="display-lang-gu" style="display:none;">જવાબદાર વ્યક્તિની સહી</span></label><input type="text" name="responsible_person_signature" class="text-input" placeholder="Type name to sign"></div>
              <div class="form-group"></div>
            </div>
          </div>

          <!-- Section 6: Rules & Regulations (Mandatory) -->
          <div class="form-card">
            <div class="card-header border-coral"><h2><span class="display-lang-en">6. Ashram Rules & Regulations</span><span class="display-lang-gu" style="display:none;">૬. આશ્રમના નીતિ નિયમો</span></h2></div>
            <ol class="rules-list-inline">
              <li><span class="display-lang-en">According to the rules, deposit, admission fee, and monthly charge must be submitted along with this form and 3 passport size photographs of the elderly member. One passport size photograph of the responsible person is also required.</span><span class="display-lang-gu" style="display:none;">અશક્તાશ્રમના નિયમ પ્રમાણે ડીપોઝીટ, દાખલ ફી, તથા માસિક સહયોગ આ ફોર્મ ભરીને ત્રણ પાસપોર્ટ સાઈઝના ફોટા સાથે પ્રવેશ ઈચ્છતા વડીલે સંચાલક કે ટ્રસ્ટીને મળવાનું રહેશે. જવાબદાર વ્યક્તિનો પાસપોર્ટ સાઈઝનો એક ફોટો આપવાનો રહેશે.</span></li>
              <li><span class="display-lang-en">Initially, admission will be on a temporary basis for 1 month.</span><span class="display-lang-gu" style="display:none;">શરુઆતમાં ૧ મહિના માટે હંગામી ધોરણે દાખલ કરવામાં આવશે.</span></li>
              <li><span class="display-lang-en">Monthly support contribution must be paid before the 10th of every month.</span><span class="display-lang-gu" style="display:none;">માસિક ફી તા. ૧૦મી પહેલા આપી દેવાની રહેશે.</span></li>
              <li><span class="display-lang-en">Admission is prohibited for anyone with infectious diseases, any kind of addiction, mental instability, or intellectual disability.</span><span class="display-lang-gu" style="display:none;">આશ્રમમાં ચેપીરોગ, કોઈપણ વ્યસનવાળી, માનસિક અસ્થિરતા અથવા મંદબુદ્ધિવાળી વ્યક્તિને પ્રવેશ માટે નિષેધ છે.</span></li>
              <li><span class="display-lang-en">Residents must be present at the designated place on time for prayers, hymns, tea, and meals. Residents wishing to travel out of town must seek permission from the manager.</span><span class="display-lang-gu" style="display:none;">આશ્રમમાં રહેનારે સમયસર પ્રાર્થના, ભજન, ચા અને જમવા માટે નિયત સ્થળે હાજર રહેવું પડશે. બહારગામ જવા ઈચ્છતા આશ્રમવાસીએ મેનેજરની પરવાનગી લેવાની રહેશે.</span></li>
              <li><span class="display-lang-en">Use the ashram properties carefully. Violators will be discharged. Residents should live with brotherhood, cooperation, and mutual understanding.</span><span class="display-lang-gu" style="display:none;">આશ્રમની મિલ્કત પોતાની મિલ્કતને સંભાળપૂર્વક વાપરે તેમ વાપરવી. નુકશાન કરનારને રજા આપવામાં આવશે.</span></li>
              <li><span class="display-lang-en">Electrical appliances from outside are not permitted. Wastage of water or electricity will not be tolerated.</span><span class="display-lang-gu" style="display:none;">આશ્રમના કોઈપણ ઈલેક્ટ્રીક ઉપકરણનો ઉપયોગ થઈ શકશે નહીં. પાણીનો કે વિજળીનો બગાડ ચલાવી લેવામાં આવશે નહિ.</span></li>
              <li><span class="display-lang-en">Essentials such as a pot, tumbler, blanket, mattress, bedsheet, and pillow will be provided.</span><span class="display-lang-gu" style="display:none;">આશ્રમમાં રહેવા આવનાર માટે લોટો, પવાલુ, ચારસો, ધાબળો, ગાદલું, ચાદર, ઓશીકું વિ. આપવામાં આવશે.</span></li>
              <li><span class="display-lang-en">Trustees/Directors can ask a resident to leave without specifying reasons.</span><span class="display-lang-gu" style="display:none;">આશ્રમવાસીને કોઈપણ જાતના કારણ જણાવ્યા વગર સંચાલક કે ટ્રસ્ટી આશ્રમ ખાલી કરવાની ફરજ પાડી શકે.</span></li>
              <li><span class="display-lang-en">Residents must inform 15 days in advance for refund of security deposits.</span><span class="display-lang-gu" style="display:none;">આશ્રમ છોડનારે ડીપોઝીટ રીફંડ માટે પંદર દિવસ અગાઉ જાણ કરવાની રહેશે.</span></li>
              <li><span class="display-lang-en">Ration card and Aadhar card photocopy of applicant and Aadhar card copy of the responsible person must be attached.</span><span class="display-lang-gu" style="display:none;">અરજી ફોર્મ સાથે અરજદારનું રેશનકાર્ડ અને આધારકાર્ડની ઝેરોક્ષ કોપી તેમજ જવાબદાર વ્યક્તિના આધારકાર્ડની ઝેરોક્ષ કોપી સાથે બીડવી જરૂરી છે.</span></li>
              <li><span class="display-lang-en">Residents must perform any assigned duties sincerely according to their strength and ability.</span><span class="display-lang-gu" style="display:none;">આશ્રમના ઘટિત સંચાલન માટે તમારી શક્તિ અને આવડત મુજબ સંચાલકોએ નક્કી કરેલ જવાબદારી નિષ્ઠાપૂર્વક બજાવવાની રહેશે.</span></li>
              <li><span class="display-lang-en">Admission is confirmed only after receiving a medical fitness certificate from the Ashram Doctor.</span><span class="display-lang-gu" style="display:none;">આશ્રમના ડૉક્ટરના મેડીકલ ફીટનેસના સર્ટીફિકેટ મેળવ્યા પછી જ આશ્રમમાં દાખલ કરવામાં આવશે.</span></li>
            </ol>

            <div class="checkbox-container" style="margin-top:20px;">
              <input type="checkbox" id="rules_read_acknowledgement" name="rules_read_acknowledgement" required>
              <label for="rules_read_acknowledgement" class="required"><span class="display-lang-en">I have read the ashram's policy rules. I also agree to abide by any rules made hereafter.</span><span class="display-lang-gu" style="display:none;">આશ્રમના નીતિ નિયમો મેં વાંચ્યા છે. તે ઉપરાંત જે કાંઈ નિયમો હવે પછી કરવામાં આવશે તેનું પાલન કરવા હું બંધાઉ છું.</span></label>
            </div>
            <div class="error-msg" id="err-rules_read_acknowledgement"></div>

            <div class="form-row" style="margin-top:16px;">
              <div class="form-group"><label><span class="display-lang-en">Date</span><span class="display-lang-gu" style="display:none;">તારીખ</span></label><input type="date" name="ack_date" class="text-input" value="${today}"></div>
              <div class="form-group"><label><span class="display-lang-en">Applicant/Person's Signature</span><span class="display-lang-gu" style="display:none;">અરજદાર/વ્યક્તિની સહી</span></label><input type="text" name="person_signature" class="text-input" placeholder="Type name to sign"></div>
            </div>
          </div>

          <!-- Section 7: For Office Use - Director's Approval -->
          <div class="form-card">
            <div class="card-header bg-dark"><h2><span class="display-lang-en">For Office Use — Director's Approval & Signature</span><span class="display-lang-gu" style="display:none;">આશ્રમના નિયામકશ્રીની મંજૂરી તથા સહી</span></h2></div>
            <p class="section-desc" style="margin-bottom:12px;"><span class="display-lang-en">Shri ___ is admitted to the ashram from date ___. Monthly charge Rs. ___ is guaranteed by Shri ___.</span><span class="display-lang-gu" style="display:none;">શ્રી ___ ને આશ્રમ તા. ___ થી દાખલ કરવામાં આવે છે. માસિક રૂ. ___ ચાર્જ આપવા શ્રી ___ એ બાંયધરી આપી છે.</span></p>
            <div class="form-row-3">
              <div class="form-group"><label><span class="display-lang-en">Admission Date</span><span class="display-lang-gu" style="display:none;">દાખલ કરવાની તારીખ</span></label><input type="${userRole === 'admin' ? 'date' : 'text'}" name="office_admission_date" class="text-input" ${userRole !== 'admin' ? 'readonly placeholder="Assigned upon approval"' : ''}></div>
              <div class="form-group"><label><span class="display-lang-en">Monthly Charge (₹)</span><span class="display-lang-gu" style="display:none;">મંજૂર માસિક ચાર્જ (રૂ.)</span></label><input type="${userRole === 'admin' ? 'number' : 'text'}" name="office_monthly_charge" class="text-input" ${userRole !== 'admin' ? 'readonly placeholder="TBD by Director"' : 'placeholder="Enter amount" min="0"'}></div>
              <div class="form-group">
                <label><span class="display-lang-en">Director Signature</span><span class="display-lang-gu" style="display:none;">નિયામકની સહી</span></label>
                ${userRole === 'admin' ? `
                <div class="signature-upload-area" id="signature-upload-area">
                  <div class="signature-preview" id="signature-preview" style="display:none;">
                    <img id="signature-preview-img" src="" alt="Signature Preview">
                    <button type="button" class="signature-remove-btn" id="remove-signature-btn" title="Remove Signature">&times;</button>
                  </div>
                  <label class="signature-upload-btn" id="signature-upload-label">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span class="display-lang-en">Upload Signature Photo</span><span class="display-lang-gu" style="display:none;">સહી ફોટો અપલોડ</span>
                    <input type="file" id="director-signature-file" accept="image/*" style="display:none;">
                  </label>
                  <input type="hidden" name="office_director_signature" id="office-director-signature-path" value="">
                </div>
                ` : `<input type="text" name="office_director_signature" class="text-input" readonly placeholder="Pending Signature">`}
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="submit-container">
            <button type="submit" class="button-primary btn-large"><span class="display-lang-en">Submit Application</span><span class="display-lang-gu" style="display:none;">અરજી સબમિટ કરો</span></button>
          </div>
          <div id="form-result" class="result-box" style="display:none;"></div>
        </form>
      </div>`;
    updateLangDisplay();
    setupAdmissionFormHandlers();
  }

  function setupAdmissionFormHandlers() {
    const form = document.getElementById('admission-form');
    if (!form) return;

    // Dynamic declaration text
    const nameInput = form.elements['full_name'];
    const relInput = form.elements['responsible_person_relation'];
    function updateDeclaration() {
      const n = nameInput?.value.trim() || '[Applicant Name]';
      const r = relInput?.value.trim() || '[Relation]';
      const decNameEn = document.getElementById('dec-name-en');
      const decRelEn = document.getElementById('dec-rel-en');
      const decNameGu = document.getElementById('dec-name-gu');
      const decRelGu = document.getElementById('dec-rel-gu');
      if (decNameEn) decNameEn.textContent = n;
      if (decRelEn) decRelEn.textContent = r;
      if (decNameGu) decNameGu.textContent = n;
      if (decRelGu) decRelGu.textContent = r;
    }
    nameInput?.addEventListener('input', updateDeclaration);
    relInput?.addEventListener('input', updateDeclaration);

    // Add child row button
    document.getElementById('add-child-row-btn')?.addEventListener('click', () => {
      childRowCount++;
      const tbody = document.getElementById('children-rows');
      if (!tbody) return;
      const tr = document.createElement('tr');
      tr.id = `child-row-${childRowCount}`;
      tr.innerHTML = `<td><input type="text" name="child_${childRowCount}_name" class="table-input"></td><td><input type="text" name="child_${childRowCount}_age" class="table-input"></td><td><input type="text" name="child_${childRowCount}_occupation" class="table-input"></td><td><input type="text" name="child_${childRowCount}_income" class="table-input"></td><td><input type="text" name="child_${childRowCount}_contact" class="table-input"></td>`;
      tbody.appendChild(tr);
    });

    // Add nominee button
    document.getElementById('add-nominee-btn')?.addEventListener('click', () => {
      nomineeCount++;
      const container = document.getElementById('extra-nominees');
      if (!container) return;
      const div = document.createElement('div');
      div.className = 'nominee-block';
      div.dataset.nominee = nomineeCount;
      div.style.marginTop = '20px';
      div.style.paddingTop = '16px';
      div.style.borderTop = '1px dashed var(--color-hairline)';
      div.innerHTML = `
        <p class="section-desc"><span class="display-lang-en">Nominee ${nomineeCount}</span><span class="display-lang-gu" style="display:${currentLang === 'gu' ? '' : 'none'};">નોમીની ${nomineeCount}</span></p>
        <div class="form-row">
          <div class="form-group"><label><span class="display-lang-en">Nominee Name</span><span class="display-lang-gu" style="display:${currentLang === 'gu' ? '' : 'none'};">નોમીનીનું નામ</span></label><input type="text" name="nominee_${nomineeCount}_name" class="text-input" placeholder="Full name"></div>
          <div class="form-group"><label><span class="display-lang-en">Relation</span><span class="display-lang-gu" style="display:${currentLang === 'gu' ? '' : 'none'};">સંબંધ</span></label><input type="text" name="nominee_${nomineeCount}_relation" class="text-input" placeholder="Relation"></div>
        </div>
        <div class="form-group"><label><span class="display-lang-en">Address</span><span class="display-lang-gu" style="display:${currentLang === 'gu' ? '' : 'none'};">સરનામું</span></label><textarea name="nominee_${nomineeCount}_address" class="text-input textarea-field" placeholder="Address"></textarea></div>
        <div class="form-row"><div class="form-group"><label><span class="display-lang-en">Phone</span><span class="display-lang-gu" style="display:${currentLang === 'gu' ? '' : 'none'};">ફોન</span></label><input type="tel" name="nominee_${nomineeCount}_phone" class="text-input" placeholder="Phone"></div>
        <div class="form-group"><label><span class="display-lang-en">Date</span><span class="display-lang-gu" style="display:${currentLang === 'gu' ? '' : 'none'};">તારીખ</span></label><input type="date" name="nominee_${nomineeCount}_date" class="text-input"></div></div>`;
      container.appendChild(div);
      updateLangDisplay();
    });

    // Director signature upload handler (admin only)
    if (userRole === 'admin') {
      const sigFileInput = document.getElementById('director-signature-file');
      const sigPreview = document.getElementById('signature-preview');
      const sigPreviewImg = document.getElementById('signature-preview-img');
      const sigPathInput = document.getElementById('office-director-signature-path');
      const sigUploadLabel = document.getElementById('signature-upload-label');
      const removeSigBtn = document.getElementById('remove-signature-btn');

      sigFileInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (sigPreviewImg) sigPreviewImg.src = ev.target.result;
          if (sigPreview) sigPreview.style.display = 'flex';
          if (sigUploadLabel) sigUploadLabel.style.display = 'none';
        };
        reader.readAsDataURL(file);

        // Upload to server
        const fd = new FormData();
        fd.append('signature', file);
        try {
          const sigUrl = window.getApiUrl ? window.getApiUrl('/api/upload-signature') : '/api/upload-signature';
          const res = await fetch(sigUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
          });
          const data = await res.json();
          if (data.success && sigPathInput) {
            sigPathInput.value = data.signaturePath;
          }
        } catch (err) {
          console.error('Signature upload error:', err);
        }
      });

      removeSigBtn?.addEventListener('click', () => {
        if (sigPreview) sigPreview.style.display = 'none';
        if (sigUploadLabel) sigUploadLabel.style.display = 'flex';
        if (sigPathInput) sigPathInput.value = '';
        if (sigPreviewImg) sigPreviewImg.src = '';
        if (sigFileInput) sigFileInput.value = '';
      });
    }

    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const resultBox = document.getElementById('form-result');
      resultBox.style.display = 'none';
      document.querySelectorAll('.error-msg').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
      document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

      const validations = [
        { name: 'full_name', msg: 'Full Name is required. / પૂરું નામ જરૂરી છે.' },
        { name: 'address', msg: 'Address is required. / સરનામું જરૂરી છે.' },
        { name: 'phone_home', msg: 'Phone is required. / ફોન જરૂરી છે.' },
        { name: 'age', msg: 'Age is required. / ઉંમર જરૂરી છે.' },
        { name: 'date_of_birth', msg: 'Date of Birth is required. / જન્મ તારીખ જરૂરી છે.' },
        { name: 'nominee_name', msg: 'Nominee Name is required. / નોમીનીનું નામ જરૂરી છે.' },
        { name: 'nominee_relation', msg: 'Relation is required. / સંબંધ જરૂરી છે.' },
        { name: 'nominee_phone', msg: 'Phone is required. / ફોન જરૂરી છે.' },
        { name: 'responsible_person_name', msg: 'Responsible Person is required. / જવાબદાર વ્યક્તિ જરૂરી છે.' },
        { name: 'responsible_person_relation', msg: 'Relation is required. / સંબંધ જરૂરી છે.' },
        { name: 'responsible_person_address', msg: 'Address is required. / સરનામું જરૂરી છે.' },
        { name: 'responsible_person_phone', msg: 'Phone is required. / ફોન જરૂરી છે.' },
      ];

      let valid = true;
      validations.forEach(v => {
        const field = form.elements[v.name];
        if (field && (!field.value || field.value.trim() === '')) {
          valid = false;
          field.classList.add('input-error');
          const errEl = document.getElementById(`err-${v.name}`);
          if (errEl) { errEl.textContent = v.msg; errEl.classList.add('visible'); }
        }
      });

      // Mandatory rules checkbox
      const rulesCheckbox = form.elements['rules_read_acknowledgement'];
      if (!rulesCheckbox?.checked) {
        valid = false;
        const errEl = document.getElementById('err-rules_read_acknowledgement');
        if (errEl) {
          errEl.textContent = currentLang === 'en' ? 'You must read and agree to the ashram rules to submit.' : 'અરજી સબમિટ કરવા માટે આશ્રમના નિયમો વાંચી સ્વીકારવા જરૂરી છે.';
          errEl.classList.add('visible');
        }
      }

      if (!valid) {
        resultBox.textContent = currentLang === 'en' ? 'Please fix the errors before submitting.' : 'કૃપા કરીને ભૂલો સુધારો.';
        resultBox.className = 'result-box error';
        resultBox.style.display = 'block';
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Collect form data
      const formData = new FormData(form);
      const payload = {};
      formData.forEach((val, key) => { if (!key.startsWith('child_')) payload[key] = val; });
      payload.rules_read_acknowledgement = rulesCheckbox.checked;

      const childrenData = [];
      for (let i = 1; i <= childRowCount; i++) {
        childrenData.push({ row: i, child_name: form.elements[`child_${i}_name`]?.value || '', age: form.elements[`child_${i}_age`]?.value || '', occupation: form.elements[`child_${i}_occupation`]?.value || '', annual_income: form.elements[`child_${i}_income`]?.value || '', contact: form.elements[`child_${i}_contact`]?.value || '' });
      }
      payload.children_rows = childrenData;

      // Extra nominees
      if (nomineeCount > 1) {
        const extraNominees = [];
        for (let i = 2; i <= nomineeCount; i++) {
          extraNominees.push({ name: form.elements[`nominee_${i}_name`]?.value || '', relation: form.elements[`nominee_${i}_relation`]?.value || '', address: form.elements[`nominee_${i}_address`]?.value || '', phone: form.elements[`nominee_${i}_phone`]?.value || '' });
        }
        payload.extra_nominees = extraNominees;
      }

      resultBox.textContent = currentLang === 'en' ? 'Submitting...' : 'સબમિટ થઈ રહ્યું છે...';
      resultBox.className = 'result-box info';
      resultBox.style.display = 'block';

      try {
        const res = await API('/api/submit', { method: 'POST', body: JSON.stringify(payload) });
        const data = await res.json();
        if (res.ok && data.success) {
          resultBox.textContent = data.message;
          resultBox.className = 'result-box success';
          form.reset();
          form.elements['application_date'].value = today;
        } else {
          resultBox.textContent = data.message || 'Submission failed.';
          resultBox.className = 'result-box error';
        }
      } catch (err) {
        resultBox.textContent = currentLang === 'en' ? 'Connection error.' : 'કનેક્શન ભૂલ.';
        resultBox.className = 'result-box error';
      }
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ============================================================
  // DONATION RECEIPT FORM VIEW
  // ============================================================
  // DONATION RECEIPT FORM VIEW (Exact Match to Official Receipt)
  // ============================================================
  function renderDonationForm() {
    const today = new Date().toISOString().split('T')[0];
    contentArea.innerHTML = `
      <div style="max-width:960px;margin:0 auto;">
        <form id="donation-form" novalidate>
          <div class="receipt-official-card">

            <!-- Official Header -->
            <div class="receipt-official-header">
              <p class="receipt-tax-exemption">
                Income Tax Exemption under Section 80-G Registration No. AAATL0845LF20212 VALID UPTO A. Y. 2026-27<br>
                Under Section 80-G (5) by the Commissioner of Income Tax Gujarat III Ahmedabad
              </p>
              <h1 class="receipt-trust-name">
                <span class="display-lang-en">Shantilal Mohanlal Shah Ashaktashram Society</span>
                <span class="display-lang-gu" style="display:none;">શાંતિલાલ મોહનલાલ શાહ અશક્તઆશ્રમ સોસાયટી</span>
              </h1>
              <p class="receipt-trust-sub">
                <span class="display-lang-en">Registration No. F-812 (Ahmedabad) &nbsp;|&nbsp; PAN : AAATL 0845L</span>
                <span class="display-lang-gu" style="display:none;">નોંધણી નંબર એફ-૮૧૨ (અમદાવાદ) &nbsp;|&nbsp; PAN : AAATL 0845L</span>
              </p>
              <p class="receipt-trust-sub">
                <span class="display-lang-en">Near Ganesh Talkies, Dakor-388 225. Phone: 95-(2696) 244218</span>
                <span class="display-lang-gu" style="display:none;">ગણેશ ટોકીઝ પાસે, ડાકોર-૩૮૮ ૨૨૫. ફોન નં: ૯૫-(૨૬૯૬) ૨૪૪૨૧૮</span>
              </p>
            </div>

            <!-- Meta Box (Receipt Number & Date on Right) -->
            <div class="receipt-meta-grid">
              <div style="flex:1;">
                <p style="font-size:13px;font-weight:600;color:var(--color-primary-dark);margin:0;">
                  <span class="display-lang-en">Official Donation Entry / દાન સ્વીકાર પહોંચ</span>
                  <span class="display-lang-gu" style="display:none;">સત્તાવાર દાન સ્વીકાર પહોંચ / રસીદ</span>
                </p>
                <p style="font-size:12px;color:var(--color-muted);margin:2px 0 0;">
                  <span class="display-lang-en">Fill in fund breakdown on the left and donor/bank details on the right.</span>
                  <span class="display-lang-gu" style="display:none;">ડાબી બાજુ ફંડ વિગત અને જમણી બાજુ દાતા/ચુકવણી વિગતો ભરો.</span>
                </p>
              </div>

              <div class="receipt-number-box">
                <div class="receipt-number-row">
                  <div class="receipt-number-label"><span class="display-lang-en">Receipt No.</span><span class="display-lang-gu" style="display:none;">રસીદ નંબર</span></div>
                  <div class="receipt-number-val">
                    <select name="receipt_type" style="border:none;background:transparent;font-weight:700;margin-right:6px;outline:none;cursor:pointer;">
                      <option value="B">B</option>
                      <option value="D">D</option>
                    </select>
                    <input type="text" name="receipt_number_display" placeholder="Auto" readonly style="border:none;background:transparent;font-weight:700;width:70px;outline:none;color:var(--color-primary-dark);">
                  </div>
                </div>
                <div class="receipt-number-row">
                  <div class="receipt-number-label required"><span class="display-lang-en">Date</span><span class="display-lang-gu" style="display:none;">તારીખ</span></div>
                  <div class="receipt-number-val">
                    <input type="date" name="receipt_date" class="text-input" required value="${today}" style="padding:2px 6px;font-size:12px;border:none;background:transparent;outline:none;width:100%;">
                  </div>
                </div>
              </div>
            </div>

            <!-- Two-Column Official Layout -->
            <div class="receipt-body-grid">

              <!-- Left Column: Fund Categories Breakdown -->
              <div class="receipt-funds-col">
                <div class="receipt-funds-header">
                  <span><span class="display-lang-en">Fund Category</span><span class="display-lang-gu" style="display:none;">ફંડનું નામ</span></span>
                  <span><span class="display-lang-en">Amount (₹)</span><span class="display-lang-gu" style="display:none;">રકમ (₹)</span></span>
                </div>

                <div class="fund-item-row">
                  <span class="fund-item-label"><span class="display-lang-en">Corpus Fund</span><span class="display-lang-gu" style="display:none;">ભંડોળ</span></span>
                  <input type="number" name="fund_corpus" class="fund-item-input fund-calc" placeholder="-" min="0">
                </div>

                <div class="fund-item-row">
                  <span class="fund-item-label"><span class="display-lang-en">Medical Fund</span><span class="display-lang-gu" style="display:none;">મેડીકલ ફંડ</span></span>
                  <input type="number" name="fund_medical" class="fund-item-input fund-calc" placeholder="-" min="0">
                </div>

                <div class="fund-item-row">
                  <span class="fund-item-label"><span class="display-lang-en">Relief Fund</span><span class="display-lang-gu" style="display:none;">રાહત ફંડ</span></span>
                  <input type="number" name="fund_relief" class="fund-item-input fund-calc" placeholder="-" min="0">
                </div>

                <div class="fund-item-row">
                  <span class="fund-item-label"><span class="display-lang-en">Permanent Food Tithi</span><span class="display-lang-gu" style="display:none;">કાયમી ભોજન તિથી</span></span>
                  <input type="number" name="fund_food_tithi" class="fund-item-input fund-calc" placeholder="-" min="0">
                </div>

                <div class="fund-item-row">
                  <span class="fund-item-label"><span class="display-lang-en">Permanent Maintenance Tithi</span><span class="display-lang-gu" style="display:none;">કાયમી નિભાવ તિથી</span></span>
                  <input type="number" name="fund_maintenance_tithi" class="fund-item-input fund-calc" placeholder="-" min="0">
                </div>

                <div class="fund-item-row">
                  <span class="fund-item-label"><span class="display-lang-en">Orthopedic Fund</span><span class="display-lang-gu" style="display:none;">ઓર્થોપેડીક ફંડ</span></span>
                  <input type="number" name="fund_orthopedic" class="fund-item-input fund-calc" placeholder="-" min="0">
                </div>

                <div class="fund-item-row">
                  <span class="fund-item-label"><span class="display-lang-en">Eye Treatment Fund</span><span class="display-lang-gu" style="display:none;">નેત્રસારવાર ફંડ</span></span>
                  <input type="number" name="fund_eye_treatment" class="fund-item-input fund-calc" placeholder="-" min="0">
                </div>

                <div class="fund-item-row">
                  <span class="fund-item-label"><span class="display-lang-en">Pilgrimage / Travel Fund</span><span class="display-lang-gu" style="display:none;">યાત્રાપ્રવાસ ફંડ</span></span>
                  <input type="number" name="fund_pilgrimage" class="fund-item-input fund-calc" placeholder="-" min="0">
                </div>

                <div class="fund-item-row">
                  <span class="fund-item-label"><span class="display-lang-en">Grain Donation Fund</span><span class="display-lang-gu" style="display:none;">ઘાનદાન ફંડ</span></span>
                  <input type="number" name="fund_grain" class="fund-item-input fund-calc" placeholder="-" min="0">
                </div>

                <div class="fund-total-row">
                  <span class="fund-total-label"><span class="display-lang-en">Total / કુલ (₹)</span><span class="display-lang-gu" style="display:none;">કુલ રકમ (₹)</span></span>
                  <input type="number" id="receipt-total-amount" name="amount" class="fund-total-input" required placeholder="0" min="1">
                </div>
                <div class="error-msg" id="err-amount" style="padding:0 8px;"></div>
              </div>

              <!-- Right Column: Donor & Payment Info -->
              <div class="receipt-donor-col">

                <!-- Donor's Name -->
                <div class="donor-form-group">
                  <label class="required"><span class="display-lang-en">Donor's Name / દાતાનું નામ</span><span class="display-lang-gu" style="display:none;">દાતાનું નામ</span></label>
                  <input type="text" name="donor_name" class="text-input" required placeholder="દાતાનું પૂરું નામ લખો / Enter donor full name">
                  <div class="error-msg" id="err-donor_name"></div>
                </div>

                <!-- Address -->
                <div class="donor-form-group">
                  <label><span class="display-lang-en">Address / સરનામું</span><span class="display-lang-gu" style="display:none;">સરનામું</span></label>
                  <input type="text" name="donor_address" class="text-input" placeholder="સરનામું લખો / Enter address">
                </div>

                <!-- City & Pincode -->
                <div class="form-row">
                  <div class="donor-form-group" style="flex:1;">
                    <label><span class="display-lang-en">Village / City / ગામ</span><span class="display-lang-gu" style="display:none;">ગામ</span></label>
                    <input type="text" name="donor_city" class="text-input" placeholder="ગામ / શહેર">
                  </div>
                  <div class="donor-form-group" style="width:140px;">
                    <label><span class="display-lang-en">Pincode / પીન</span><span class="display-lang-gu" style="display:none;">પીન</span></label>
                    <input type="text" name="donor_pincode" class="text-input" placeholder="e.g. 380001">
                  </div>
                </div>

                <!-- Telephone & Tithi -->
                <div class="form-row">
                  <div class="donor-form-group" style="flex:1;">
                    <label><span class="display-lang-en">Telephone / Mobile / ટેલી. નં.</span><span class="display-lang-gu" style="display:none;">ટેલી. નં.</span></label>
                    <input type="tel" name="donor_phone" class="text-input" placeholder="e.g. 09876543210">
                  </div>
                  <div class="donor-form-group" style="width:160px;">
                    <label><span class="display-lang-en">Tithi / તિથી</span><span class="display-lang-gu" style="display:none;">તિથી</span></label>
                    <input type="text" name="tithi" class="text-input" placeholder="તિથી લખો">
                  </div>
                </div>

                <!-- PAN Number & Email -->
                <div class="form-row">
                  <div class="donor-form-group" style="flex:1;">
                    <label><span class="display-lang-en">PAN No. / પાન નંબર</span><span class="display-lang-gu" style="display:none;">PAN No.</span></label>
                    <input type="text" name="donor_pan" class="text-input pan-input-styled" maxlength="10" placeholder="ABCDE1234F">
                  </div>
                  <div class="donor-form-group" style="flex:1;">
                    <label><span class="display-lang-en">E-mail / ઈ-મેલ</span><span class="display-lang-gu" style="display:none;">E-mail</span></label>
                    <input type="email" name="donor_email" class="text-input" placeholder="e.g. donor@example.com">
                  </div>
                </div>

                <!-- Tithi Date -->
                <div class="donor-form-group">
                  <label><span class="display-lang-en">Tithi Date (if different) / તારીખ</span><span class="display-lang-gu" style="display:none;">તારીખ (તિથી)</span></label>
                  <input type="date" name="tithi_date" class="text-input">
                </div>

                <!-- Cheque No & Bank Name -->
                <div class="form-row">
                  <div class="donor-form-group" style="width:150px;">
                    <label><span class="display-lang-en">Cheque/DD No. / ચેક નં.</span><span class="display-lang-gu" style="display:none;">ચેક નં.</span></label>
                    <input type="text" name="cheque_no" class="text-input" placeholder="e.g. 000001">
                  </div>
                  <div class="donor-form-group" style="flex:1;">
                    <label><span class="display-lang-en">Bank Name / બૅંકનું નામ</span><span class="display-lang-gu" style="display:none;">બૅંકનું નામ</span></label>
                    <input type="text" name="bank_name" class="text-input" placeholder="બૅંકનું નામ / Bank name">
                  </div>
                </div>

                <!-- Amount in Words -->
                <div class="donor-form-group">
                  <label><span class="display-lang-en">Amount in Words / અંકે રૂા.</span><span class="display-lang-gu" style="display:none;">અંકે રૂા.</span></label>
                  <input type="text" id="receipt-amount-words" name="amount_in_words" class="text-input" placeholder="Auto-calculated / આપમેળે ગણાશે">
                </div>

              </div>
            </div>

            <!-- Corpus Note -->
            <div class="receipt-corpus-note">
              <span class="display-lang-en">We gratefully acknowledge the above donation, and it will be credited to Corpus account per your wish.</span>
              <span class="display-lang-gu" style="display:none;">આપના ઉપરોક્ત દાનનો સાભાર સ્વીકાર કરીએ છીએ અને આપની ઈચ્છા મુજબ Corpus ખાતે લેવામાં આવશે.</span>
            </div>

            <!-- Signatures -->
            <div class="receipt-signatures-grid">
              <div class="receipt-sign-box">
                <label><span class="display-lang-en">Donor's Signature / દાન આપનારની સહી</span><span class="display-lang-gu" style="display:none;">દાન આપનારની સહી</span></label>
                <input type="text" name="donor_signature" class="text-input" placeholder="દાતાની સહી / Donor signature">
              </div>
              <div class="receipt-sign-box">
                <label><span class="display-lang-en">President / Hon. Secretary / Trustee / Manager</span><span class="display-lang-gu" style="display:none;">પ્રમુખ / માનદ્ મંત્રી / ટ્રસ્ટી / મેનેજર</span></label>
                <input type="text" name="manager_signature" class="text-input" placeholder="Signatory name">
              </div>
            </div>

            <!-- Footer Address -->
            <div class="receipt-footer-address">
              <span class="display-lang-en">Correspondence Address: Mital Shah, 607, Autocommerce Building, Kennedy Bridge, Nana Chowk, Mumbai - 400 007.<br>Telephone : 98206 49434 &bull; E-Mail : dinextissues@gmail.com</span>
              <span class="display-lang-gu" style="display:none;">સંસ્થા સાથેના પત્રવ્યવહારનું સરનામું : મિત્તલ શાહ, ૬૦૭, ઓટોકોમર્સ બિલ્ડિંગ, કેનેડી બ્રિજ, નાના ચોક, મુંબઈ - ૪૦૦ ૦૦૭.<br>ટેલીફોન : ૯૮૨૦૬ ૪૯૪૩૪ &bull; E-Mail : dinextissues@gmail.com</span>
            </div>

          </div>

          <div class="submit-container">
            <button type="submit" class="button-primary btn-large">
              <span class="display-lang-en">Create Donation Receipt</span>
              <span class="display-lang-gu" style="display:none;">દાન રસીદ બનાવો</span>
            </button>
          </div>
          <div id="donation-result" class="result-box" style="display:none;"></div>
        </form>
      </div>`;
    updateLangDisplay();
    setupDonationFormSubmit();
  }

  function setupDonationFormSubmit() {
    const form = document.getElementById('donation-form');
    if (!form) return;

    // Auto-sum funds logic
    const fundInputs = form.querySelectorAll('.fund-calc');
    const totalInput = document.getElementById('receipt-total-amount');
    const wordsInput = document.getElementById('receipt-amount-words');

    function calculateTotal() {
      let sum = 0;
      let hasValue = false;
      fundInputs.forEach(inp => {
        const val = parseFloat(inp.value);
        if (!isNaN(val) && val > 0) {
          sum += val;
          hasValue = true;
        }
      });
      if (hasValue && totalInput) {
        totalInput.value = sum;
        if (wordsInput && (!wordsInput.dataset.manual || wordsInput.dataset.manual === 'false')) {
          wordsInput.value = numberToWordsINR(sum);
        }
      }
    }

    fundInputs.forEach(inp => {
      inp.addEventListener('input', calculateTotal);
    });

    totalInput?.addEventListener('input', () => {
      const val = parseFloat(totalInput.value);
      if (!isNaN(val) && val > 0 && wordsInput && (!wordsInput.dataset.manual || wordsInput.dataset.manual === 'false')) {
        wordsInput.value = numberToWordsINR(val);
      }
    });

    wordsInput?.addEventListener('input', () => {
      wordsInput.dataset.manual = 'true';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const resultBox = document.getElementById('donation-result');
      resultBox.style.display = 'none';
      document.querySelectorAll('.error-msg').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });

      let valid = true;
      const donorName = form.elements['donor_name'];
      if (!donorName || !donorName.value || donorName.value.trim() === '') {
        valid = false;
        donorName.classList.add('input-error');
        const errEl = document.getElementById('err-donor_name');
        if (errEl) { errEl.textContent = 'Donor Name is required / દાતાનું નામ જરૂરી છે.'; errEl.classList.add('visible'); }
      }

      const totalVal = parseFloat(totalInput?.value || 0);
      if (isNaN(totalVal) || totalVal <= 0) {
        valid = false;
        totalInput?.classList.add('input-error');
        const errEl = document.getElementById('err-amount');
        if (errEl) { errEl.textContent = 'Enter donation amount / રકમ દાખલ કરો.'; errEl.classList.add('visible'); }
      }

      if (!valid) {
        resultBox.textContent = currentLang === 'en' ? 'Please fill required fields.' : 'કૃપા કરીને જરૂરી વિગતો ભરો.';
        resultBox.className = 'result-box error';
        resultBox.style.display = 'block';
        return;
      }

      const formData = new FormData(form);
      const payload = {};
      formData.forEach((val, key) => payload[key] = val);

      resultBox.textContent = currentLang === 'en' ? 'Submitting donation receipt...' : 'દાન રસીદ સબમિટ થઈ રહી છે...';
      resultBox.className = 'result-box info';
      resultBox.style.display = 'block';

      try {
        const res = await API('/api/donation', { method: 'POST', body: JSON.stringify(payload) });
        const data = await res.json();
        if (res.ok && data.success) {
          resultBox.textContent = (currentLang === 'en' ? 'Donation receipt created successfully!' : 'દાન રસીદ સફળતાપૂર્વક બની ગઈ!') + ` (Receipt #${data.receiptNumber})`;
          resultBox.className = 'result-box success';
          form.reset();
          form.elements['receipt_date'].value = new Date().toISOString().split('T')[0];
        } else {
          resultBox.textContent = data.message || 'Failed.';
          resultBox.className = 'result-box error';
        }
      } catch (err) {
        resultBox.textContent = 'Connection error.';
        resultBox.className = 'result-box error';
      }
    });
  }

  function numberToWordsINR(num) {
    num = parseInt(num, 10);
    if (isNaN(num) || num <= 0) return '';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
    }
    return inWords(num).trim() + ' Rupees Only';
  }

  // ============================================================
  // VIEW FORMS LIST
  // ============================================================
  async function renderFormsList() {
    try {
      const res = await API('/api/submissions');
      const data = await res.json();
      if (!data || data.length === 0) {
        contentArea.innerHTML = `<div class="records-header"><h2><span class="display-lang-en">Forms</span><span class="display-lang-gu" style="display:none;">ફોર્મ</span></h2></div><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><h3><span class="display-lang-en">No forms submitted yet</span><span class="display-lang-gu" style="display:none;">હજુ સુધી કોઈ ફોર્મ સબમિટ થયું નથી</span></h3></div>`;
        updateLangDisplay(); return;
      }
      let html = `<div class="records-header"><h2><span class="display-lang-en">Forms</span><span class="display-lang-gu" style="display:none;">ફોર્મ</span></h2><span class="records-count">${data.length} ${currentLang === 'en' ? 'records' : 'રેકોર્ડ'}</span></div>`;
      html += `<table class="records-table"><thead><tr><th>#</th><th><span class="display-lang-en">Applicant</span><span class="display-lang-gu" style="display:none;">અરજદાર</span></th><th><span class="display-lang-en">Date</span><span class="display-lang-gu" style="display:none;">તારીખ</span></th><th><span class="display-lang-en">Time</span><span class="display-lang-gu" style="display:none;">સમય</span></th><th><span class="display-lang-en">By</span><span class="display-lang-gu" style="display:none;">દ્વારા</span></th><th><span class="display-lang-en">Actions</span><span class="display-lang-gu" style="display:none;">ક્રિયાઓ</span></th></tr></thead><tbody>`;
      data.forEach((item, idx) => {
        const dt = new Date(item.submittedAt);
        html += `<tr><td>${item.applicationNumber || idx + 1}</td><td><strong>${item.full_name || 'N/A'}</strong></td><td class="record-date">${dt.toLocaleDateString('en-IN')}</td><td class="record-date">${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td><td>${item.submittedBy || '-'}</td><td class="record-actions"><button class="record-btn" onclick="window._viewForm(${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View</button><button class="record-btn" onclick="window._dlFormPDF(${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>PDF</button></td></tr>`;
      });
      html += '</tbody></table>';
      contentArea.innerHTML = html;
      updateLangDisplay();
      window._formsData = data;
      window._viewForm = (i) => showFormDetailModal(data[i]);
      window._dlFormPDF = (i) => generateAdmissionPDF(data[i]);
    } catch (err) { contentArea.innerHTML = '<p style="color:var(--color-error);">Failed to load forms.</p>'; }
  }

  // ============================================================
  // VIEW DONATIONS LIST
  // ============================================================
  async function renderDonationsList() {
    try {
      const res = await API('/api/donations');
      const data = await res.json();
      if (!data || data.length === 0) {
        contentArea.innerHTML = `<div class="records-header"><h2><span class="display-lang-en">Donation Receipts</span><span class="display-lang-gu" style="display:none;">દાન રસીદો</span></h2></div><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><h3><span class="display-lang-en">No donation receipts yet</span><span class="display-lang-gu" style="display:none;">હજુ દાન રસીદ નથી</span></h3></div>`;
        updateLangDisplay(); return;
      }
      let html = `<div class="records-header"><h2><span class="display-lang-en">Donation Receipts</span><span class="display-lang-gu" style="display:none;">દાન રસીદો</span></h2><span class="records-count">${data.length} ${currentLang === 'en' ? 'records' : 'રેકોર્ડ'}</span></div>`;
      html += `<table class="records-table"><thead><tr><th><span class="display-lang-en">Receipt #</span><span class="display-lang-gu" style="display:none;">રસીદ #</span></th><th><span class="display-lang-en">Donor</span><span class="display-lang-gu" style="display:none;">દાતા</span></th><th><span class="display-lang-en">Amount</span><span class="display-lang-gu" style="display:none;">રકમ</span></th><th><span class="display-lang-en">Date</span><span class="display-lang-gu" style="display:none;">તારીખ</span></th><th><span class="display-lang-en">Time</span><span class="display-lang-gu" style="display:none;">સમય</span></th><th><span class="display-lang-en">Actions</span><span class="display-lang-gu" style="display:none;">ક્રિયાઓ</span></th></tr></thead><tbody>`;
      data.forEach((item, idx) => {
        const dt = new Date(item.submittedAt);
        html += `<tr><td><strong>${item.receiptNumber || '-'}</strong></td><td>${item.donor_name || 'N/A'}</td><td class="record-amount">₹${Number(item.amount || 0).toLocaleString('en-IN')}</td><td class="record-date">${dt.toLocaleDateString('en-IN')}</td><td class="record-date">${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td><td class="record-actions"><button class="record-btn" onclick="window._viewDon(${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View</button><button class="record-btn" onclick="window._dlDonPDF(${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>PDF</button></td></tr>`;
      });
      html += '</tbody></table>';
      contentArea.innerHTML = html;
      updateLangDisplay();
      window._donationsData = data;
      window._viewDon = (i) => showDonationDetailModal(data[i]);
      window._dlDonPDF = (i) => generateDonationPDF(data[i]);
    } catch (err) { contentArea.innerHTML = '<p style="color:var(--color-error);">Failed to load receipts.</p>'; }
  }

  // ============================================================
  // DETAIL MODALS
  // ============================================================
  const modal = document.getElementById('detail-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const modalDownloadPDF = document.getElementById('modal-download-pdf');
  let currentModalData = null, currentModalType = null;

  modalClose?.addEventListener('click', () => modal.style.display = 'none');
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  modalDownloadPDF?.addEventListener('click', () => {
    if (currentModalType === 'form') generateAdmissionPDF(currentModalData);
    else if (currentModalType === 'donation') generateDonationPDF(currentModalData);
  });

  function showFormDetailModal(item) {
    currentModalData = item; currentModalType = 'form';
    modalTitle.textContent = `Application #${item.applicationNumber || ''} — ${item.full_name || ''}`;
    const fields = [
      { section: '1. Applicant Details / અરજદારની વિગતો' },
      { l: 'Full Name / પૂરું નામ', v: item.full_name }, { l: 'Address / સરનામું', v: item.address, full: true },
      { l: 'Phone (Home) / ફોન (ઘર)', v: item.phone_home }, { l: 'Phone (Office) / ફોન (ઓફિસ)', v: item.phone_office },
      { l: 'Age / ઉંમર', v: item.age }, { l: 'Date of Birth / જન્મ તારીખ', v: item.date_of_birth },
      { l: 'Place of Birth / જન્મ સ્થાન', v: item.place_of_birth }, { l: 'Marital Status / વૈવાહિક સ્થિતિ', v: item.marital_status },
      { l: 'Occupation / વ્યવસાય', v: item.occupation }, { l: 'Previous Occupation / પૂર્વેનો વ્યવસાય', v: item.previous_occupation },
      { l: 'Annual Income / વાર્ષિક આવક', v: item.annual_income }, { l: 'Income Source / આવકનો સ્ત્રોત', v: item.income_source },
      { l: 'Pension Details / પેન્શન', v: item.pension_details },
      { l: 'Property / સ્થાવર-જંગમ મિલકત', v: item.movable_immovable_property }, { l: 'Caste / જ્ઞાતિ અને પેટા જ્ઞાતિ', v: item.caste_subcaste },
      { l: 'Native Place / મૂળવતન', v: item.native_place }, { l: 'Previous Ashram / અગાઉ વૃદ્ધાશ્રમ રહ્યા?', v: item.previous_ashram_stay },
      { l: 'Self Introduction / પરિચય', v: item.self_introduction, full: true },

      { section: '2. Physical & Mental Condition / શારીરિક તેમજ માનસિક પરિસ્થિતિ' },
      { l: 'Height / ઊંચાઈ', v: item.height }, { l: 'Weight / વજન', v: item.weight },
      { l: 'Blood Group / બ્લડગ્રુપ', v: item.blood_group }, { l: 'Blood Pressure / બ્લડ પ્રેશર', v: item.blood_pressure },
      { l: 'Identification Mark / નિશાન', v: item.identification_mark }, { l: 'Diabetes / ડાયાબીટીસ', v: item.diabetes },
      { l: 'Chronic Illness / કાયમી બિમારી', v: item.chronic_illness }, { l: 'Serious Illness / ગંભીર બિમારી', v: item.serious_illness },
      { l: 'Operations / કોઈ ઓપરેશન', v: item.any_operation }, { l: 'Cataract/Eye Op / મોતીયા કે અન્ય ઓપરેશન', v: item.cataract_or_other_operation },
      { l: 'Teeth / દાંત', v: item.teeth }, { l: 'Doctor Health Cert', v: 'Certificate required at admission' },
      { l: 'Regular Medication / કાયમી દવા', v: item.regular_medication, full: true },

      { section: '3. Family Situation / કૌટુંબિક પરિસ્થિતિ' },
      { l: 'Spouse Name / પતિ-પત્ની નામ', v: item.spouse_name }, { l: 'Spouse Age / ઉંમર', v: item.spouse_age },
      { l: 'Spouse Occupation / વ્યવસાય', v: item.spouse_occupation }, { l: 'Spouse Income / આવક', v: item.spouse_income },
      { l: 'Spouse Contact / સંપર્ક', v: item.spouse_contact, full: true },

      { section: '4. Nominee Details / નોમીનીની વિગત' },
      { l: 'Nominee Name / નામ', v: item.nominee_name }, { l: 'Relation / સંબંધ', v: item.nominee_relation },
      { l: 'Phone / ફોન', v: item.nominee_phone }, { l: 'Nominee Address / સરનામું', v: item.nominee_address, full: true },
      { l: 'Nominee Date / તારીખ', v: item.nominee_date }, { l: 'Applicant Signature / સહી', v: item.applicant_signature },

      { section: '5. Emergency Contact & Declaration / જવાબદાર વ્યક્તિ અને ઘોષણા' },
      { l: 'Responsible Person / નામ', v: item.responsible_person_name }, { l: 'Relation / સંબંધ', v: item.responsible_person_relation },
      { l: 'Address / સરનામું', v: item.responsible_person_address, full: true },
      { l: 'Mobile / મો.', v: item.responsible_person_phone }, { l: 'Landline / ટેલીફોન', v: item.responsible_person_landline },
      { l: 'Declaration Signed By', v: item.responsible_person_signature }, { l: 'Declaration Date', v: item.responsible_date },

      { section: '6. Ashram Rules & Regulations / આશ્રમના નીતિ નિયમો' },
      { l: 'Rules Acknowledgement', v: item.rules_read_acknowledgement ? 'Agreed & Accepted (હા - નિયમો વાંચ્યા અને સ્વીકાર્યા)' : 'Not checked' },
      { l: 'Ack Signature / સહી', v: item.person_signature }, { l: 'Ack Date / તારીખ', v: item.ack_date },

      { section: '7. Office Use / નિયામકશ્રીની મંજૂરી' },
      { l: 'Admission Date / દાખલ તારીખ', v: item.office_admission_date || 'Pending' },
      { l: 'Monthly Charge / માસિક ચાર્જ', v: item.office_monthly_charge ? `₹${item.office_monthly_charge}` : 'Pending' },
      { l: 'Director Signature / સહી', v: item.office_director_signature ? '__SIGNATURE_IMAGE__' : 'Pending', isSignature: true, signaturePath: item.office_director_signature },

      { section: 'Submission Information / સબમિશન માહિતી' },
      { l: 'Submitted By / દ્વારા', v: item.submittedBy }, { l: 'Submitted At / સમય', v: new Date(item.submittedAt).toLocaleString('en-IN') },
    ];

    let html = '<div class="detail-grid">';
    fields.forEach(f => {
      if (f.section) { html += `<div class="detail-section-title">${f.section}</div>`; return; }
      if (f.isSignature && f.signaturePath) {
        const imgUrl = window.getAssetUrl ? window.getAssetUrl(f.signaturePath) : f.signaturePath;
        html += `<div class="detail-item detail-full"><div class="detail-label">${f.l}</div><div class="detail-value"><img src="${imgUrl}" alt="Director Signature" style="max-width:200px;max-height:100px;border:1px solid var(--color-hairline);border-radius:6px;padding:4px;background:#fff;"></div></div>`;
        return;
      }
      html += `<div class="detail-item${f.full ? ' detail-full' : ''}"><div class="detail-label">${f.l}</div><div class="detail-value">${f.v || '—'}</div></div>`;
    });

    // If children rows exist
    if (item.children_rows && Array.isArray(item.children_rows) && item.children_rows.some(c => c.child_name)) {
      html += '<div class="detail-section-title">Children Details / પુત્ર-પુત્રીની વિગતો</div>';
      html += '<div class="detail-full"><table class="records-table" style="margin:0;font-size:12px;"><thead><tr><th>#</th><th>Name</th><th>Age</th><th>Occupation</th><th>Income</th><th>Contact</th></tr></thead><tbody>';
      item.children_rows.forEach((c, idx) => {
        if (c.child_name || c.occupation || c.age) {
          html += `<tr><td>${idx+1}</td><td>${c.child_name||'-'}</td><td>${c.age||'-'}</td><td>${c.occupation||'-'}</td><td>${c.annual_income||'-'}</td><td>${c.contact||'-'}</td></tr>`;
        }
      });
      html += '</tbody></table></div>';
    }

    // If extra nominees exist
    if (item.extra_nominees && Array.isArray(item.extra_nominees) && item.extra_nominees.length > 0) {
      html += '<div class="detail-section-title">Additional Nominees / વધારાના નોમીની</div>';
      item.extra_nominees.forEach((n, idx) => {
        html += `<div class="detail-item"><div class="detail-label">Nominee ${idx+2}</div><div class="detail-value">${n.name||'—'} (${n.relation||'—'})</div></div>`;
        html += `<div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${n.phone||'—'}</div></div>`;
        if (n.address) html += `<div class="detail-item detail-full"><div class="detail-label">Address</div><div class="detail-value">${n.address}</div></div>`;
      });
    }

    // Admin: add editable office-use section
    if (userRole === 'admin') {
      html += `<div class="detail-section-title" style="margin-top:16px;">✏️ Edit Office Use Fields (Admin) / ઓફિસ ઉપયોગ સુધારો</div>`;
      html += `<div class="detail-full" style="padding:16px;background:var(--color-primary-soft);border-radius:10px;margin-bottom:12px;">`;
      html += `<div class="form-row-3" style="gap:12px;">`;
      html += `<div class="form-group"><label>Admission Date</label><input type="date" id="modal-office-date" class="text-input" value="${item.office_admission_date || ''}"></div>`;
      html += `<div class="form-group"><label>Monthly Charge (₹)</label><input type="number" id="modal-office-charge" class="text-input" value="${item.office_monthly_charge || ''}" min="0" placeholder="Enter amount"></div>`;
      html += `<div class="form-group"><label>Director Signature</label>`;
      html += `<div class="signature-upload-area">`;
      if (item.office_director_signature) {
        const sigUrl = window.getAssetUrl ? window.getAssetUrl(item.office_director_signature) : item.office_director_signature;
        html += `<div class="signature-preview" id="modal-sig-preview" style="display:flex;"><img id="modal-sig-img" src="${sigUrl}" alt="Signature"><button type="button" class="signature-remove-btn" id="modal-remove-sig" title="Remove">&times;</button></div>`;
        html += `<label class="signature-upload-btn" id="modal-sig-upload-label" style="display:none;">`;
      } else {
        html += `<div class="signature-preview" id="modal-sig-preview" style="display:none;"><img id="modal-sig-img" src="" alt="Signature"><button type="button" class="signature-remove-btn" id="modal-remove-sig" title="Remove">&times;</button></div>`;
        html += `<label class="signature-upload-btn" id="modal-sig-upload-label">`;
      }
      html += `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
      html += `Upload Signature<input type="file" id="modal-sig-file" accept="image/*" style="display:none;"></label>`;
      html += `<input type="hidden" id="modal-sig-path" value="${item.office_director_signature || ''}">`;
      html += `</div></div></div>`;
      html += `<button id="modal-save-office" class="button-primary" style="margin-top:12px;width:100%;">💾 Save Office Use Fields / ઓફિસ વિગત સેવ કરો</button>`;
      html += `<div id="modal-office-msg" class="settings-msg" style="margin-top:8px;"></div>`;
      html += `</div>`;
    }

    html += '</div>';
    modalBody.innerHTML = html;
    modal.style.display = 'flex';

    // Setup admin office-use edit handlers
    if (userRole === 'admin') {
      // Signature upload in modal
      const modalSigFile = document.getElementById('modal-sig-file');
      const modalSigPreview = document.getElementById('modal-sig-preview');
      const modalSigImg = document.getElementById('modal-sig-img');
      const modalSigPath = document.getElementById('modal-sig-path');
      const modalSigUploadLabel = document.getElementById('modal-sig-upload-label');
      const modalRemoveSig = document.getElementById('modal-remove-sig');

      modalSigFile?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (modalSigImg) modalSigImg.src = ev.target.result;
          if (modalSigPreview) modalSigPreview.style.display = 'flex';
          if (modalSigUploadLabel) modalSigUploadLabel.style.display = 'none';
        };
        reader.readAsDataURL(file);

        const fd = new FormData();
        fd.append('signature', file);
        try {
          const sigUrl = window.getApiUrl ? window.getApiUrl('/api/upload-signature') : '/api/upload-signature';
          const res = await fetch(sigUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
          const data = await res.json();
          if (data.success && modalSigPath) modalSigPath.value = data.signaturePath;
        } catch (err) { console.error('Signature upload error:', err); }
      });

      modalRemoveSig?.addEventListener('click', () => {
        if (modalSigPreview) modalSigPreview.style.display = 'none';
        if (modalSigUploadLabel) modalSigUploadLabel.style.display = 'flex';
        if (modalSigPath) modalSigPath.value = '';
        if (modalSigImg) modalSigImg.src = '';
      });

      // Save button
      document.getElementById('modal-save-office')?.addEventListener('click', async () => {
        const msgEl = document.getElementById('modal-office-msg');
        const dateVal = document.getElementById('modal-office-date')?.value || '';
        const chargeVal = document.getElementById('modal-office-charge')?.value || '';
        const sigVal = document.getElementById('modal-sig-path')?.value || '';

        try {
          const res = await API(`/api/submissions/${encodeURIComponent(item.id)}/office`, {
            method: 'PUT',
            body: JSON.stringify({
              office_admission_date: dateVal,
              office_monthly_charge: chargeVal,
              office_director_signature: sigVal
            })
          });
          const data = await res.json();
          if (data.success) {
            msgEl.textContent = '✅ Saved successfully!';
            msgEl.className = 'settings-msg success';
            // Update local data
            item.office_admission_date = dateVal;
            item.office_monthly_charge = chargeVal;
            item.office_director_signature = sigVal;
          } else {
            msgEl.textContent = data.message || 'Failed to save.';
            msgEl.className = 'settings-msg error';
          }
        } catch (err) {
          msgEl.textContent = 'Connection error.';
          msgEl.className = 'settings-msg error';
        }
        setTimeout(() => { if (msgEl) msgEl.className = 'settings-msg'; }, 3000);
      });
    }
  }

  function showDonationDetailModal(item) {
    currentModalData = item; currentModalType = 'donation';
    modalTitle.textContent = `Donation Receipt #${item.receiptNumber || ''} — ${item.donor_name || ''}`;
    
    // Check which funds have values
    const fundsList = [
      { l: 'Corpus Fund / ભંડોળ', v: item.fund_corpus },
      { l: 'Medical Fund / મેડીકલ ફંડ', v: item.fund_medical },
      { l: 'Relief Fund / રાહત ફંડ', v: item.fund_relief },
      { l: 'Permanent Food Tithi / કાયમી ભોજન તિથી', v: item.fund_food_tithi },
      { l: 'Permanent Maintenance Tithi / કાયમી નિભાવ તિથી', v: item.fund_maintenance_tithi },
      { l: 'Orthopedic Fund / ઓર્થોપેડીક ફંડ', v: item.fund_orthopedic },
      { l: 'Eye Treatment Fund / નેત્રસારવાર ફંડ', v: item.fund_eye_treatment },
      { l: 'Pilgrimage Fund / યાત્રાપ્રવાસ ફંડ', v: item.fund_pilgrimage },
      { l: 'Grain Fund / ઘાનદાન ફંડ', v: item.fund_grain },
    ];

    const fields = [
      { section: 'Receipt Information / પહોંચ વિગત' },
      { l: 'Receipt Number / રસીદ #', v: `${item.receipt_type || 'B/D'} ${item.receiptNumber || '-'}` },
      { l: 'Receipt Date / તારીખ', v: item.receipt_date },
      { l: 'Total Amount / કુલ રકમ (₹)', v: `₹${Number(item.amount || 0).toLocaleString('en-IN')}` },
      { l: 'Amount in Words / અંકે રૂા.', v: item.amount_in_words || '—', full: true },

      { section: 'Donor Details / દાતાની વિગત' },
      { l: "Donor's Name / દાતાનું નામ", v: item.donor_name },
      { l: 'Telephone / ટેલી. નં.', v: item.donor_phone },
      { l: 'Address / સરનામું', v: item.donor_address, full: true },
      { l: 'Village / City / ગામ', v: item.donor_city },
      { l: 'Pincode / પીન', v: item.donor_pincode },
      { l: 'Tithi / તિથી', v: item.tithi },
      { l: 'Tithi Date / તારીખ', v: item.tithi_date },
      { l: 'PAN Number / પાન', v: item.donor_pan },
      { l: 'E-mail / ઈ-મેલ', v: item.donor_email },

      { section: 'Bank / Payment Details / બૅંક અને ચુકવણી' },
      { l: 'Cheque/DD No. / ચેક નં.', v: item.cheque_no || item.cheque_dd_no },
      { l: 'Bank Name / બૅંકનું નામ', v: item.bank_name },

      { section: 'Signatures / સહીઓ' },
      { l: "Donor's Signature / દાતા સહી", v: item.donor_signature || item.donor_name },
      { l: 'Authorized Signatory / અધિકારી સહી', v: item.manager_signature || 'Management' },

      { section: 'Submission Information / સબમિશન' },
      { l: 'Submitted By / દ્વારા', v: item.submittedBy },
      { l: 'Submitted At / સમય', v: new Date(item.submittedAt).toLocaleString('en-IN') },
    ];

    let html = '<div class="detail-grid">';
    
    // Add Fund Breakdown section first
    html += '<div class="detail-section-title">Fund Breakdown / ફંડ વિગત</div>';
    html += '<div class="detail-full"><table class="records-table" style="margin:0;font-size:12.5px;"><thead><tr><th>Fund Category / ફંડ</th><th style="text-align:right;">Amount / રકમ (₹)</th></tr></thead><tbody>';
    let anyFund = false;
    fundsList.forEach(f => {
      if (f.v && parseFloat(f.v) > 0) {
        anyFund = true;
        html += `<tr><td><strong>${f.l}</strong></td><td style="text-align:right;">₹${Number(f.v).toLocaleString('en-IN')}</td></tr>`;
      }
    });
    if (!anyFund) {
      html += `<tr><td>General Donation / સામાન્ય દાન</td><td style="text-align:right;">₹${Number(item.amount || 0).toLocaleString('en-IN')}</td></tr>`;
    }
    html += `<tr style="background:var(--color-primary-soft);font-weight:700;"><td>Total / કુલ</td><td style="text-align:right;color:var(--color-primary-dark);">₹${Number(item.amount || 0).toLocaleString('en-IN')}</td></tr>`;
    html += '</tbody></table></div>';

    fields.forEach(f => {
      if (f.section) { html += `<div class="detail-section-title">${f.section}</div>`; return; }
      html += `<div class="detail-item${f.full ? ' detail-full' : ''}"><div class="detail-label">${f.l}</div><div class="detail-value">${f.v || '—'}</div></div>`;
    });

    html += '<div class="detail-full receipt-corpus-note" style="margin-top:12px;">આપના ઉપરોક્ત દાનનો સાભાર સ્વીકાર કરીએ છીએ અને આપની ઈચ્છા મુજબ Corpus ખાતે લેવામાં આવશે.</div>';
    html += '</div>';

    modalBody.innerHTML = html;
    modal.style.display = 'flex';
  }

  // ============================================================
  // SETTINGS VIEW
  // ============================================================
  function renderSettings() {
    contentArea.innerHTML = `
      <div class="settings-grid">
        <div class="settings-card">
          <h3><span class="display-lang-en">Profile</span><span class="display-lang-gu" style="display:none;">પ્રોફાઈલ</span></h3>
          <div class="profile-photo-section">
            <div class="profile-photo-preview" id="settings-photo-preview">
              ${userData.profilePhoto ? `<img src="${userData.profilePhoto}" alt="Profile">` : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}
            </div>
            <div>
              <p style="font-size:14px;font-weight:600;color:var(--color-ink);margin-bottom:4px;">${userData.username?.charAt(0).toUpperCase() + userData.username?.slice(1)}</p>
              <p style="font-size:12px;color:var(--color-muted);margin-bottom:8px;">${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
              <label class="button-secondary" style="cursor:pointer;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span class="display-lang-en">Upload Photo</span><span class="display-lang-gu" style="display:none;">ફોટો અપલોડ</span>
                <input type="file" id="photo-upload" accept="image/*" style="display:none;">
              </label>
            </div>
          </div>
          <div class="form-group"><label><span class="display-lang-en">Phone Number</span><span class="display-lang-gu" style="display:none;">ફોન નંબર</span></label><input type="tel" id="settings-phone" class="text-input" value="${userData.phone || ''}" placeholder="Your phone number"></div>
          <button id="save-profile-btn" class="button-primary"><span class="display-lang-en">Save Profile</span><span class="display-lang-gu" style="display:none;">પ્રોફાઈલ સેવ કરો</span></button>
          <div id="profile-msg" class="settings-msg"></div>
        </div>
        <div class="settings-card">
          <h3><span class="display-lang-en">Change Password</span><span class="display-lang-gu" style="display:none;">પાસવર્ડ બદલો</span></h3>
          <div class="form-group"><label><span class="display-lang-en">Old Password</span><span class="display-lang-gu" style="display:none;">જૂનો પાસવર્ડ</span></label><input type="password" id="old-password" class="text-input" placeholder="Enter old password"></div>
          <div class="form-group"><label><span class="display-lang-en">New Password</span><span class="display-lang-gu" style="display:none;">નવો પાસવર્ડ</span></label><input type="password" id="new-password" class="text-input" placeholder="Min 6 characters"></div>
          <div class="form-group"><label><span class="display-lang-en">Confirm New Password</span><span class="display-lang-gu" style="display:none;">નવો પાસવર્ડ ખાતરી</span></label><input type="password" id="confirm-password" class="text-input" placeholder="Retype new password"></div>
          <button id="change-pwd-btn" class="button-primary"><span class="display-lang-en">Change Password</span><span class="display-lang-gu" style="display:none;">પાસવર્ડ બદલો</span></button>
          <div id="pwd-msg" class="settings-msg"></div>
        </div>
        <div class="settings-card" style="grid-column: 1 / -1;">
          <h3><span class="display-lang-en">Theme</span><span class="display-lang-gu" style="display:none;">થીમ</span></h3>
          <div class="theme-options">
            <div class="theme-option ${currentTheme === 'light' ? 'active' : ''}" data-theme-val="light">
              <div class="theme-preview"><div class="theme-preview-light"></div></div>
              <p class="theme-option-label"><span class="display-lang-en">Light</span><span class="display-lang-gu" style="display:none;">લાઇટ</span></p>
            </div>
            <div class="theme-option ${currentTheme === 'dark' ? 'active' : ''}" data-theme-val="dark">
              <div class="theme-preview"><div class="theme-preview-dark"></div></div>
              <p class="theme-option-label"><span class="display-lang-en">Dark</span><span class="display-lang-gu" style="display:none;">ડાર્ક</span></p>
            </div>
          </div>
        </div>
      </div>`;
    updateLangDisplay();
    setupSettingsHandlers();
  }

  function setupSettingsHandlers() {
    document.getElementById('photo-upload')?.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const fd = new FormData(); fd.append('photo', file);
      try {
        const photoUrl = window.getApiUrl ? window.getApiUrl('/api/profile/photo') : '/api/profile/photo';
        const res = await fetch(photoUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
        const data = await res.json();
        if (data.success) {
          userData.profilePhoto = data.profilePhoto;
          localStorage.setItem('user_data', JSON.stringify(userData));
          const imgUrl = window.getAssetUrl ? window.getAssetUrl(data.profilePhoto) : data.profilePhoto;
          document.getElementById('settings-photo-preview').innerHTML = `<img src="${imgUrl}" alt="Profile">`;
          document.getElementById('user-avatar').innerHTML = `<img src="${imgUrl}" alt="Profile">`;
        }
      } catch (err) { console.error(err); }
    });

    document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
      const phone = document.getElementById('settings-phone')?.value || '';
      const msgEl = document.getElementById('profile-msg');
      try {
        const res = await API('/api/profile', { method: 'PUT', body: JSON.stringify({ phone }) });
        const data = await res.json();
        msgEl.textContent = data.success ? (currentLang === 'en' ? 'Profile saved!' : 'પ્રોફાઈલ સેવ થઈ!') : data.message;
        msgEl.className = `settings-msg ${data.success ? 'success' : 'error'}`;
        if (data.success) { userData.phone = phone; localStorage.setItem('user_data', JSON.stringify(userData)); }
      } catch (err) { msgEl.textContent = 'Error.'; msgEl.className = 'settings-msg error'; }
      setTimeout(() => { msgEl.className = 'settings-msg'; }, 3000);
    });

    document.getElementById('change-pwd-btn')?.addEventListener('click', async () => {
      const oldPwd = document.getElementById('old-password')?.value;
      const newPwd = document.getElementById('new-password')?.value;
      const confirmPwd = document.getElementById('confirm-password')?.value;
      const msgEl = document.getElementById('pwd-msg');
      if (!oldPwd || !newPwd || !confirmPwd) { msgEl.textContent = 'Fill all fields.'; msgEl.className = 'settings-msg error'; return; }
      if (newPwd !== confirmPwd) { msgEl.textContent = 'Passwords do not match.'; msgEl.className = 'settings-msg error'; return; }
      if (newPwd.length < 6) { msgEl.textContent = 'Min 6 characters.'; msgEl.className = 'settings-msg error'; return; }
      try {
        const res = await API('/api/change-password', { method: 'PUT', body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }) });
        const data = await res.json();
        msgEl.textContent = data.success ? (currentLang === 'en' ? 'Password changed!' : 'પાસવર્ડ બદલાયો!') : data.message;
        msgEl.className = `settings-msg ${data.success ? 'success' : 'error'}`;
        if (data.success) { document.getElementById('old-password').value = ''; document.getElementById('new-password').value = ''; document.getElementById('confirm-password').value = ''; }
      } catch (err) { msgEl.textContent = 'Error.'; msgEl.className = 'settings-msg error'; }
      setTimeout(() => { msgEl.className = 'settings-msg'; }, 3000);
    });

    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        currentTheme = opt.dataset.themeVal;
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('app_theme', currentTheme);
        updateThemeIcons();
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      });
    });
  }

  // ============================================================
  // PDF GENERATION — Admission Form
  // ============================================================
  function generateAdmissionPDF(item) {
    if (!window.jspdf) {
      alert('PDF library is still loading. Please try again in a few seconds.');
      return;
    }
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const W = 210, margin = 15, pw = W - 2 * margin;
      let y = 15;

      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('Shantilal Mohanlal Ashaktashram Society', W / 2, y, { align: 'center' });
      y += 6;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Ganesh Tekri, Dakor - 388 225 | Phone: 91-(2696) 244918', W / 2, y, { align: 'center' });
      y += 8;
      doc.setDrawColor(204, 120, 92); doc.setLineWidth(0.8);
      doc.line(margin, y, W - margin, y); y += 6;
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('ADMISSION APPLICATION FORM', W / 2, y, { align: 'center' }); y += 8;

      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Application #: ${item.applicationNumber || '-'}`, margin, y);
      doc.text(`Date: ${item.application_date || new Date(item.submittedAt).toLocaleDateString('en-IN')}`, W - margin, y, { align: 'right' });
      y += 8;

      function addSection(title) {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.setFillColor(245, 240, 232); doc.rect(margin, y - 4, pw, 8, 'F');
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 19);
        doc.text(title, margin + 3, y + 1); y += 10;
        doc.setTextColor(61, 61, 58); doc.setFont('helvetica', 'normal');
      }

      function addField(label, value) {
        if (y > 275) { doc.addPage(); y = 15; }
        doc.setFontSize(8); doc.setTextColor(108, 106, 100); doc.text(label, margin, y); y += 4;
        doc.setFontSize(10); doc.setTextColor(20, 20, 19);
        const lines = doc.splitTextToSize(String(value || '—'), pw);
        doc.text(lines, margin, y); y += lines.length * 4.5 + 3;
      }

      function addFieldRow(l1, v1, l2, v2) {
        if (y > 270) { doc.addPage(); y = 15; }
        const savedY = y;
        doc.setFontSize(8); doc.setTextColor(108, 106, 100); doc.text(l1, margin, y);
        doc.setFontSize(10); doc.setTextColor(20, 20, 19); doc.text(String(v1 || '—'), margin, y + 4);
        doc.setFontSize(8); doc.setTextColor(108, 106, 100); doc.text(l2, margin + pw / 2 + 2, savedY);
        doc.setFontSize(10); doc.setTextColor(20, 20, 19); doc.text(String(v2 || '—'), margin + pw / 2 + 2, savedY + 4);
        y = savedY + 11;
      }

      addSection('1. Applicant Details');
      addField('Full Name', item.full_name);
      addField('Address', item.address);
      addFieldRow('Phone (Home)', item.phone_home, 'Phone (Office)', item.phone_office);
      addFieldRow('Age', item.age, 'Date of Birth', item.date_of_birth);
      addFieldRow('Place of Birth', item.place_of_birth, 'Marital Status', item.marital_status);
      addFieldRow('Current Occupation', item.occupation, 'Previous Occupation', item.previous_occupation);
      addFieldRow('Annual Income', item.annual_income ? `Rs. ${item.annual_income}` : '—', 'Source of Income', item.income_source);
      addFieldRow('Pension Details', item.pension_details, 'Room Preference', item.room_number);
      addFieldRow('Property (Sthavar-Jangam)', item.movable_immovable_property, 'Caste (Gnyati & Peta)', item.caste_subcaste);
      addFieldRow('Native Place', item.native_place, 'Previous Ashram Stay', item.previous_ashram_stay);
      if (item.self_introduction) addField('Self Introduction', item.self_introduction);

      addSection('2. Physical & Mental Condition');
      addFieldRow('Height', item.height, 'Weight', item.weight);
      addFieldRow('Blood Group', item.blood_group, 'Blood Pressure', item.blood_pressure);
      addFieldRow('Identification Mark', item.identification_mark, 'Diabetes', item.diabetes);
      addFieldRow('Chronic Illness', item.chronic_illness, 'Serious Illness', item.serious_illness);
      addFieldRow('Surgeries/Operations', item.any_operation, 'Cataract / Eye Operation', item.cataract_or_other_operation);
      addFieldRow('Teeth Condition', item.teeth, 'Doctor Certificate', 'Submitted / Required at admission');
      if (item.regular_medication) addField('Regular Medication', item.regular_medication);

      addSection('3. Family Situation');
      if (item.children_rows && Array.isArray(item.children_rows) && item.children_rows.some(c => c.child_name)) {
        if (y > 255) { doc.addPage(); y = 15; }
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
        doc.text('Children Details (Son / Daughter):', margin, y); y += 4;
        
        // Table header
        doc.setFillColor(235, 230, 222);
        doc.rect(margin, y - 3, pw, 6, 'F');
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 19);
        doc.text('Name', margin + 2, y + 1);
        doc.text('Age', margin + 50, y + 1);
        doc.text('Occupation', margin + 65, y + 1);
        doc.text('Annual Income', margin + 105, y + 1);
        doc.text('Residence / Contact', margin + 140, y + 1);
        y += 6;

        doc.setFont('helvetica', 'normal');
        item.children_rows.forEach(c => {
          if (c.child_name || c.age || c.occupation) {
            if (y > 275) { doc.addPage(); y = 15; }
            doc.setFontSize(8); doc.setTextColor(40, 40, 40);
            doc.text(String(c.child_name || '—'), margin + 2, y);
            doc.text(String(c.age || '—'), margin + 50, y);
            doc.text(String(c.occupation || '—'), margin + 65, y);
            doc.text(String(c.annual_income || '—'), margin + 105, y);
            doc.text(String(c.contact || '—'), margin + 140, y);
            doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.2);
            doc.line(margin, y + 2, margin + pw, y + 2);
            y += 6;
          }
        });
        y += 2;
      }
      addFieldRow('Spouse Name', item.spouse_name, 'Spouse Age', item.spouse_age);
      addFieldRow('Spouse Occupation', item.spouse_occupation, 'Spouse Annual Income', item.spouse_income);
      if (item.spouse_contact) addField('Spouse Residence & Contact', item.spouse_contact);

      addSection('4. Nominee Details');
      addFieldRow('Nominee Name', item.nominee_name, 'Relation to Applicant', item.nominee_relation);
      addFieldRow('Nominee Phone', item.nominee_phone, 'Nominee Date', item.nominee_date);
      if (item.nominee_address) addField('Nominee Address', item.nominee_address);
      if (item.applicant_signature) addField("Applicant's Consent/Signature", item.applicant_signature);

      if (item.extra_nominees && Array.isArray(item.extra_nominees) && item.extra_nominees.length > 0) {
        item.extra_nominees.forEach((n, idx) => {
          addFieldRow(`Nominee ${idx + 2} Name`, n.name, 'Relation', n.relation);
          addFieldRow('Phone', n.phone, 'Address', n.address);
        });
      }

      addSection('5. Responsible Person & Declaration (Emergency / Illness)');
      addFieldRow('Responsible Person', item.responsible_person_name, 'Relation to Applicant', item.responsible_person_relation);
      addFieldRow('Mobile Phone', item.responsible_person_phone, 'Landline', item.responsible_person_landline);
      addField('Address', item.responsible_person_address);

      // Declaration box
      if (y > 240) { doc.addPage(); y = 15; }
      doc.setFillColor(250, 248, 244); doc.rect(margin, y - 2, pw, 32, 'F');
      doc.setDrawColor(204, 120, 92); doc.setLineWidth(0.4); doc.rect(margin, y - 2, pw, 32, 'S');
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 80, 50);
      doc.text('DECLARATION / UNDERTAKING BY RESPONSIBLE PERSON', margin + 4, y + 3);
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
      const decText = `The applicant "${item.full_name || 'Applicant'}" is my "${item.responsible_person_relation || 'Relative'}". They wish to enter the ashram of their own free will and have been informed of all ashram policies. I bind myself to take them back whenever notified by the Trustees/Director. In the event of their passing away during their stay at the ashram, if I am unable to be present, I authorize the ashram Trustees to conduct the last rites. I also bind myself to pay the monthly contribution determined by the ashram within the first week of every month.`;
      const decLines = doc.splitTextToSize(decText, pw - 8);
      doc.text(decLines, margin + 4, y + 8);
      y += 36;
      addFieldRow('Responsible Person Signature', item.responsible_person_signature || item.responsible_person_name, 'Date', item.responsible_date || '-');

      addSection('6. Ashram Rules & Regulations');
      if (y > 230) { doc.addPage(); y = 15; }
      doc.setFillColor(248, 249, 250); doc.rect(margin, y - 2, pw, 40, 'F');
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3); doc.rect(margin, y - 2, pw, 40, 'S');
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 19);
      doc.text('Key Ashram Regulations Summary (All 13 Rules Accepted):', margin + 3, y + 3);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
      const rulesSummary = [
        '1. Deposit, admission fee & monthly fee with form + 3 photos of elderly + 1 photo of responsible person.',
        '2. Initial admission is on a temporary basis for 1 month.',
        '3. Monthly maintenance fee payable before the 10th of every month.',
        '4. No admission for infectious disease, substance addiction, mental instability or severe disorder.',
        '5. Punctual attendance for daily prayers, meals and tea required. Permission needed for leaving premises.',
        '6. Proper care of ashram property mandatory. Unruly behavior or harm will result in immediate discharge.',
        '7. No personal electric appliances permitted. Avoid water & electricity waste. Maintain cleanliness.',
        '8. Essentials (bedding, blanket, utensils) provided. Personal medicines and needs arranged by resident.',
        '9. Management/Trustee reserves right to ask resident to vacate without assigning reasons.',
        '10. 15 days advance notice required for refund of deposit upon leaving.',
        '11. Ration card & Aadhaar photocopy of applicant and Aadhaar copy of responsible person must be attached.',
        '12. Residents expected to perform assigned light duties sincerely according to capability.',
        '13. Final admission confirmed strictly upon Medical Fitness Certificate from Ashram Doctor.'
      ];
      let ry = y + 7;
      rulesSummary.slice(0, 7).forEach(r => { doc.text(r, margin + 3, ry); ry += 3.8; });
      let ry2 = y + 7;
      rulesSummary.slice(7).forEach(r => { doc.text(r, margin + pw / 2 + 2, ry2); ry2 += 3.8; });
      y += 44;

      addFieldRow('Rules Acknowledgement', item.rules_read_acknowledgement ? 'Accepted & Agreed' : 'Yes', 'Acknowledged By / Signature', item.person_signature || item.full_name);
      addField('Acknowledgement Date', item.ack_date || '-');

      addSection('7. For Office Use — Director\'s Approval & Signature');
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFillColor(250, 250, 250); doc.rect(margin, y - 2, pw, 20, 'F');
      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.rect(margin, y - 2, pw, 20, 'S');
      doc.setFontSize(8); doc.setTextColor(40, 40, 40);
      doc.text(`Shri/Smt. ${item.full_name || '____________________'} is admitted from Date: ${item.office_admission_date || '________________'}`, margin + 4, y + 4);
      doc.text(`Monthly charge Rs. ${item.office_monthly_charge || '________'}/- guaranteed by Shri: ${item.responsible_person_name || '____________________'}`, margin + 4, y + 10);
      if (item.office_director_signature) {
        doc.text('Director / Trustee Signature: [Signature Uploaded — See Attached]', margin + 4, y + 16);
      } else {
        doc.text('Director / Trustee Signature: _______________________      Date: ____________', margin + 4, y + 16);
      }
      y += 26;

      addSection('Submission Records');
      addFieldRow('Submitted By', item.submittedBy, 'Submitted At', new Date(item.submittedAt).toLocaleString('en-IN'));

      doc.save(`Admission_Form_${item.applicationNumber || 'NA'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Error: ' + err.message);
    }
  }

  // ============================================================
  // PDF GENERATION — Donation Receipt (Exact Visual Match)
  // ============================================================
  function generateDonationPDF(item) {
    if (!window.jspdf) {
      alert('PDF library is still loading. Please try again in a few seconds.');
      return;
    }
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const margin = 12;
      const boxW = 186;

      // Outer border of the receipt slip
      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(0.6);
      doc.rect(margin, 12, boxW, 160);

      // 80-G Tax Exemption Header
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('Income Tax Exemption under Section 80-G Registration No. AAATL0845LF20212 VALID UPTO A. Y. 2026-27', 105, 17, { align: 'center' });
      doc.text('Under Section 80-G (5) by the Commissioner of Income Tax Gujarat III Ahmedabad', 105, 21, { align: 'center' });

      // Trust Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 15, 15);
      doc.text('Shantilal Mohanlal Shah Ashaktashram Society', 105, 27, { align: 'center' });

      // Reg No & Address (Left of header)
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text('Registration No. F-812 (Ahmedabad)   |   PAN : AAATL 0845L', 16, 33);
      doc.text('Near Ganesh Talkies, Dakor-388 225. Phone: 95-(2696) 244218', 16, 37.5);

      // Receipt No & Date Box (Top Right)
      const rBoxX = 136, rBoxY = 29, rBoxW = 62, rBoxH = 12;
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.4);
      doc.rect(rBoxX, rBoxY, rBoxW, rBoxH);
      doc.line(rBoxX, rBoxY + 6, rBoxX + rBoxW, rBoxY + 6);
      doc.line(rBoxX + 25, rBoxY, rBoxX + 25, rBoxY + rBoxH);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Receipt No. :', rBoxX + 2, rBoxY + 4.2);
      doc.text('Date :', rBoxX + 2, rBoxY + 10.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 50, 30);
      doc.text(`${item.receipt_type || 'B/D'} ${item.receiptNumber || '-'}`, rBoxX + 27, rBoxY + 4.2);
      doc.setTextColor(15, 15, 15);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.receipt_date || '-'), rBoxX + 27, rBoxY + 10.2);

      // Main Table Grid (x=12, y=43, w=186, h=72)
      const tblY = 43;
      const tblH = 72;
      const splitX = 64; // Left column: 52mm wide, Right column: 134mm wide
      doc.rect(margin, tblY, boxW, tblH);
      doc.line(splitX, tblY, splitX, tblY + tblH);

      // Left Column: 9 Funds + Total Row (each ~ 7.2mm)
      const funds = [
        { name: 'Corpus Fund / ભંડોળ', val: item.fund_corpus },
        { name: 'Medical Fund / મેડીકલ ફંડ', val: item.fund_medical },
        { name: 'Relief Fund / રાહત ફંડ', val: item.fund_relief },
        { name: 'Perm. Food Tithi / કાયમી ભોજન', val: item.fund_food_tithi },
        { name: 'Perm. Maint. Tithi / કાયમી નિભાવ', val: item.fund_maintenance_tithi },
        { name: 'Orthopedic Fund / ઓર્થોપેડીક', val: item.fund_orthopedic },
        { name: 'Eye Treatment / નેત્રસારવાર', val: item.fund_eye_treatment },
        { name: 'Pilgrimage Fund / યાત્રાપ્રવાસ', val: item.fund_pilgrimage },
        { name: 'Grain Fund / ઘાનદાન ફંડ', val: item.fund_grain }
      ];

      // Vertical sub-divider inside left column (between name and amount)
      const fundValX = 46;
      doc.line(fundValX, tblY, fundValX, tblY + tblH);

      const rowH = 7.2;
      funds.forEach((f, i) => {
        const ry = tblY + (i * rowH);
        doc.line(margin, ry + rowH, splitX, ry + rowH);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);
        doc.text(f.name, margin + 2, ry + 4.8);
        doc.text(f.val && parseFloat(f.val) > 0 ? `${f.val}/-` : '-', fundValX + 2, ry + 4.8);
      });

      // Total Row (Row 10 on left)
      const totY = tblY + (9 * rowH);
      doc.setFillColor(245, 240, 232);
      doc.rect(margin, totY, splitX - margin, rowH, 'F');
      doc.line(fundValX, totY, fundValX, totY + rowH);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 15, 15);
      doc.text('Total / કુલ', margin + 2, totY + 5);
      doc.setTextColor(180, 50, 30);
      doc.text(`${Number(item.amount || 0).toLocaleString('en-IN')}/-`, fundValX + 2, totY + 5);

      // Right Column: Donor & Payment Details
      doc.setTextColor(15, 15, 15);
      const rightX = splitX + 4;
      const rightW = boxW - (splitX - margin);

      // Row 1: Donor's Name (y = 43 to 52)
      doc.line(splitX, tblY + 9, margin + boxW, tblY + 9);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text("Donor's Name / દાતાનું નામ :", rightX, tblY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.donor_name || '—'), rightX + 45, tblY + 6);

      // Row 2: Address & Village (y = 52 to 61)
      doc.line(splitX, tblY + 18, margin + boxW, tblY + 18);
      doc.setFont('helvetica', 'bold');
      doc.text("Address / સરનામું :", rightX, tblY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.donor_address || '—'), rightX + 32, tblY + 15);
      doc.setFont('helvetica', 'bold');
      doc.text("Village / ગામ :", rightX + 90, tblY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.donor_city || '—'), rightX + 112, tblY + 15);

      // Row 3: Pincode (y = 61 to 70)
      doc.line(splitX, tblY + 27, margin + boxW, tblY + 27);
      doc.setFont('helvetica', 'bold');
      doc.text("Pincode / પીન :", rightX + 90, tblY + 24);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.donor_pincode || '—'), rightX + 112, tblY + 24);

      // Row 4: Tele & Tithi (y = 70 to 79)
      doc.line(splitX, tblY + 36, margin + boxW, tblY + 36);
      doc.setFont('helvetica', 'bold');
      doc.text("Tele No / ટેલી. નં. :", rightX, tblY + 33);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.donor_phone || '—'), rightX + 32, tblY + 33);
      doc.setFont('helvetica', 'bold');
      doc.text("Tithi / તિથી :", rightX + 90, tblY + 33);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.tithi || '—'), rightX + 112, tblY + 33);

      // Row 5: PAN Number Boxes (y = 79 to 88)
      doc.line(splitX, tblY + 45, margin + boxW, tblY + 45);
      doc.setFont('helvetica', 'bold');
      doc.text("PAN No. :", rightX, tblY + 42);
      const panStr = String(item.donor_pan || '').padEnd(10, ' ');
      const panBoxStart = rightX + 22;
      for (let p = 0; p < 10; p++) {
        doc.rect(panBoxStart + (p * 5.5), tblY + 38.5, 5, 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(panStr[p], panBoxStart + (p * 5.5) + 1.2, tblY + 42.2);
      }

      // Row 6: Email & Tithi Date (y = 88 to 97)
      doc.line(splitX, tblY + 54, margin + boxW, tblY + 54);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text("E-mail :", rightX, tblY + 51);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.donor_email || '—'), rightX + 16, tblY + 51);
      doc.setFont('helvetica', 'bold');
      doc.text("Date / તારીખ :", rightX + 90, tblY + 51);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.tithi_date || item.receipt_date || '—'), rightX + 112, tblY + 51);

      // Row 7: Cheque No & Bank Name (y = 97 to 106)
      doc.line(splitX, tblY + 63, margin + boxW, tblY + 63);
      doc.setFont('helvetica', 'bold');
      doc.text("Cheque No / ચેક નં. :", rightX, tblY + 60);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.cheque_no || item.cheque_dd_no || '—'), rightX + 35, tblY + 60);
      doc.setFont('helvetica', 'bold');
      doc.text("Bank / બૅંકનું નામ :", rightX + 68, tblY + 60);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.bank_name || '—'), rightX + 96, tblY + 60);

      // Row 8: Amount in Words (y = 106 to 115)
      doc.setFont('helvetica', 'bold');
      doc.text("Amount in Words / અંકે રૂા. :", rightX, tblY + 69);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.amount_in_words || `${item.amount || '0'} Rupees Only`), rightX + 45, tblY + 69);

      // Corpus Acknowledgment Note below table
      const noteY = tblY + tblH + 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text('આપના ઉપરોક્ત દાનનો સાભાર સ્વીકાર કરીએ છીએ અને આપની ઈચ્છા મુજબ Corpus ખાતે લેવામાં આવશે.', 105, noteY, { align: 'center' });
      doc.setFontSize(7.5);
      doc.setTextColor(70, 70, 70);
      doc.text('(We gratefully acknowledge the above donation, and it will be credited to Corpus account per your wish.)', 105, noteY + 3.8, { align: 'center' });

      // Signatures
      const signY = noteY + 18;
      doc.setDrawColor(40, 40, 40);
      doc.setLineWidth(0.3);
      doc.line(margin + 6, signY, margin + 70, signY);
      doc.line(margin + boxW - 76, signY, margin + boxW - 6, signY);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(`Donor Signature / દાન આપનારની સહી: ${item.donor_signature || item.donor_name || ''}`, margin + 6, signY - 2);
      doc.text('President / Hon. Secretary / Trustee / Manager', margin + boxW - 76, signY - 2);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      doc.text('(પ્રમુખ / માનદ્ મંત્રી / ટ્રસ્ટી / મેનેજર)', margin + boxW - 76, signY + 3.5);

      // Footer Correspondence Line
      const footerY = 163;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY, margin + boxW, footerY);
      doc.setFontSize(6.8);
      doc.setTextColor(80, 80, 80);
      doc.text('Correspondence: Mital Shah, 607, Autocommerce Building, Kennedy Bridge, Nana Chowk, Mumbai - 400 007.', 105, footerY + 3.8, { align: 'center' });
      doc.text('Telephone : 98206 49434   |   E-Mail : dinextissues@gmail.com', 105, footerY + 7.2, { align: 'center' });

      doc.save(`Donation_Receipt_${item.receipt_type || 'BD'}_${item.receiptNumber || 'NA'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Error: ' + err.message);
    }
  }

  // ============================================================
  // INITIAL NAVIGATION
  // ============================================================
  const defaultView = userRole === 'admin' ? 'view-forms' : 'admission-form';
  navigateTo(defaultView);
});
