const THREE = require(`three`);
const collada = require(`three-loaders-collada`)(THREE);

import StereoEffect from './StereoEffect';

console.log(StereoEffect);
console.log(THREE);
console.log(collada);

{
  let scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container, effect;

  let gameSpeed = 0.005;
  let yFactor = 0.0003;

  let gameStarted = false;
  let zRotation = 0;
  let flapspeed = 10;
  const zPos = 0;
  let gameOver = false;
  //let collision = false;
  let score = 0;
  let restartStarted = false;
  let passed = 0;
  let restartTime = 5;
  let countdownStarted = false;

  //let passedGameOver = 0;




  //const collisionWidth = 20;
  const nTrees = 120;
  const zAxis = new THREE.Vector3(0, 0, 1);
  const xAxis = new THREE.Vector3(1, 0, 0);
  const yAxis = new THREE.Vector3(0, 1, 0);

  const pop = new Audio(`../assets/audio/pop.mp3`);
  const leftSlide = new Audio(`../assets/audio/passby_left.mp3`);
  const rightSlide = new Audio(`../assets/audio/passby_right.mp3`);
  //const opus = new Audio(`../assets/audio/opus.mp3`);


  //console.log(gameSpeed, xAxis);


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
    earth: 0x65249F
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
      const geom = new THREE.DodecahedronGeometry(1010, 2);
      geom.applyMatrix(new THREE.Matrix4().makeRotationZ(- Math.PI / 2));

      const mat =
      new THREE.MeshPhongMaterial({
        color: Colors.earth,
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


  const collisionDetection = () => {
    forrest.mesh.children.forEach(object => {
      const position = new THREE.Vector3();
      position.setFromMatrixPosition(object.children[0].matrixWorld);
      if (position.y > - .2) {
        pop.play();
        gameOver = true;
        //collision = true;

      }

      if (position.y > - 2 && position.y < - .2) {
        if (position.x > 0) {
          rightSlide.play();
        } else {
          leftSlide.play();
        }
        console.log(`close one`);
      }

    });
  };

  const gameOverState = () => {
    gameOver = false;
    countdownStarted = false;
    gameStarted = false;
    gameSpeed = 0;
    flapspeed = 0;
    fireflyInstance.visible = false;

    const $endScreen = document.querySelectorAll(`.endscreen`);

    $endScreen.forEach(e => {
      e.classList.remove(`hidden`);
    });

    const $scoreBar = document.querySelectorAll(`.score-bar`);

    $scoreBar.forEach(e => {
      e.classList.add(`hidden`);
    });

    const $endScore = document.querySelectorAll(`.endscore`);

    $endScore.forEach(e => {
      e.innerHTML = score;
    });

    if (vr === true) {
      const $restartCountdown = document.querySelectorAll(`.auto-restart`);

      $restartCountdown.forEach(e => {
        e.classList.remove(`hidden`);
        e.innerHTML = `game will restart in 5 seconds`;

      });

      restartStarted = true;

      if (restartTime > 0) {
        const restartInterval = setInterval(function() {
          restartTime -= 1;
          $restartCountdown.forEach(e => {
            e.innerHTML = `game will restart in ${restartTime} seconds`;
          });
          if (restartTime === 0) {
            restartTime = 5;
            $restartCountdown.forEach(e => {
              e.classList.add(`hidden`);
            });
            clearInterval(restartInterval);

          }
        }, 1000);
      }
      setTimeout(restart, 5000);
    }

    if (vr === false) {
      const restartButton1 = document.querySelector(`.restart-button`);
      restartButton1.classList.remove(`hidden`);
      console.log(restartButton1);

      restartButton1.addEventListener(`click`, onRestartButtonClick);



    }

  };



  const countDown = s => {

    countdownStarted = true;

    document.querySelector(`.countdown`).innerHTML = s - passed;

    const $countDown = document.querySelectorAll(`.countdown`);

    $countDown.forEach(e => {
      e.innerHTML = s - passed;
    });


    if (passed < s) {
      const countdownInterval = setInterval(function() {
        passed += 1;
        $countDown.forEach(e => {
          e.innerHTML = s - passed;
        });
        if (passed === s) {
          passed = 0;
          gameStarted = true;
          const $scoreBar = document.querySelectorAll(`.score-bar`);
          $scoreBar.forEach(e => {
            e.classList.remove(`hidden`);
          });

          $countDown.forEach(e => {
            e.classList.add(`hidden`);
          });
          clearInterval(countdownInterval);

        }
      }, 1000);

    }
    //requestAnimationFrame(countDown);
  };

  //const divider = 1000;


  const restart = () => {

    if (restartStarted === true) {

      const $endScreen = document.querySelectorAll(`.endscreen`);

      $endScreen.forEach(e => {
        e.classList.add(`hidden`);
      });

      const $countDown = document.querySelectorAll(`.countdown`);

      $countDown.forEach(e => {
        e.classList.remove(`hidden`);
      });

      const $scoreBar = document.querySelectorAll(`.score-bar`);

      $scoreBar.forEach(e => {
        e.classList.add(`hidden`);
      });

      gameSpeed = 0.005;
      yFactor = 0.0003;
      gameStarted = false;
      zRotation = 0;
      flapspeed = 10;
      gameOver = false;
      score = 0;
      restartStarted = false;
      passed = 0;
      countDown(3);
    }

  };

  const loop = () => {
    if (gameStarted === false) {
      fireflyInstance.visible = false;
    }

    if (gameStarted === true) {
      score += 1;
      const runningScore = document.querySelectorAll(`.running-score`);

      runningScore.forEach(scoreField => {
        scoreField.innerHTML = score;
      });
      collisionDetection();
      gameSpeed += 0.000005;
      yFactor += 0.000000243;
      fireflyInstance.visible = true;

    }



    if (gameOver === true) {
      gameOverState();
    }


    const leftWingAngle = fireflyInstance.children[1].rotation.z;

    fireflyInstance.children[1].rotation.z -= Math.PI / 180 * flapspeed;
    fireflyInstance.children[2].rotation.z += Math.PI / 180 * flapspeed;

    if (leftWingAngle <= 0) {
      flapspeed = 50;
    }
    if (leftWingAngle >= .5) {
      flapspeed = - 50;
    }

    if (gameOver === false) {
      rotateAroundWorldAxis(earth.mesh, xAxis, gameSpeed);
      rotateAroundWorldAxis(forrest.mesh, xAxis, gameSpeed);

      if (countdownStarted === true) {
        rotateAroundWorldAxis(earth.mesh, zAxis, Math.PI * zRotation);
        rotateAroundWorldAxis(forrest.mesh, zAxis, Math.PI * zRotation);
      }
    }

    rotateAroundWorldAxis(earth.mesh, yAxis, Math.PI * yFactor);
    rotateAroundWorldAxis(forrest.mesh, yAxis, Math.PI * yFactor);


    if (fullscreen === false && gameStarted === false) {
      camera.rotation.z = 0;
    } else {
      camera.rotation.z = zRotation * - 100;

    }


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


    //pop.play();

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
    // console.log(`toggleVr`);
    console.log(e);
    // if (vr === true) {
    //   vr = false;
    //   renderer.setSize(WIDTH, HEIGHT);
    // } else {
    //   vr = true;
    // }
    document.querySelector(`.startscreen`).classList.add(`hidden`);
    document.querySelector(`.vr-content-left`).classList.add(`vr-left`);
    document.querySelector(`.vr-content-right`).classList.add(`vr-right`);
    document.querySelector(`.vr-content-right`).classList.remove(`hidden`);
    const autoRestart = document.querySelectorAll(`.auto-restart`);

    autoRestart.forEach(e => {
      e.classList.remove(`hidden`);
    });

    container.webkitRequestFullscreen();
    fullscreen = true;
    vr = true;
    countDown(10);

    screen.orientation.lock(`landscape-primary`);
    pop.play();
    pop.pause();
    leftSlide.play();
    leftSlide.pause();
    rightSlide.play();
    rightSlide.pause();

    //opus.play();
  };

  const vrButton = document.getElementById(`vr-button`);
  vrButton.addEventListener(`click`, onVrButtonClick);

  const onRestartButtonClick = e => {
    console.log(e);
    restartStarted = true;
    restart();
  };



  const onStartButtonClick = e => {
    document.querySelector(`.startscreen`).classList.add(`hidden`);
    console.log(e);
    if (fullscreen === true) {
      document.webkitExitFullscreen();
      fullscreen = false;
    } else {
      container.webkitRequestFullscreen();
      fullscreen = true;
      countDown(5);
      screen.orientation.lock(`landscape-primary`);
      pop.play();
      pop.pause();
      leftSlide.play();
      leftSlide.pause();
      rightSlide.play();
      rightSlide.pause();

      //opus.play();
    }

  };


  const fullscreenButton = document.getElementById(`fullscreen-button`);
  fullscreenButton.addEventListener(`click`, onStartButtonClick);

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
