(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const params = new URLSearchParams(location.search);
  let index = 0;

  function resize() {
    const chromeHeight = document.body.classList.contains('clean') ? 0 : 50;
    const scale = Math.min(innerWidth / 1600, (innerHeight - chromeHeight) / 900);
    document.documentElement.style.setProperty('--scale', scale);
  }

  function replay() {
    const slide = slides[index];
    slide.querySelectorAll('video').forEach(video => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });
    window.PublicMotion.start(slide);
  }

  function show(number) {
    index = Math.max(0, Math.min(slides.length - 1, number));
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      if (i !== index) slide.querySelectorAll('video').forEach(video => video.pause());
    });
    document.getElementById('slide-number').textContent = `${index + 1} / ${slides.length}`;
    document.getElementById('slide-title').textContent = slides[index].dataset.title;
    const note = window.I2VNotes[index];
    document.getElementById('notes-time').textContent = note.timing;
    document.getElementById('notes-script').textContent = note.script;
    document.getElementById('notes-design').textContent = note.design;
    location.hash = String(index + 1);
    replay();
  }

  function toggleNotes() {
    const notes = document.getElementById('notes-panel');
    notes.hidden = !notes.hidden;
  }

  function clean() {
    document.body.classList.toggle('clean');
    resize();
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  document.getElementById('previous').onclick = () => show(index - 1);
  document.getElementById('next').onclick = () => show(index + 1);
  document.getElementById('replay').onclick = replay;
  document.getElementById('notes').onclick = toggleNotes;
  document.getElementById('close-notes').onclick = toggleNotes;
  document.getElementById('clean').onclick = clean;
  document.getElementById('fullscreen').onclick = fullscreen;
  document.addEventListener('keydown', event => {
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      show(index + 1);
    }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      show(index - 1);
    }
    if (event.key === 'Home') show(0);
    if (event.key === 'End') show(slides.length - 1);
    if (event.key.toLowerCase() === 'n') toggleNotes();
    if (event.key.toLowerCase() === 'c') clean();
    if (event.key.toLowerCase() === 'f') fullscreen();
    if (event.key.toLowerCase() === 'r') replay();
  });
  window.addEventListener('resize', resize);
  if (params.has('clean')) document.body.classList.add('clean');
  resize();
  show((Number(location.hash.slice(1)) || 1) - 1);
  window.setTimeout(() => window.PublicMotion.prepare().catch(() => {}), 300);
})();
