const search = document.querySelector('#search');
const priority = document.querySelector('#priority');
const list = document.querySelector('ul');
const status = document.querySelector('[role="status"]');
let scenarios = [];

function render() {
  const query = search.value.trim().toLocaleLowerCase('pl');
  const filtered = scenarios.filter(item =>
    (!priority.value || item.priority === priority.value) &&
    `${item.id} ${item.title}`.toLocaleLowerCase('pl').includes(query));
  list.replaceChildren(...filtered.map(item => {
    const row = document.createElement('li');
    const code = document.createElement('strong');
    code.textContent = item.id;
    const badge = document.createElement('span');
    badge.dataset.testid = 'priorytet';
    badge.textContent = item.priority;
    row.append(code, document.createTextNode(` — ${item.title} `), badge);
    return row;
  }));
  status.textContent = `${filtered.length} z ${scenarios.length} scenariuszy`;
  document.querySelector('#empty').hidden = filtered.length !== 0;
}
search.addEventListener('input', render);
priority.addEventListener('change', render);
document.querySelector('#reset').addEventListener('click', () => {
  search.value = '';
  priority.value = '';
  render();
});
fetch('/api/scenarios').then(response => {
  if (!response.ok) throw new Error('Błąd katalogu');
  return response.json();
}).then(data => { scenarios = data; render(); })
  .catch(() => { status.textContent = 'Nie udało się wczytać scenariuszy.'; });
