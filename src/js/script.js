const THREE = require(`three`);
const collada = require(`three-loaders-collada`)(THREE);

import StereoEffect from './StereoEffect';

console.log(StereoEffect);
console.log(THREE);
console.log(collada);

{
  let scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container, effect;

  let zRotation = 0;
  let flapspeed = 10;
  const zPos = 0;

  //const collisionWidth = 20;
  const nTrees = 100;
  const gameSpeed = Math.PI / 400;
  const zAxis = new THREE.Vector3(0, 0, 1);
  const xAxis = new THREE.Vector3(1, 0, 0);

  const pop = new Audio(`../assets/audio/pop.mp3`);
  const slide = new Audio(`../assets/audio/slide.aiff`);
  //const opus = new Audio(`../assets/audio/opus.mp3`);


  console.log(gameSpeed, xAxis);


  let vr = false;
  let fullscreen = false;
  let beta, gamma;

  const Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
    shamrock: 0x38FD99
  };

  const createScene = () => {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    scene = new THREE.Scene();

    scene.fog = new THREE.Fog(0x000A54, 100, 500);

    // Create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 120;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
      fieldOfView,
      aspectRatio,
      nearPlane,
      farPlane
    );

    camera.position.x = 0;
    camera.position.z = zPos + 50;
    camera.position.y = 100;

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });

    renderer.setSize(WIDTH, HEIGHT);

    container = document.getElementById(`world`);
    container.appendChild(renderer.domElement);

    window.addEventListener(`resize`, handleWindowResize, false);

    effect = new THREE.StereoEffect(renderer);
    effect.setEyeSeparation(- 3);
    effect.setSize(window.innerWidth, window.innerHeight);
  };

  const handleWindowResize = () => {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
  };

  let fireflyLight;

  const createLights = () => {
    fireflyLight = new THREE.PointLight(0xFC6520, 1.5);
    fireflyLight.position.set(0, 100, zPos);
    scene.add(fireflyLight);
  };

  class Earth {
    constructor() {
      const geom = new THREE.SphereGeometry(1000, 50, 50);
      geom.applyMatrix(new THREE.Matrix4().makeRotationZ(- Math.PI / 2));

      const mat =
      new THREE.MeshPhongMaterial({
        color: Colors.shamrock,
        flatShading: true,
      });

      this.mesh = new THREE.Mesh(geom, mat);
    }
  }

  let earth;

  const createEarth = () => {
    earth = new Earth();
    earth.mesh.position.y = - 1000;
    scene.add(earth.mesh);
  };


  let treeInstance;

  const loadTree = () => {
    return new Promise(resolve => {
      const loader = new THREE.ColladaLoader();
      loader.load(`../assets/models/tree/tree.dae`, function colladaReady(result) {
        treeInstance = result.scene.children[0];

        treeInstance.scale.set(.2, .2, .2);
        treeInstance.position.set(0, 1000, 0);
        treeInstance.children[0].castShadow = true;
        treeInstance.children[0].recieveShadow = true;

        resolve(treeInstance);
      });
    });
  };


  let fireflyInstance;


  const loadFirefly = () => {
    return new Promise(resolve => {
      const loader = new THREE.ColladaLoader();
      loader.load(`../assets/models/firefly/firefly6.dae`, function colladaReady(result) {

        fireflyInstance = result.scene;

        fireflyInstance.scale.set(.5, .5, .5);
        fireflyInstance.position.set(0, 100, zPos);
        fireflyInstance.rotation.y = + Math.PI;
        resolve(fireflyInstance);
      });
    });
  };


  class Forrest {
    constructor() {

      this.mesh = new THREE.Object3D();


      for (let i = 0;i < nTrees;i ++) {

        const treeGroup = new THREE.Object3D();

        treeGroup.rotation.z = Math.random() * Math.PI * 2;
        treeGroup.rotation.y = Math.random() * Math.PI * 2;
        treeGroup.rotation.x = Math.random() * Math.PI * 2;

        const s = .7 + Math.random() * 1.5;
        treeGroup.scale.set(s, 1, s);

        treeGroup.add(treeInstance.clone());
        this.mesh.add(treeGroup);
      }
    }
  }

  let forrest;

  const createForrest = () => {
    forrest = new Forrest();
    forrest.mesh.position.y = - 1000;
    scene.add(forrest.mesh);
  };



  class Firefly {
    constructor() {
      this.mesh = new THREE.Object3D();
      this.mesh.add(fireflyInstance);
    }
  }

  let firefly;

  const createFirefly = () => {
    firefly = new Firefly();
    scene.add(firefly.mesh);
  };

  let rotWorldMatrix;

  const rotateAroundWorldAxis = (object, axis, radians) => {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
  };




  const loop = () => {



    forrest.mesh.children.forEach(object => {
      const position = new THREE.Vector3();
      position.setFromMatrixPosition(object.children[0].matrixWorld);
      if (position.y > - .2) {
        // if (position.x > - collisionWidth && position.x < collisionWidth) {
        //   if (position.z > 0 && position.z < collisionWidth) {
        pop.play();
        //   }
        // }
      }

      if (position.y > - .5) {
        slide.play();
      }

    });


    const leftWingAngle = fireflyInstance.children[1].rotation.z;

    fireflyInstance.children[1].rotation.z -= Math.PI / 180 * flapspeed;
    fireflyInstance.children[2].rotation.z += Math.PI / 180 * flapspeed;

    if (leftWingAngle <= 0) {
      flapspeed = 50;
    }
    if (leftWingAngle >= .5) {
      flapspeed = - 50;
    }


    rotateAroundWorldAxis(earth.mesh, xAxis, gameSpeed);
    rotateAroundWorldAxis(forrest.mesh, xAxis, gameSpeed);

    rotateAroundWorldAxis(earth.mesh, zAxis, Math.PI * zRotation);
    rotateAroundWorldAxis(forrest.mesh, zAxis, Math.PI * zRotation);

    camera.rotation.z = zRotation * - 100;

    fireflyInstance.rotation.z = zRotation * 300;

    if (zRotation > 0) {
      fireflyInstance.children[0].children[3].rotation.x = (Math.PI + (zRotation + Math.PI) * - 150);
    } if (zRotation < 0) {
      fireflyInstance.children[0].children[3].rotation.x = (Math.PI + (zRotation + Math.PI) * 150);
    } if (zRotation === 0) {
      fireflyInstance.children[0].children[3].rotation.x = Math.PI;
    }

    fireflyInstance.children[0].children[0].rotation.z = (Math.PI + (zRotation + Math.PI) * - 100);

    renderer.render(scene, camera);
    if (vr === true) {
      effect.render(scene, camera);
    }

    requestAnimationFrame(loop);
  };

  window.addEventListener(`deviceorientation`, handleOrientation, true);

  function handleOrientation(event) {
    beta = event.beta;
    gamma = event.gamma;
    pop.play();

    if (gamma < 0) {
      zRotation = beta / 10000;
    } if (gamma > 0) {
      if (beta > 0) {
        zRotation = (180 - beta) / 10000;
      } else {
        zRotation = ((beta + 180) * - 1) / 10000;
      }
    }
  }

  console.log(vr);

  const onVrButtonClick = e => {
    console.log(`toggleVr`);
    console.log(e);
    if (vr === true) {
      vr = false;
      renderer.setSize(WIDTH, HEIGHT);
    } else {
      vr = true;
    }
  };

  const vrButton = document.getElementById(`vr-button`);
  vrButton.addEventListener(`click`, onVrButtonClick);


  const onFullscreenButtonClick = e => {
    console.log(e);
    if (fullscreen === true) {
      document.webkitExitFullscreen();
      fullscreen = false;
    } else {
      container.webkitRequestFullscreen();
      fullscreen = true;
      screen.orientation.lock(`landscape-primary`);
      pop.play();
      pop.pause();
    }

  };

  const fullscreenButton = document.getElementById(`fullscreen-button`);
  fullscreenButton.addEventListener(`click`, onFullscreenButtonClick);

  document.addEventListener(`keydown`, onDocumentKeyDown, false);
  function onDocumentKeyDown(event) {
    const keyCode = event.which;
    if (keyCode === 68) {
      zRotation = .003;
      //object.rotation.z = .5;
    } else if (keyCode === 81) {
      zRotation = - .003;
    } else if (keyCode === 70) {
      container.requestFullscreen();
      console.log(`fullscreen`);
    }

  }

  document.addEventListener(`keyup`, onDocumentKeyUp, false);
  function onDocumentKeyUp(event) {
    const keyCode = event.which;
    if (keyCode === 68) {
      zRotation = 0;
    } else if (keyCode === 81) {
      zRotation = 0;
    }
  }


  const init = () => {
    Promise.resolve()
      .then(() => createScene())
      .then(() => loadTree())
      .then(treeInstance => scene.add(treeInstance))
      .then(() => loadFirefly())
      .then(fireflyInstance => scene.add(fireflyInstance))
      .then(() => createLights())
      .then(() => createForrest())
      .then(() => createEarth())
      .then(() => createFirefly())
      .then(() => loop());
  };
  init();
}
