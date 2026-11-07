(function (root) {
  const T = root.THREE;
  const PI = Math.PI;

  const palette = {
    road: '#647181', walk: '#dedfda', curb: '#eff2ef', paint: '#f8f9f6',
    base: '#a9cbb9', cream: '#fff0d4', coral: '#e58878', coralDark: '#bf5e58',
    mint: '#8cbf9e', grass: '#a9cb9b', jade: '#639981', foliage: '#90bd8f',
    slate: '#45596b', glass: '#80aebc', glassLight: '#b5d6d8',
    tyre: '#3e4b5d', wheel: '#d5dce0', teal: '#4ea99b', blue: '#79a7d6',
    mustard: '#dfab59', sand: '#ebcb83', ink: '#3f4d57'
  };

  class ConceptJunction {
    constructor() {
      this.scene = new T.Scene();
      this.renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
      this.renderer.setPixelRatio(1);
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.18;
      this.orthographic = new T.OrthographicCamera(-50, 50, 40, -40, .1, 250);
      this.perspective = new T.PerspectiveCamera(46, 1, .1, 250);
      this.camera = this.orthographic;
      this.materials = new Map();
      this.geometries = new Map();
      this.batches = new Map();
      this.vehicles = new Map();
      this.people = new Map();
      this.dummy = new T.Object3D();
      this.projected = new T.Vector3();
      this.day = new T.Color('#e6eef0');
      this.evening = new T.Color('#f7dcb9');
      this.sunDay = new T.Color('#fffdf9');
      this.sunEvening = new T.Color('#ffd0a3');
      this.scene.background = this.day.clone();
      this.scene.fog = new T.Fog(this.day, 75, 160);
      this.ambient = new T.HemisphereLight('#f5fbff', '#b0aaa1', 2.0);
      this.sun = new T.DirectionalLight(this.sunDay, 2.3);
      this.scene.add(this.ambient, this.sun);
      this.routeLayer = new T.Group();
      this.scene.add(this.routeLayer);
      this.routeKey = '';
      this.shadowMaterial = this.createShadowMaterial();
      this.buildWorld();
      this.flushBatches();
    }

    material(color) {
      if (!this.materials.has(color)) {
        this.materials.set(color, new T.MeshStandardMaterial({ color, roughness: .88, metalness: 0 }));
      }
      return this.materials.get(color);
    }

    shape(key, create) {
      if (!this.geometries.has(key)) this.geometries.set(key, create());
      return this.geometries.get(key);
    }

    rounded(width, height, depth, radius = .18) {
      const r = Math.min(radius, width * .22, depth * .22, height * .4);
      return this.shape(`rounded/${width}/${height}/${depth}/${r}`, () => {
        const outline = new T.Shape();
        const w = width / 2 - r;
        const d = depth / 2 - r;
        outline.moveTo(-w, -d);
        outline.lineTo(w, -d);
        outline.lineTo(w, d);
        outline.lineTo(-w, d);
        outline.closePath();
        const geometry = new T.ExtrudeGeometry(outline, {
          depth: height - 2 * r, steps: 1, bevelEnabled: true,
          bevelSize: r, bevelThickness: r, bevelSegments: 2, curveSegments: 2
        });
        geometry.rotateX(-PI / 2);
        geometry.translate(0, -height / 2 + r, 0);
        geometry.computeVertexNormals();
        return geometry;
      });
    }

    mesh(geometry, color, x, y, z, parent, yaw = 0) {
      const material = typeof color === 'string' || typeof color === 'number' ? this.material(color) : color;
      const model = new T.Mesh(geometry, material);
      model.position.set(x, y, z);
      model.rotation.y = yaw;
      parent.add(model);
      return model;
    }

    block(width, height, depth, color, x, y, z, parent, radius = .12, yaw = 0) {
      return this.mesh(this.rounded(width, height, depth, radius), color, x, y, z, parent, yaw);
    }

    batch(geometry, color, x, y, z, sx = 1, sy = 1, sz = 1, yaw = 0) {
      const material = this.material(color);
      const key = `${geometry.id}/${material.id}`;
      if (!this.batches.has(key)) this.batches.set(key, { geometry, material, transforms: [] });
      this.dummy.position.set(x, y, z);
      this.dummy.rotation.set(0, yaw, 0);
      this.dummy.scale.set(sx, sy, sz);
      this.dummy.updateMatrix();
      this.batches.get(key).transforms.push(this.dummy.matrix.clone());
    }

    flat(width, height, depth, color, x, y, z, yaw = 0) {
      const geometry = this.shape('unit-box', () => new T.BoxGeometry(1, 1, 1));
      this.batch(geometry, color, x, y, z, width, height, depth, yaw);
    }

    flushBatches() {
      for (const { geometry, material, transforms } of this.batches.values()) {
        const model = new T.InstancedMesh(geometry, material, transforms.length);
        transforms.forEach((transform, index) => model.setMatrixAt(index, transform));
        this.scene.add(model);
      }
      this.batches.clear();
    }

    createShadowMaterial() {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const context = canvas.getContext('2d');
      const gradient = context.createRadialGradient(32, 32, 7, 32, 32, 32);
      gradient.addColorStop(0, '#263c505e');
      gradient.addColorStop(.55, '#263c5030');
      gradient.addColorStop(1, '#263c5000');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
      return new T.MeshBasicMaterial({
        map: new T.CanvasTexture(canvas), transparent: true, depthWrite: false, polygonOffset: true,
        polygonOffsetFactor: -1, polygonOffsetUnits: -1
      });
    }

    shadow(width, depth, x, z, parent, y = .08) {
      const geometry = this.shape('shadow-plane', () => new T.PlaneGeometry(1, 1).rotateX(-PI / 2));
      const shadow = this.mesh(geometry, this.shadowMaterial, x, y, z, parent);
      shadow.scale.set(width, 1, depth);
    }

    tree(x, z, size = 1, light = false) {
      const cylinder = this.shape('unit-cylinder', () => new T.CylinderGeometry(1, 1, 1, 10));
      const crown = this.shape('tree-ball', () => new T.SphereGeometry(1, 10, 8));
      this.flat(2.7 * size, .17, 2.7 * size, palette.grass, x, .47, z);
      this.batch(cylinder, '#a77d66', x, 1.53 * size + .3, z, .19 * size, 2.6 * size, .19 * size);
      for (const [dx, dy, dz, radius, hue] of [
        [0, 3.8, 0, 1.34, palette.mint], [-.88, 3.25, .26, 1.02, palette.jade],
        [.83, 3.25, .41, .96, palette.foliage], [.13, 4.5, -.33, .86, '#b2cd88']
      ]) {
        this.batch(crown, light && hue === palette.jade ? palette.foliage : hue,
          x + dx * size, dy * size + .25, z + dz * size, radius * size, radius * size, radius * size);
      }
    }

    building(x, z, width, depth, height, facade, roof, cafe = false) {
      this.block(width + .75, .45, depth + .75, '#c9bba7', x, .58, z, this.scene, .16);
      this.block(width, height, depth, facade, x, height / 2 + .64, z, this.scene, .45);
      this.block(width + .62, .52, depth + .62, roof, x, height + .66, z, this.scene, .19);
      this.block(width - 1.1, .24, depth - 1.1, '#e5d9c5', x, height + .98, z, this.scene, .09);
      this.flat(3.5, .45, 2.2, '#c6beb0', x + 2, height + 1.25, z - 2);
      this.flat(1.4, .55, 2.8, '#d3c8b4', x - 3, height + 1.29, z + 1.5);

      const columns = Math.floor((width - 2) / 3.25);
      const rows = Math.floor((height - 1) / 2.7);
      for (let row = 0; row < rows; row++) {
        const y = height - 1.3 - row * 2.65;
        for (let column = 0; column < columns; column++) {
          const offset = (column - (columns - 1) / 2) * 3.15;
          for (const side of [-1, 1]) {
            const face = z + side * depth / 2;
            this.window(x + offset, y, face + side * .03, 0, side, column % 3 === 0);
          }
        }
        const sideColumns = Math.floor((depth - 2) / 3.25);
        for (let column = 0; column < sideColumns; column++) {
          const offset = (column - (sideColumns - 1) / 2) * 3.15;
          for (const side of [-1, 1]) {
            this.window(x + side * (width / 2 + .04), y, z + offset, PI / 2, side, column % 3 === 1);
          }
        }
      }

      const side = z > 0 ? -1 : 1;
      const front = z + side * depth / 2;
      this.flat(6, 2.5, .14, palette.slate, x, 1.82, front + side * .11);
      for (const dx of [-1.95, 0, 1.95]) {
        this.flat(1.8, 1.67, .15, palette.glassLight, x + dx, 2.03, front + side * .2);
      }
      if (cafe) {
        for (let i = 0; i < 10; i++) {
          const stripe = i % 2 ? palette.cream : palette.coral;
          const xx = x + (i - 4.5) * .67;
          this.block(.68, .19, 1.75, stripe, xx, 3.18, front + side * .75, this.scene, .065);
          this.block(.68, .44, .21, stripe, xx, 3.04, front + side * 1.6, this.scene, .07);
        }
        this.flat(5.7, .86, .17, palette.coralDark, x, 3.95, front + side * .14);
        this.cafeSign(x, 3.96, front + side * .24, side === 1 ? 0 : PI);
      } else {
        this.flat(6.5, .28, 1.35, roof, x, 3.27, front + side * .52);
      }
    }

    window(x, y, z, yaw, side, bright) {
      this.flat(1.58, 1.46, .16, '#eadcc5', x, y, z, yaw);
      const dx = yaw === 0 ? 0 : side * .10;
      const dz = yaw === 0 ? side * .10 : 0;
      this.flat(1.24, 1.13, .08, bright ? palette.glassLight : palette.glass, x + dx, y + .04, z + dz, yaw);
      this.flat(.09, 1.1, .11, '#f4e9d2', x + dx, y + .04, z + dz, yaw);
      this.flat(1.72, .15, .30, '#f1e2ce', x + dx, y - .69, z + dz, yaw);
    }

    cafeSign(x, y, z, yaw) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 42;
      const context = canvas.getContext('2d');
      context.fillStyle = '#bf5e58';
      context.fillRect(0, 0, 256, 42);
      context.fillStyle = '#fff3db';
      context.font = 'bold 24px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('CORNER CAFÉ', 128, 22);
      const map = new T.CanvasTexture(canvas);
      map.colorSpace = T.SRGBColorSpace;
      this.mesh(new T.PlaneGeometry(5.5, .84), new T.MeshBasicMaterial({ map }), x, y, z, this.scene, yaw);
    }

    signal(x, z, yaw) {
      const pole = this.shape('unit-cylinder', () => new T.CylinderGeometry(1, 1, 1, 10));
      const housing = this.rounded(.61, 1.34, .52, .12);
      const lens = this.shape('unit-lens', () => new T.SphereGeometry(1, 9, 6));
      this.batch(pole, '#627b7e', x, 2.01, z, .091, 3.4, .091);
      this.batch(housing, palette.slate, x, 3.9, z, 1, 1, 1, yaw);
      for (const [i, color] of ['#e28a73', '#f1c072', '#9bca91'].entries()) {
        this.batch(lens, color, x + Math.sin(yaw) * .265, 4.25 - .34 * i,
          z + Math.cos(yaw) * .265, .148, .148, .148);
      }
    }

    buildWorld() {
      this.block(116, 1.6, 116, palette.base, 0, -.91, 0, this.scene, .62);
      this.flat(22, .05, 115.6, palette.road, 0, .015, 0);
      this.flat(115.6, .04, 22, palette.road, 0, .021, 0);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const x = sx * 34.4;
          const z = sz * 34.4;
          this.block(46.8, .48, 46.8, palette.curb, x, .21, z, this.scene, .22);
          this.flat(45.8, .06, 45.8, palette.walk, x, .47, z);
          this.flat(10.5, .055, 10.5, '#eae2d3', sx * 17.6, .506, sz * 17.6);
          for (let grid = 0; grid < 5; grid++) {
            const offset = 12.8 + grid * 2.4;
            this.flat(.045, .009, 11.4, '#d2c6b6', sx * offset, .54, sz * 17.6);
            this.flat(11.4, .009, .045, '#d2c6b6', sx * 17.6, .54, sz * offset);
          }
        }
      }
      for (const side of [-1, 1]) {
        for (let stripe = -5; stripe <= 5; stripe++) {
          const offset = 1.71 * stripe;
          this.flat(.91, .015, 3.35, palette.paint, offset, .058, side * 13.4);
          this.flat(3.35, .015, .91, palette.paint, side * 13.4, .059, offset);
        }
        this.flat(8.8, .016, .31, palette.paint, -side * 5.14, .055, side * 16.0);
        this.flat(.31, .016, 8.8, palette.paint, side * 16.0, .056, side * 5.14);
        for (let d = 20; d < 57; d += 5.4) {
          for (const lane of [-6.85, 6.85]) {
            this.flat(.12, .012, 2.55, '#b7bcc3', lane, .052, side * d);
            this.flat(2.55, .012, .12, '#b7bcc3', side * d, .052, lane);
          }
          for (const centre of [-.18, .18]) {
            this.flat(.11, .012, 3.4, '#e6ba72', centre, .051, side * d);
            this.flat(3.4, .012, .11, '#e6ba72', side * d, .051, centre);
          }
        }
      }

      this.building(-29, -29, 19, 19, 10.4, palette.cream, '#9cb1c6');
      this.building(28, -28, 18, 18, 7.8, '#f3dec2', '#9cc2a6');
      this.building(-28, 28, 17, 15, 6.1, '#f4c7a9', palette.coral, true);
      this.building(33, 33, 17, 16, 5.6, '#e7d8e5', '#b6a6c8');
      this.building(-47, -33, 10, 16, 5.8, '#e9dfca', '#b1b8a9');
      this.building(45, -32, 11, 15, 6.8, '#f2e0cc', '#d0a988');

      for (const [x, z, size] of [
        [-17, 19, 1], [-18.5, 36, .84], [16, 19, .92], [23, 19, .81],
        [-17, -17.5, .91], [-44, -16, 1.08], [18.5, -18, .86], [36.5, -15.4, .95],
        [-41, 16, .96], [41, 16, .94], [16, 40, .85], [-17, -44, .83]
      ]) this.tree(x, z, size, x > 0);
      for (const [x, z, yaw] of [[-12, 17.7, 0], [12, -17.7, PI], [17.7, 12, PI / 2], [-17.7, -12, -PI / 2]]) {
        this.signal(x, z, yaw);
      }
      for (const x of [-24, -30]) {
        const top = this.shape('cafe-table', () => new T.CylinderGeometry(.62, .62, .11, 12));
        this.batch(top, '#d28e70', x, 1.19, 18.0);
        this.flat(.13, .68, .13, palette.slate, x, .82, 18.0);
        this.flat(.63, .38, .65, '#e6b789', x, .77, 16.95);
        this.flat(.63, .38, .65, '#e6b789', x, .77, 19.05);
      }
      this.block(2.65, .28, 6.3, '#78a9a2', 13.7, 3.05, 31, this.scene, .12);
      for (const z of [28.3, 33.7]) this.flat(.11, 2.5, .11, '#789c9b', 13.7, 1.77, z);
      this.flat(1.4, .31, 4.4, '#c99578', 14.0, 1.04, 31);
    }

    wheel(x, y, z, radius, width, parent) {
      const tyre = this.shape(`tyre/${radius}/${width}`, () => new T.CylinderGeometry(radius, radius, width, 12).rotateZ(PI / 2));
      const hub = this.shape(`hub/${radius}/${width}`, () => new T.CylinderGeometry(radius * .52, radius * .52, width + .024, 10).rotateZ(PI / 2));
      this.mesh(tyre, palette.tyre, x, y, z, parent);
      this.mesh(hub, palette.wheel, x, y, z, parent);
    }

    vehicle(kind, color) {
      const van = kind === 'van';
      const bus = kind === 'minibus';
      const width = van ? 2.3 : bus ? 2.36 : 1.95;
      const length = van ? 6.1 : bus ? 6.3 : 4.45;
      const group = new T.Group();
      this.shadow(width * 1.8, length * 1.24, 0, 0, group);
      this.block(width, .68, length, color, 0, .69, 0, group, .21);

      if (van) {
        this.block(width, 2.40, 4.04, color, 0, 2.05, -.95, group, .12);
        this.block(width * .91, 1.28, 1.73, '#f0c478', 0, 1.45, 1.93, group, .16);
        this.block(width * .78, .57, .11, palette.slate, 0, 1.63, 2.75, group, .05);
        for (const side of [-1, 1]) {
          this.block(.07, .53, 1.04, palette.glass, side * width * .456, 1.62, 1.99, group, .025);
          this.block(.036, 1.11, 1.92, '#eac987', side * width * .505, 2.06, -.90, group, .012);
        }
        this.block(1.79, 1.82, .11, '#edc579', 0, 2.0, -2.98, group, .05);
        this.block(.045, 1.63, .039, '#c2934b', 0, 2.0, -3.04, group, .012);
      } else {
        const cabinHeight = bus ? 1.38 : .77;
        const cabinLength = bus ? length * .83 : length * .54;
        const cabinY = bus ? 1.57 : 1.31;
        this.block(width * .87, cabinHeight, cabinLength, palette.slate, 0, cabinY, .08, group, .24);
        this.block(width * .79, .21, cabinLength * .80, color, 0, cabinY + cabinHeight / 2 - .05, .08, group, .09);
        for (const side of [-1, 1]) {
          const sections = bus ? [-1.68, -.55, .55, 1.67] : [-.51, .51];
          for (const offset of sections) {
            this.block(.058, bus ? .70 : .40, bus ? .99 : .79, palette.glassLight,
              side * width * .437, cabinY - .06, offset, group, .018);
          }
        }
        this.block(width * .74, bus ? .69 : .40, .082, palette.glass, 0, cabinY - .045,
          .08 + cabinLength * .5, group, .025);
        this.block(width * .71, bus ? .61 : .36, .082, palette.glass, 0, cabinY - .045,
          .08 - cabinLength * .5, group, .025);
        this.block(.54, .15, .53, palette.glassLight, 0, cabinY + cabinHeight / 2 + .10, .15, group, .06);
      }

      const brakes = [];
      for (const side of [-1, 1]) {
        for (const end of [-1, 1]) {
          this.wheel(side * width * .48, .37, end * length * .31, .36, .26, group);
        }
        this.block(.34, .16, .11, '#fff4c9', side * width * .32, .79, length * .5, group, .055);
        brakes.push(this.block(.31, .14, .10, '#cf7167', side * width * .32, .75,
          -length * .5, group, .052));
      }
      this.block(width * .66, .10, .10, '#c6cbd1', 0, .49, length * .5 + .025, group, .045);
      group.userData.brakes = brakes;
      this.scene.add(group);
      return group;
    }

    rod(radius, color, start, end, parent) {
      const a = new T.Vector3(...start);
      const b = new T.Vector3(...end);
      const delta = b.clone().sub(a);
      const length = delta.length();
      const geometry = this.shape(`rod/${radius}/${length.toFixed(4)}`,
        () => new T.CylinderGeometry(radius, radius, length, 8));
      const midpoint = a.addScaledVector(delta, .5);
      const model = this.mesh(geometry, color, midpoint.x, midpoint.y, midpoint.z, parent);
      model.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
      return model;
    }

    person(kind, color) {
      const cycling = kind === 'cycle';
      const group = new T.Group();
      this.shadow(cycling ? 1.18 : 1.24, cycling ? 2.5 : .95, 0, 0, group);
      const trousers = '#5b607a';
      const skin = '#e8b596';
      const sphere = this.shape('head', () => new T.SphereGeometry(.245, 12, 10));
      const hair = this.shape('hair', () => new T.SphereGeometry(.251, 12, 8, 0, 2 * PI, 0, .59 * PI));
      const bodyY = cycling ? 1.27 : 1.22;
      const body = this.block(.47, .68, .36, color, 0, bodyY, cycling ? .14 : 0, group, .14);
      if (cycling) body.rotation.x = .22;
      this.mesh(sphere, skin, 0, bodyY + .53, cycling ? .28 : .04, group);
      this.mesh(hair, cycling ? '#f3cf79' : '#5f4b55', 0, bodyY + .59, cycling ? .27 : .01, group);
      const legs = [];
      for (const side of [-1, 1]) {
        const leg = new T.Group();
        leg.position.set(side * .128, bodyY - .26, 0);
        group.add(leg);
        this.block(.19, .67, .22, trousers, 0, -.34, 0, leg, .069);
        this.block(.205, .14, .33, '#eee4d7', 0, -.66, .064, leg, .057);
        if (cycling) leg.rotation.x = side * .39;
        legs.push(leg);
        this.rod(.087, color, [side * .22, bodyY + .19, 0],
          [side * .29, bodyY - .28, cycling ? .49 : .12], group);
      }
      group.userData.legs = legs;
      if (cycling) {
        const wheel = this.shape('bike-wheel', () => new T.TorusGeometry(.37, .037, 6, 18).rotateY(PI / 2));
        for (const end of [-1, 1]) this.mesh(wheel, palette.slate, 0, .41, end * .67, group);
        const frame = '#e49270';
        for (const [a, b] of [
          [[0, .40, -.68], [0, .90, -.20]], [[0, .90, -.20], [0, .74, .50]],
          [[0, .74, .50], [0, .40, .67]], [[0, .40, -.68], [0, .40, .0]],
          [[0, .40, 0], [0, .90, -.20]], [[0, .40, 0], [0, .74, .50]]
        ]) this.rod(.049, frame, a, b, group);
        this.rod(.047, palette.slate, [-.28, .99, .51], [.28, .99, .51], group);
        this.block(.21, .12, .27, palette.slate, 0, .97, -.20, group, .045);
      }
      this.scene.add(group);
      return group;
    }

    updateActors(frame) {
      for (const model of this.vehicles.values()) model.visible = false;
      for (const data of frame.vehicles || []) {
        const kind = data.kind || 'car';
        const color = data.color || (kind === 'van' ? palette.mustard : kind === 'minibus' ? palette.blue : palette.teal);
        const key = `${data.id}/${kind}/${color}`;
        if (!this.vehicles.has(key)) this.vehicles.set(key, this.vehicle(kind, color));
        const model = this.vehicles.get(key);
        model.visible = true;
        model.position.set(data.x, 0, data.z);
        model.rotation.y = data.yaw || 0;
        const material = this.material(data.brake ? '#ff785f' : '#cf7167');
        for (const light of model.userData.brakes) light.material = material;
      }
      for (const model of this.people.values()) model.visible = false;
      for (const data of frame.people || []) {
        const kind = data.kind || 'walker';
        const color = data.color || '#779fa6';
        const key = `${data.id}/${kind}/${color}`;
        if (!this.people.has(key)) this.people.set(key, this.person(kind, color));
        const model = this.people.get(key);
        model.visible = true;
        model.position.set(data.x, 0, data.z);
        model.rotation.y = data.yaw || 0;
        const phase = data.phase || 0;
        const stride = kind === 'cycle' ? .24 : .41;
        model.userData.legs.forEach((leg, index) => {
          leg.rotation.x = Math.sin(phase + index * PI) * stride;
        });
      }
    }

    updateRoutes(routes) {
      const key = routes?.length ? JSON.stringify(routes) : '';
      if (key === this.routeKey) return;
      this.routeKey = key;
      while (this.routeLayer.children.length) {
        const model = this.routeLayer.children[0];
        this.routeLayer.remove(model);
        model.geometry.dispose();
        model.material.dispose();
      }
      for (const route of routes || []) {
        if (!route.points || route.points.length < 2) continue;
        const points = route.points.map(([x, z]) => new T.Vector3(x, .115, z));
        const curve = new T.CatmullRomCurve3(points);
        const tube = new T.Mesh(new T.TubeGeometry(curve, 34, .17, 5, false),
          new T.MeshBasicMaterial({ color: route.color || '#b8f2c7', transparent: true, opacity: .92 }));
        this.routeLayer.add(tube);
      }
    }

    render(frame, width, height, camera = {}) {
      const aspect = width / height;
      this.renderer.setSize(width, height, false);
      if (camera.fov) {
        this.camera = this.perspective;
        this.camera.fov = camera.fov;
        this.camera.aspect = aspect;
      } else {
        const half = (camera.span || 55) / 2;
        this.camera = this.orthographic;
        this.camera.left = -half * aspect;
        this.camera.right = half * aspect;
        this.camera.top = half;
        this.camera.bottom = -half;
      }
      this.camera.position.set(camera.x ?? 29, camera.y ?? 40, camera.z ?? 43);
      this.camera.lookAt(camera.tx ?? -3, camera.ty ?? 0, camera.tz ?? 5);
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
      const late = T.MathUtils.clamp(frame.sun ?? 0, 0, 1);
      this.scene.background.copy(this.day).lerp(this.evening, late);
      this.scene.fog.color.copy(this.scene.background);
      this.sun.color.copy(this.sunDay).lerp(this.sunEvening, late);
      this.sun.position.set(-34, T.MathUtils.lerp(55, 13, late), 27);
      this.sun.intensity = T.MathUtils.lerp(2.45, 1.95, late);
      this.ambient.intensity = T.MathUtils.lerp(1.95, 1.39, late);
      this.updateActors(frame);
      this.updateRoutes(frame.routes);
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement;
    }

    project(x, y, z) {
      this.projected.set(x, y, z).project(this.camera);
      return { x: (this.projected.x + 1) / 2, y: (1 - this.projected.y) / 2 };
    }
  }

  root.ConceptJunction = ConceptJunction;
})(window);
