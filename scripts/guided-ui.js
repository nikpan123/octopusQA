// Wspólna instrukcja obsługi. Adapter projektu dostarcza rzeczywiste dane testu.
function installQaGuide(config) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const list = values => `<ol>${values.filter(Boolean).map(value => `<li>${escape(value)}</li>`).join('')}</ol>`;
  const section = (title, content) => `<section><h3>${title}</h3>${content}</section>`;
  const legend = `<dl class="qa-guide-legend"><dt>PASS / Zaliczone</dt><dd>Wykonane kontrole spełniły oczekiwania. Otwórz raport i potwierdź, że zawiera wybrany test.</dd><dt>FAIL / Niezaliczone</dt><dd>Kontrola nie przeszła lub wystąpił problem z jej wykonaniem. Odczytaj przyczynę; sam czerwony wynik nie rozstrzyga, czy winna jest aplikacja, dane czy połączenie.</dd><dt>SKIP / Pominięte</dt><dd>Nie sprawdzono tego warunku. To nie jest potwierdzenie poprawności.</dd><dt>BLOCKED / Zablokowane</dt><dd>Brakuje warunku potrzebnego do wykonania. Uzupełnij wskazane dane lub dostęp.</dd><dt>INCOMPLETE / Niepełne</dt><dd>Sprawdzono część zakresu; pozostałe warunki nadal wymagają wykonania.</dd></dl>`;
  const dialog = document.createElement('dialog');
  dialog.className = 'qa-guide-dialog';
  dialog.setAttribute('aria-labelledby', 'qa-guide-title');
  document.body.append(dialog);
  let returnFocus;
  dialog.addEventListener('click', event => { if (event.target.closest('[data-guide-close]')) dialog.close(); });
  dialog.addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus(); });
  function show(test, opener) {
    returnFocus = opener;
    const manual = test.type === 'manual';
    const steps = Array.isArray(test.steps) ? test.steps : test.steps ? [test.steps] : [];
    const expected = Array.isArray(test.expected) ? test.expected : test.expected ? [test.expected] : [];
    const effect = test.effect || config.effect;
    const actions = manual
      ? ['Przeczytaj warunki i oczekiwany wynik poniżej.', 'Wykonaj opisane kroki w testowanej aplikacji.', 'W Centrum wybierz „Zapisz wynik ręczny”, wpisz rzeczywisty rezultat i dołącz dowody. Zapisz wynik zgodny z obserwacją.']
      : test.actions || config.actions;
    dialog.innerHTML = `<div class="qa-guide-head"><div><small>INSTRUKCJA TESTU · ${escape(config.name)}</small><h2 id="qa-guide-title">${escape(test.title)}</h2></div><button type="button" class="secondary" data-guide-close>Zamknij</button></div>`
      + section('1. Co sprawdzamy?', `<p>${escape(test.purpose || test.title)}</p>${test.scope ? `<p>${escape(test.scope)}</p>` : ''}`)
      + section('2. Co przygotować?', list(test.prepare || config.prepare))
      + section('3. Co kliknąć i co się stanie?', list(actions) + `<p class="qa-guide-effect"><strong>Wpływ na dane:</strong> ${escape(effect)}</p>`)
      + section(manual ? '4. Kroki do wykonania ręcznie' : '4. Co zrobi automat?', (manual ? '' : '<p>Po uruchomieniu poniższe czynności wykonuje program. Nie musisz samodzielnie wysyłać zapytań ani klikać w testowanej aplikacji.</p>') + (steps.length ? list(steps) : `<p>Szczegółowe kroki tego przypadku nie zostały jeszcze opisane w katalogu. Sprawdź zakres w dokumentacji projektu przed uruchomieniem; ta karta nie zastępuje pełnego opisu testu.</p>`))
      + section('5. Jakiego wyniku oczekiwać?', expected.length ? list(expected) : `<p>Automat ocenia warunki dotyczące scenariusza „${escape(test.title)}”. Katalog nie zawiera osobnego, pełnego opisu oczekiwanego rezultatu. Nie potwierdzaj całej funkcjonalności wyłącznie na podstawie nazwy testu.</p>`)
      + section('6. Gdzie jest wynik i co zrobić dalej?', `<p>${escape(test.result || config.result)}</p>${legend}<p>Do zgłoszenia przypnij raport z tego uruchomienia, wskaż faktycznie wykonane ID testów, środowisko i wersję aplikacji. Dla błędu opisz oczekiwany i rzeczywisty rezultat. Samo dodanie testu do zgłoszenia nie potwierdza poprawki.</p>`)
      + `<div class="qa-guide-foot"><p>Ta instrukcja nie uruchamia testu ani nie zmienia wyboru.</p><button type="button" class="secondary" data-guide-close>Wróć do panelu</button></div>`;
    dialog.showModal();
  }
  const intro = document.createElement('details');
  intro.className = 'qa-guide-intro';
  intro.innerHTML = `<summary>Pierwszy raz tutaj? Jak wybrać test i odczytać wynik</summary><div class="qa-guide-intro-body"><h3>${escape(config.name)} — od czego zacząć</h3>${list(config.intro)}<h3>Co oznacza wynik?</h3>${legend}<p><strong>Słownik:</strong> scenariusz = jeden opisany przypadek; zestaw = grupa testów; środowisko = adres sprawdzanej aplikacji; API = sprawdzanie poprzez zapytania zamiast klikania w przeglądarce; raport = zapis przebiegu i dowody.</p><p>Przy testach wybierz „Jak wykonać test?”, aby poznać przygotowanie, zakres, wpływ na dane i dalsze kroki.</p></div>`;
  const main = document.querySelector('main');
  const header = main?.querySelector(':scope > header');
  if (header) header.after(intro); else main?.prepend(intro);
  function button(test, host) {
    if (!host || host.querySelector(':scope > [data-qa-guide]')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'secondary qa-guide-button'; b.dataset.qaGuide = 'true';
    b.textContent = 'Jak wykonać test?';
    if (config.compactGuideButtons && host.classList.contains('test-row-actions')) { b.classList.add('qa-icon-action'); b.title = 'Jak wykonać test?'; b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16v1"/></svg>'; }
    b.setAttribute('aria-label', 'Jak wykonać test: ' + test.title);
    b.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); show(test, b); });
    host.append(b);
  }
  let pending = false;
  function refresh() {
    pending = false;
    config.decorate(button);
    const authorFields = document.querySelector('#modal[open] #fields');
    if (authorFields && document.querySelector('#dialog-title')?.textContent === 'Nowy test ręczny' && !authorFields.querySelector('.qa-guide-author')) {
      const note = document.createElement('p');
      note.className = 'qa-guide-effect qa-guide-author';
      note.textContent = 'Napisz instrukcję dla osoby, która pierwszy raz widzi aplikację: gdzie wejść, jakie dane przygotować, co kolejno kliknąć i jaki komunikat lub zapis ma się pojawić. Opisz również wpływ na dane i co posprzątać po próbie. Oczekiwany wynik podaj konkretnie, np. „Zapis jest zablokowany, a nowe zamówienie nie powstaje”.';
      authorFields.prepend(note);
    }
    for (const control of document.querySelectorAll(config.launchSelector || '[data-no-launch-control]')) {
      if (control.closest('.qa-guide-dialog')) continue;
      let note = control.parentElement.querySelector(':scope > .qa-guide-before-run');
      if (!note) { note = document.createElement('p'); note.className = 'qa-guide-before-run'; control.after(note); }
      const text = config.launchNote();
      if (note.textContent !== text) note.textContent = text;
    }
  }
  function queue() { if (!pending) { pending = true; setTimeout(refresh, 30); } }
  const observer = new MutationObserver(records => { if (records.some(record => !record.target.closest?.('.qa-guide-dialog,.qa-guide-intro,.qa-guide-before-run,.qa-guide-button'))) queue(); });
  if (main) observer.observe(main, {childList:true,subtree:true});
  document.addEventListener('change', queue);
  document.addEventListener('click', queue);
  refresh();
}
