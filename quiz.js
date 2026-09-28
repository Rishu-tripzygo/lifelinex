// 12-step assessment. Answers live in `quiz` only — wire to a CRM endpoint when one exists.
var TOTAL = 12;
var quiz = { name: '', phone: '', answers: {}, symptoms: [] };

function showStep(n) {
  document.querySelectorAll('.q-step').forEach(function (el) {
    el.style.display = Number(el.dataset.step) === n ? 'block' : 'none';
  });
  document.getElementById('step-label').textContent = 'STEP ' + (n + 1) + ' OF ' + TOTAL;
  document.getElementById('progress-bar').style.width = Math.round(((n + 1) / TOTAL) * 100) + '%';
  var card = document.getElementById('quiz-card');
  if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearNameError() {
  document.getElementById('name-error').style.display = 'none';
}

function startQuiz() {
  var name = document.getElementById('input-name').value.trim();
  var phone = document.getElementById('input-phone').value.trim();
  var digits = phone.replace(/\D/g, '');
  if (!name || digits.length < 10 || digits.length > 13) {
    document.getElementById('name-error').style.display = 'block';
    return;
  }
  quiz.name = name;
  quiz.phone = phone;
  document.getElementById('first-name').textContent = name.split(/\s+/)[0] + "'s";
  showStep(1);
}

function selectAnswer(step, value) {
  quiz.answers[step] = value;
  showStep(step + 1);
}

function setMulti(key, on) {
  document.getElementById('multi-btn-' + key).classList.toggle('selected', on);
  document.getElementById('multi-check-' + key).classList.toggle('selected', on);
}

function toggleMulti(key) {
  var i = quiz.symptoms.indexOf(key);
  if (i >= 0) {
    quiz.symptoms.splice(i, 1);
    setMulti(key, false);
  } else if (key === 'none') {
    quiz.symptoms.forEach(function (k) { setMulti(k, false); });
    quiz.symptoms = ['none'];
    setMulti('none', true);
  } else {
    var n = quiz.symptoms.indexOf('none');
    if (n >= 0) { quiz.symptoms.splice(n, 1); setMulti('none', false); }
    quiz.symptoms.push(key);
    setMulti(key, true);
  }
  document.getElementById('multi-error').style.display = 'none';
}

function continueMulti() {
  if (!quiz.symptoms.length) {
    document.getElementById('multi-error').style.display = 'block';
    return;
  }
  quiz.answers[2] = quiz.symptoms.slice();
  showStep(3);
}
