(() => {
  const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
  const north = Math.PI;
  const east = Math.PI / 2;
  const teal = '#419c90';
  const blue = '#6c91cd';
  const ochre = '#e3af5c';
  const lavender = '#a28ac3';
  const coral = '#e48e79';
  const testLength = 7.7;
  const frontBumper = 2.225;
  const stopLine = 16;
  const stopLineMarker = { points: [[-5.7, stopLine], [-1.2, stopLine]], color: '#f09588' };
  function addPortraits() {
    const skins = ['#f0bb91', '#a46b4e', '#df9b73', '#f3c9a6'];
    const shirts = ['#407b71', '#4c6f9a', '#b26755', '#7d629f'];
    const hair = [
      '<path d="M13 30c-2-5 0-13 5-16 3-8 17-10 23-3 5 3 7 9 5 16-5-1-10-5-13-8-3 6-11 9-20 11Z"/>',
      '<path d="M14 29c-6-3-3-11 1-12-1-5 5-9 9-8 3-5 10-4 13-1 5-2 10 2 10 7 5 3 4 11-1 14-5-5-10-6-16-7-5 0-12 2-16 7Z"/>',
      '<path d="M14 30c-3-8 1-16 7-20 11-5 24 1 25 16-5 0-9-2-13-7-4 5-11 9-19 11Z"/><path d="M15 26c-3 8 0 17 5 20l-2-14Z"/>',
      '<path d="M13 29c-4-9 1-16 7-18 7-7 17-6 22 0 4 4 6 9 4 16-5-6-10-8-15-8-4 5-11 8-18 10Z"/>'
    ];
    document.querySelectorAll('[data-avatar]').forEach(node => {
      const i = Number(node.dataset.avatar) % skins.length;
      const glasses = i === 3 ? '<g fill="none" stroke="#463950" stroke-width="1.6"><circle cx="24" cy="30" r="4"/><circle cx="36" cy="30" r="4"/><path d="M28 30h4"/></g>' : '';
      node.innerHTML = `<svg viewBox="0 0 60 60" aria-hidden="true">
        <path fill="${shirts[i]}" d="M3 60c3-11 13-17 27-17s24 6 27 17Z"/>
        <path fill="${skins[i]}" d="M25 39h10v10c-2 3-8 3-10 0Z"/>
        <circle cx="30" cy="28" r="16" fill="${skins[i]}"/>
        <g fill="${i === 2 ? '#533d32' : '#3f3437'}">${hair[i]}</g>
        <g fill="#382f31"><circle cx="24" cy="30" r="1.5"/><circle cx="36" cy="30" r="1.5"/></g>
        <path d="M27 36q3 3 6 0" fill="none" stroke="#78423a" stroke-width="1.5" stroke-linecap="round"/>
        ${glasses}
      </svg>`;
    });
  }

  let preparation;
  let active;
  let raf;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => { script.remove(); reject(new Error('Could not load ' + src)); };
      document.head.append(script);
    });
  }

  function prepare() {
    if (!preparation) {
      preparation = loadScript('vendor/three.js')
        .then(() => loadScript('concept-world.js'))
        .then(() => new window.ConceptJunction())
        .catch(error => { preparation = undefined; throw error; });
    }
    return preparation;
  }

  function car(id, x, z, yaw, color, brake = false) {
    return { id, kind: 'car', x, z, yaw, color, brake };
  }

  function crossingPerson(id, x, z, time, color) {
    return { id, kind: 'walker', x, z, yaw: east, phase: time * 9.5, color };
  }

  function admissionCase(time, failed) {
    const t = time % testLength;
    const stop = 1.9;
    const restart = 4.44;
    const resumeTime = Math.max(0, t - restart);
    const approach = 16.8 * (1 - Math.pow(1 - clamp(t / stop), 1.55));
    const afterApproach = failed ? 1.4 * clamp((t - stop) / .7)
      : 8.7 * resumeTime - 2.35 * (1 - Math.exp(-2 * resumeTime));
    const underEvaluation = car('evaluation', -3.4, 35.3 - approach - afterApproach,
      north, teal, t >= 1.53 && (failed || t < restart));
    const blockingVan = { id: 'delivery', kind: 'van', x: -8.3, z: 19.7, yaw: north, color: ochre };
    const overLine = failed && underEvaluation.z - frontBumper < stopLine - .15;
    return {
      t, underEvaluation, overLine,
      frame: {
        sun: .13,
        vehicles: [underEvaluation, blockingVan, car('oncoming', 3.7, -26 + 7.3 * Math.min(t, 4.65), 0, blue, t >= 4.65)],
        people: [
          crossingPerson('person-one', -8.65 + 1.8 * t, 13.6, t, coral),
          crossingPerson('person-two', -7.05 + 1.8 * t, 12.6, t, lavender)
        ],
        routes: overLine ? [stopLineMarker] : []
      }
    };
  }


  const publicLength = 7.2;
  const overview = { x: 25, y: 41, z: 39, tx: -5, ty: 0, tz: 9, span: 41 };
  const crossingCamera = { x: 23, y: 38, z: 39, tx: -4.5, ty: 0, tz: 17, span: 32 };
  const duskCamera = { x: 17, y: 14, z: 33, tx: -5, ty: .3, tz: 14, fov: 46 };
  const westCamera = { x: 19, y: 46, z: 30, tx: -10, ty: 0, tz: -4, span: 41 };
  const eastCamera = { x: -23, y: 44, z: 30, tx: 0, ty: 0, tz: 4, span: 40 };
  const closeCameras = [crossingCamera, westCamera, duskCamera, overview, eastCamera,
    crossingCamera, westCamera, crossingCamera, eastCamera];
  const galleryCameras = [
    { ...crossingCamera, tz: 21, span: 20 },
    { ...westCamera, tx: -12, tz: -7, span: 24 },
    { ...duskCamera, fov: 34 },
    { ...overview, tx: -8, tz: 8, span: 24 },
    { ...eastCamera, tz: 7, span: 25 },
    { ...crossingCamera, tz: 16, span: 21 },
    { ...westCamera, tx: -7, tz: 5, span: 25 },
    { ...crossingCamera, tz: 17, span: 22 },
    { ...eastCamera, tx: -7, tz: -4, span: 25 }
  ];

  function boxVan(id, x, z, yaw, color, kind = 'van') {
    return { id, kind, x, z, yaw, color };
  }

  function northTurn(t, color = blue) {
    const entry = 1.75;
    const radius = 15.6;
    const angle = clamp((t - entry) * 8.6 / radius, 0, Math.PI / 2);
    const leaving = Math.max(0, t - entry - radius * Math.PI / 17.2);
    const x = t < entry ? -35 + 16 * t / entry : -19 + radius * Math.sin(angle);
    const z = -3.4 - radius * (1 - Math.cos(angle)) - leaving * 8.6;
    return car('north-turn', x, z, east + angle, color);
  }

  function southTurn(t) {
    const entry = 2.65;
    const radius = 11.4;
    const angle = clamp((t - entry) * 8.6 / radius, 0, Math.PI / 2);
    const leaving = Math.max(0, t - entry - radius * Math.PI / 17.2);
    const x = t < entry ? -34 + 26 * t / entry : -8 + radius * Math.sin(angle);
    const z = -3.4 + radius * (1 - Math.cos(angle)) + leaving * 8.6;
    return car('south-turn', x, z, east - angle, coral);
  }

  function trace(curve, color) {
    const points = Array.from({ length: 24 }, (_, i) => {
      const { x, z } = curve(i * 7.05 / 23);
      return [x, z];
    });
    return { points, color };
  }

  const leftRoute = trace(northTurn, '#bed3ff');
  const rightRoute = trace(southTurn, '#ffc0a1');
  const straightRoute = { points: [[-35, -3.4], [23, -3.4]], color: '#d7e1e3' };
  const crossingRoute = { points: [[-3.4, 35], [-3.4, -6]], color: '#a6ddcb' };

  function publicCase(index, time, failedCase) {
    const t = (time + (index < 3 ? 0 : index * .63)) % publicLength;
    const stopAt = failedCase ? 17.1 : 18.5;
    const sedan = car('teal', -3.4, Math.max(stopAt, 34 - 7.45 * t), north, teal, 34 - 7.45 * t <= stopAt);
    const fromWest = car('blue', -37 + 7.9 * Math.min(t, 2.33), -3.4, east, blue, t > 2.33);
    const oncoming = car('coral', 3.7, -28 + 7.1 * t, 0, coral);
    const pedestrian = crossingPerson('person', -8.8 + 1.7 * t, 13.55, t, coral);
    const frame = { sun: .14, vehicles: [], people: [] };
    switch (index) {
      case 0:
        frame.vehicles = [sedan, oncoming];
        if (t >= .35) {
          const inserted = boxVan('inserted', -8.3, 31.5 - 6.55 * clamp(t - .35, 0, 1.67), north, lavender, 'minibus');
          frame.vehicles.push(inserted);
        }
        frame.people = [pedestrian];
        break;
      case 1:
        frame.vehicles = [t < .45 ? car('north-turn', -35 + 9.14 * t, -3.4, east, blue) : northTurn(t), sedan];
        frame.routes = [t < .45 ? straightRoute : leftRoute];
        break;
      case 2:
        frame.sun = .14 + .8 * clamp((t - .18) / 1.3);
        frame.vehicles = [sedan, boxVan('van', -8.3, 20.9, north, ochre), oncoming];
        frame.people = [pedestrian];
        break;
      case 3:
        frame.vehicles = [sedan, fromWest, car('early', 3.7, -34 + 7.8 * Math.min(t, 2.15), 0, coral, t >= 2.15)];
        frame.routes = [straightRoute, crossingRoute];
        break;
      case 4:
        frame.vehicles = [sedan, fromWest,
          boxVan('delivery', 3.7, -30 + 6.8 * t, 0, ochre)];
        break;
      case 5:
        frame.vehicles = [sedan, oncoming];
        frame.people = [
          crossingPerson('early', -5.3 + 1.8 * t, 13.1, t, lavender),
          crossingPerson('late', -9.5 + 1.66 * t, 14.3, t, coral)
        ];
        break;
      case 6:
        frame.vehicles = [southTurn(t), sedan];
        frame.routes = [rightRoute];
        break;
      case 7:
        frame.vehicles = [sedan, oncoming, boxVan('van', -8.3, 24, north, ochre)];
        frame.people = [{ id: 'rider', kind: 'cycle', x: -10 + 3.15 * t, z: 13.4, yaw: east, phase: t * 9, color: '#639a7d' }];
        break;
      case 8:
        frame.vehicles = [northTurn(t), southTurn(Math.max(0, t - 1.12)), sedan];
        frame.routes = [leftRoute, rightRoute];
        break;
    }
    if (failedCase && sedan.z - frontBumper < stopLine - .15) {
      frame.routes = [...(frame.routes || []), stopLineMarker];
    }
    return { t, frame, camera: closeCameras[index] };
  }


  function surface(session, name) {
    if (session.views[name]) return session.views[name];
    const node = session.slide.querySelector('[data-view="' + name + '"]');
    let canvas = node.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      node.prepend(canvas);
    }
    const scale = clamp(node.getBoundingClientRect().width / node.clientWidth, .64, 1);
    canvas.width = Math.round(node.clientWidth * scale);
    canvas.height = Math.round(node.clientHeight * scale);
    const context = canvas.getContext('2d');
    session.views[name] = { node, canvas, context };
    return session.views[name];
  }

  function draw(session, name, frame, camera, time, length) {
    const view = surface(session, name);
    const { width, height } = view.canvas;
    view.context.drawImage(session.world.render(frame, width, height, camera), 0, 0, width, height);
    view.canvas.style.opacity = length ? String(.82 + .18 * clamp(Math.min(time, length - time) / .16)) : '1';
    view.node.classList.add('is-ready');
    return view;
  }

  function pin(world, view, selector, point) {
    const marker = view.node.querySelector('[data-pin="' + selector + '"]');
    if (point) {
      const { x, y } = world.project(...point);
      marker.style.left = clamp(x, .095, .905) * 100 + '%';
      marker.style.top = clamp(y, .08, .89) * 100 + '%';
    }
    marker.hidden = !point;
  }


  function admission(session, time) {
    const { slide, world } = session;
    const trial = Math.floor(time / testLength) % 2;
    const { t, frame, underEvaluation, overLine } = admissionCase(time, trial === 1);
    const main = draw(session, 'evaluation', frame, crossingCamera, t, testLength);
    pin(world, main, 'vehicle', [underEvaluation.x, .2, underEvaluation.z + 2.12]);
    if (!session.monitor) {
      const canvas = slide.querySelector('[data-same-run]');
      canvas.width = main.canvas.width;
      canvas.height = main.canvas.height;
      session.monitor = { canvas, context: canvas.getContext('2d') };
    }
    session.monitor.context.drawImage(main.canvas, 0, 0);
    session.monitor.canvas.style.opacity = main.canvas.style.opacity;
    const result = overLine ? 'fail' : underEvaluation.z + frontBumper < 11.8 ? 'pass' : '';
    const status = result === 'pass' ? 'Crossing completed' :
      result === 'fail' ? 'Stopped past the line' : 'In progress';
    const label = 'Run ' + (trial + 1) + ' · ' + status;
    if (session.outcome !== label) {
      slide.querySelectorAll('[data-result]').forEach(node => {
        node.classList.toggle('current', node.dataset.result === result);
      });
      slide.querySelector('[data-outcome-label]').textContent = label;
      session.outcome = label;
    }
  }

  function feedback(session, time) {
    const gallery = session.slide.dataset.motion === 'gallery';
    const prefix = gallery ? 'small' : 'large';
    for (let index = 0; index < (gallery ? 9 : 3); index++) {
      const name = prefix + index;
      const failed = surface(session, name).node.parentElement.dataset.caseResult === 'fail';
      const { t, frame, camera } = publicCase(index, time, failed);
      draw(session, name, frame, gallery ? galleryCameras[index] : camera, t, publicLength);
    }
  }

  function junction(session, time) {
    const length = 8.4;
    const t = time % length;
    const south = car('northbound', -3.4, 35 - 7.4 * Math.min(t, 2.2) - 7.6 * Math.max(0, t - 4.5),
      north, teal, t >= 2.2 && t < 4.5);
    const other = car('westbound', 34 - 7.4 * Math.min(t, 2.2), 3.4, -east, coral, t >= 2.2);
    const frame = {
      sun: .19,
      vehicles: [south, northTurn(t), other, boxVan('shuttle', 3.7, -30 + 6.3 * Math.min(t, 5.9), 0, lavender, 'minibus')],
      people: [
        crossingPerson('person-a', -8.7 + 1.8 * t, 13.8, t, coral),
        crossingPerson('person-b', -6.9 + 1.8 * t, 12.6, t, lavender),
        { id: 'cycle', kind: 'cycle', x: -13.4, z: 9 - 2.3 * t, yaw: north, phase: t * 9, color: '#639a7d' }
      ],
      routes: [leftRoute, crossingRoute]
    };
    draw(session, 'junction-overview', frame, { ...overview, tx: -4, tz: 5, span: 52 }, t, length);
  }

  const sequences = { junction, admission, trio: feedback, gallery: feedback };

  function showError(slide, error) {
    console.error(error);
    slide.dataset.motionPhase = 'error';
    for (const node of slide.querySelectorAll('[data-view]')) {
      node.classList.remove('is-ready');
      if (node.querySelector('.scene-error')) continue;
      const message = document.createElement('span');
      message.className = 'scene-error';
      message.textContent = 'Scene unavailable. Press R to retry.';
      node.append(message);
    }
  }

  function startRoadside(slide) {
    const source = slide.querySelector('[data-camera-source]');
    const views = Array.from(slide.querySelectorAll('[data-camera-view]'), canvas => ({
      canvas, context: canvas.getContext('2d')
    }));
    const session = { slide };
    active = session;
    let lastTime = -1;
    function render() {
      if (active !== session) return;
      if (source.readyState >= 2 && source.currentTime !== lastTime) {
        const width = Math.floor(source.videoWidth / 2);
        const height = Math.floor(source.videoHeight / 2);
        views.forEach(({ canvas, context }, index) => {
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          context.drawImage(source, (index % 2) * width, Math.floor(index / 2) * height,
            width, height, 0, 0, width, height);
        });
        lastTime = source.currentTime;
      }
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);
  }

  function start(slide) {
    cancelAnimationFrame(raf);
    active = undefined;
    if (slide.dataset.motion === 'decision') {
      slide.getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = 0; });
      return;
    }
    if (slide.dataset.motion === 'roadside') {
      startRoadside(slide);
      return;
    }
    const sequence = sequences[slide.dataset.motion];
    if (!sequence) return;
    const session = { slide, views: {} };
    active = session;
    slide.dataset.motionPhase = 'loading';
    slide.querySelectorAll('.scene-error').forEach(node => node.remove());
    prepare().then(world => {
      if (session !== active) return;
      session.world = world;
      sequence(session, 0);
      slide.dataset.motionPhase = 'running';
      const started = performance.now();
      let last = started;
      function tick(now) {
        if (session !== active) return;
        if (now - last >= 32) {
          try {
            sequence(session, (now - started) / 1000);
            last = now;
          } catch (error) {
            showError(slide, error);
            return;
          }
        }
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }).catch(error => { if (session === active) showError(slide, error); });
  }

  addPortraits();
  window.PublicMotion = { prepare, start };
})();
