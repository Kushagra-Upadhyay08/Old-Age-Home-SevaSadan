document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admission-form');
  const langSwitchBtn = document.getElementById('lang-switch-btn');
  const resultBox = document.getElementById('form-result');
  let currentLang = 'gu'; // Default is Gujarati since the institution is local

  // Set default date value of admission form to today
  const dateField = document.getElementById('field-date');
  if (dateField) {
    const today = new Date().toISOString().split('T')[0];
    dateField.value = today;
  }

  // Language Switch Logic
  function updateLanguageDisplay() {
    const enElements = document.querySelectorAll('.display-lang-en');
    const guElements = document.querySelectorAll('.display-lang-gu');

    if (currentLang === 'en') {
      enElements.forEach(el => el.style.display = '');
      guElements.forEach(el => el.style.display = 'none');
      langSwitchBtn.textContent = 'ગુજરાતી';
    } else {
      enElements.forEach(el => el.style.display = 'none');
      guElements.forEach(el => el.style.display = '');
      langSwitchBtn.textContent = 'English';
    }
  }

  langSwitchBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'gu' : 'en';
    updateLanguageDisplay();
  });

  // Initialize language
  updateLanguageDisplay();

  // Dynamic Declaration text update
  const applicantNameInput = document.querySelector('input[name="full_name"]');
  const relationInput = document.querySelector('input[name="responsible_person_relation"]');
  
  function updateDeclaration() {
    const nameVal = applicantNameInput.value.trim() || '[Applicant Name / અરજદારનું નામ]';
    const relVal = relationInput.value.trim() || '[Relation / સંબંધ]';

    const decTextEn = document.getElementById('dec-text-en');
    const decTextGu = document.getElementById('dec-text-gu');

    decTextEn.innerHTML = `The applicant <strong>${nameVal}</strong> is my <strong>${relVal}</strong>. They want to enter the ashram of their own free will. They are fully aware of the rules. I bind myself to take them back when notified by trustees. In case of death during their stay, if I am unable to be present, I authorize trustees to conduct the final rites. I bind myself to pay the monthly costs.`;
    
    decTextGu.innerHTML = `અરજદારશ્રી <strong>${nameVal}</strong> મારા <strong>${relVal}</strong> છે. પોતાની રાજીખુશીથી આશ્રમમાં દાખલ થવા માંગે છે. આશ્રમના નીતિનિયમોથી તેમને સંપૂર્ણપણે વાકેફ કરવામાં આવેલ છે. આશ્રમના નિયામક/ટ્રસ્ટીઓ જ્યારે ખબર આપશે ત્યારે તેમને લઈ જવા હું બંધાઉં છું. તેમનું મૃત્યુ આશ્રમના રહેઠાણ દરમ્યાન થાય અને જો હાજર ન રહી શકું તો આશ્રમના નિયામક/ટ્રસ્ટીઓને તેમનો અગ્નિ સંસ્કાર કરવાની વિનંતી કરું છું. તેમનો આશ્રમમાં રહેવાનો ખર્ચ વખતોવખત જે નક્કી થાય તે આપવા હું બંધાઉં છું.`;
  }

  applicantNameInput.addEventListener('input', updateDeclaration);
  relationInput.addEventListener('input', updateDeclaration);

  // Client-side Validation and Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors and results
    resultBox.style.display = 'none';
    resultBox.className = 'result-box';
    const errorContainers = document.querySelectorAll('.error-msg');
    errorContainers.forEach(container => {
      container.textContent = '';
      container.classList.remove('visible');
    });

    const inputs = document.querySelectorAll('.text-input, input[type="checkbox"]');
    inputs.forEach(input => input.classList.remove('input-error'));

    let isValid = true;

    // Define validation fields matching server-side expectations
    const validations = [
      { name: 'full_name', type: 'text', msgEn: 'Full Name is required.', msgGu: 'અરજદારનું પૂરું નામ જરૂરી છે.' },
      { name: 'address', type: 'text', msgEn: 'Address is required.', msgGu: 'અરજદારનું સરનામું જરૂરી છે.' },
      { name: 'phone_home', type: 'text', msgEn: 'Telephone Number is required.', msgGu: 'ટેલીફોન નંબર જરૂરી છે.' },
      { name: 'age', type: 'number', msgEn: 'Age is required.', msgGu: 'ઉંમર લખવી જરૂરી છે.' },
      { name: 'date_of_birth', type: 'text', msgEn: 'Date of Birth is required.', msgGu: 'જન્મ તારીખ જરૂરી છે.' },
      { name: 'nominee_name', type: 'text', msgEn: 'Nominee Name is required.', msgGu: 'નોમીનીનું નામ જરૂરી છે.' },
      { name: 'nominee_relation', type: 'text', msgEn: 'Nominee Relation is required.', msgGu: 'નોમીની સાથે સગાઈ સંબંધ જરૂરી છે.' },
      { name: 'nominee_address', type: 'text', msgEn: 'Nominee Address is required.', msgGu: 'નોમીનીનું સરનામું જરૂરી છે.' },
      { name: 'nominee_phone', type: 'text', msgEn: 'Nominee Phone is required.', msgGu: 'નોમીનીનો ફોન નંબર જરૂરી છે.' },
      { name: 'responsible_person_name', type: 'text', msgEn: 'Responsible Person Name is required.', msgGu: 'જવાબદાર વ્યક્તિનું નામ જરૂરી છે.' },
      { name: 'responsible_person_relation', type: 'text', msgEn: 'Relation is required.', msgGu: 'સંબંધ જરૂરી છે.' },
      { name: 'responsible_person_address', type: 'text', msgEn: 'Responsible Person Address is required.', msgGu: 'જવાબદાર વ્યક્તિનું સરનામું જરૂરી છે.' },
      { name: 'responsible_person_phone', type: 'text', msgEn: 'Phone number is required.', msgGu: 'ટેલીફોન નંબર જરૂરી છે.' },
      { name: 'rules_read_acknowledgement', type: 'checkbox', msgEn: 'You must read and agree to the rules.', msgGu: 'તમારે નીતિ નિયમો વાંચી સ્વીકારવા જરૂરી છે.' }
    ];

    validations.forEach(val => {
      const field = form.elements[val.name];
      if (!field) return;

      let hasError = false;

      if (val.type === 'checkbox') {
        if (!field.checked) {
          hasError = true;
        }
      } else {
        if (!field.value || field.value.trim() === '') {
          hasError = true;
        }
      }

      if (hasError) {
        isValid = false;
        field.classList.add('input-error');
        const errContainer = document.getElementById(`err-${val.name}`);
        if (errContainer) {
          errContainer.textContent = currentLang === 'en' ? val.msgEn : val.msgGu;
          errContainer.classList.add('visible');
        }
      }
    });

    // Check age logic
    const ageField = form.elements['age'];
    if (ageField && ageField.value) {
      const ageVal = parseInt(ageField.value, 10);
      if (isNaN(ageVal) || ageVal <= 0 || ageVal > 120) {
        isValid = false;
        ageField.classList.add('input-error');
        const errAge = document.getElementById('err-age');
        if (errAge) {
          errAge.textContent = currentLang === 'en' ? 'Please enter a valid age (1-120).' : 'કૃપા કરીને સાચી ઉંમર દાખલ કરો (૧-૧૨૦).';
          errAge.classList.add('visible');
        }
      }
    }

    if (!isValid) {
      resultBox.textContent = currentLang === 'en' ? 'Please fix the errors before submitting.' : 'કૃપા કરીને સબમિટ કરતા પહેલા ભૂલો સુધારો.';
      resultBox.classList.add('error');
      resultBox.style.display = 'block';
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Collect Form Data
    const formData = new FormData(form);
    const payload = {};
    
    // Add child rows to structure
    const childrenData = [];
    for (let i = 1; i <= 4; i++) {
      childrenData.push({
        row: i,
        child_name: form.elements[`child_${i}_name`]?.value || '',
        age: form.elements[`child_${i}_age`]?.value || '',
        occupation: form.elements[`child_${i}_occupation`]?.value || '',
        annual_income: form.elements[`child_${i}_income`]?.value || '',
        residence_and_phone: form.elements[`child_${i}_contact`]?.value || ''
      });
    }
    payload.children_rows = childrenData;

    // Collect normal fields
    formData.forEach((value, key) => {
      // Avoid raw child inputs in root payload
      if (!key.startsWith('child_')) {
        payload[key] = value;
      }
    });

    // Handle rules checkbox explicitly
    payload.rules_read_acknowledgement = form.elements['rules_read_acknowledgement'].checked;

    try {
      resultBox.textContent = currentLang === 'en' ? 'Submitting...' : 'સબમિટ થઈ રહ્યું છે...';
      resultBox.classList.add('info');
      resultBox.style.display = 'block';

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      resultBox.classList.remove('info');
      if (response.ok && resData.success) {
        resultBox.textContent = resData.message;
        resultBox.classList.add('success');
        form.reset();
        // Set date again
        if (dateField) dateField.value = new Date().toISOString().split('T')[0];
        updateDeclaration();
      } else {
        resultBox.textContent = resData.message || (currentLang === 'en' ? 'Submission failed.' : 'સબમિશન નિષ્ફળ ગયું.');
        resultBox.classList.add('error');
      }
    } catch (err) {
      console.error(err);
      resultBox.classList.remove('info');
      resultBox.textContent = currentLang === 'en' ? 'Connection Error.' : 'કનેક્શન ક્ષતિ.';
      resultBox.classList.add('error');
    }

    resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

});
