const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Osobny plik dla każdego workera: równoległe testy nie mieszają kroków.
class BrowserPreviewReporter {
  onBegin(config, suite) {
    this.directory = config.metadata.qaBrowserPreviewDirectory; this.workers = new Map();
    const tests=suite?.allTests?.()||[];
    this.order=new Map(tests.map((test,index)=>[test.id,index+1]));this.total=tests.length;
  }
  onTestBegin(test, result) {
    const use = test.parent.project()?.use || {};
    if (process.env.QA_BROWSER_PREVIEW === '0' || !(process.env.QA_BROWSER_PREVIEW === '1' || use.headless === false || use.qaBrowserPreview === true)) return;
    this.workers.set(result.workerIndex, {id:test.id, title:clean(test.title), number:0, steps:[],testIndex:this.order.get(test.id),totalTests:this.total,attempt:(result.retry||0)+1});
    this.publish(result.workerIndex);
  }
  onStepBegin(test, result, step) {
    const state = this.workers.get(result.workerIndex);
    if (!state || state.id !== test.id || !['test.step','pw:api','expect'].includes(step.category)) return;
    // Nie pokazujemy argumentów akcji (np. hasła w fill). Pomijamy też własne aktualizacje nakładki.
    if (step.category === 'pw:api' && /evaluate|init.?script/i.test(step.title)) return;
    if (step.category === 'test.step') state.number++;
    state.steps.push({ref:step, category:step.category, title:step.category === 'test.step' ? clean(step.title) : action(step)});
    this.publish(result.workerIndex);
  }
  onStepEnd(test, result, step) {
    const state = this.workers.get(result.workerIndex);
    if (!state || state.id !== test.id) return;
    const index = state.steps.findIndex(item => item.ref === step);
    if (index < 0) return;
    state.steps.splice(index, 1);
    this.publish(result.workerIndex);
  }
  onTestEnd(test, result) { this.workers.delete(result.workerIndex); }
  publish(worker) {
    if (!this.directory) return;
    const state = this.workers.get(worker);
    const business = state.steps.filter(item => item.category === 'test.step').at(-1);
    const current = state.steps.at(-1);
    const payload = {title:state.title, step:business?.title || 'Wykonywanie scenariusza', number:state.number, action:current?.title || 'Oczekiwanie na następną czynność',testIndex:state.testIndex,totalTests:state.totalTests,attempt:state.attempt};
    try {
      fs.mkdirSync(this.directory, {recursive:true});
      const target = path.join(this.directory, 'worker-'+worker+'.json');
      fs.writeFileSync(target+'.tmp', JSON.stringify(payload));
      fs.renameSync(target+'.tmp', target);
    } catch { /* Podgląd nie może zmienić wyniku testu. */ }
  }
  onEnd() {
    if (this.directory && path.dirname(path.resolve(this.directory)) === path.resolve(os.tmpdir()) && path.basename(this.directory).startsWith('qa-browser-preview-')) {
      try { fs.rmSync(path.resolve(this.directory), {recursive:true,force:true}); } catch {}
    }
  }
}
function clean(title) {
  return String(title).replace(/\s*@\S+/g,'').replace(/((?:password|hasło|token|secret|authorization|cookie)\s*[:=]\s*)\S+/gi,'$1[ukryto]').slice(0,240);
}
function action(step) {
  if (step.category === 'expect') return 'Sprawdzanie oczekiwanego wyniku';
  const title = step.title.toLowerCase();
  if (/goto|navigat|reload|go back|go forward/.test(title)) return 'Otwieranie strony';
  if (/fill|type|press.*key/.test(title)) return 'Wpisywanie danych';
  if (/select/.test(title)) return 'Wybieranie opcji';
  if (/uncheck/.test(title)) return 'Odznaczanie pola';
  if (/check/.test(title)) return 'Zaznaczanie pola';
  if (/click|tap/.test(title)) return 'Klikanie elementu';
  if (/wait/.test(title)) return 'Oczekiwanie na stronę lub element';
  if (/request|post|get|fetch/.test(title)) return 'Sprawdzanie danych aplikacji';
  return 'Wykonywanie czynności w przeglądarce';
}
module.exports = BrowserPreviewReporter;
