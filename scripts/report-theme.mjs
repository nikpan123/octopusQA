// Apply only while serving the report. Archived HTML and its embedded ZIP remain
// unchanged, and external files/trace attachments are served byte for byte.
export function withReportTheme(html) {
  if (html.includes('id="qa-playwright-report-theme"')) return html;
  const bridge = `<style id="qa-playwright-report-theme">
html,body{background-color:var(--color-canvas-default,#fff);color:var(--color-fg-default,#24292f)}
</style><script>
(() => {
  const system=window.matchMedia('(prefers-color-scheme: dark)');
  let previous='';
  function sync() {
    let preference;
    try {
      const cookie=document.cookie.split(';').map(item=>item.trim()).find(item=>item.startsWith('qa_ui_theme='));
      preference=cookie?decodeURIComponent(cookie.slice('qa_ui_theme='.length)):localStorage.getItem('qa_ui_theme');
    } catch { return; }
    if(!['auto','light','dark'].includes(preference)) return;
    const theme=(preference==='auto'?system.matches?'dark':'light':preference)+'-mode';
    const signature=preference+':'+theme;
    if(signature===previous) return;
    previous=signature;
    // Initialize the native reporter before its deferred module starts.
    try { localStorage.setItem('theme',theme); } catch {}
    document.documentElement.classList.remove('dark-mode','light-mode');
    document.documentElement.classList.add(theme);
  }
  sync();
  system.addEventListener('change',sync);
  window.addEventListener('focus',sync);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
  // Cookies are shared between localhost ports; storage events are not.
  const timer=setInterval(sync,1000);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();
</script>`;
  return html.replace(/<\/head>/i, bridge + "\n</head>");
}
