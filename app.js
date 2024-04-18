const AUDIO_BLOCKS = [
  document.getElementById("cymbal"),
  document.getElementById("synths"),
  document.getElementById("hiHat1"),
  document.getElementById("hiHat2"),
  document.getElementById("snare"),
  document.getElementById("kick"),
  document.getElementById("bass"),
];

const STARS = document.getElementById("stars")
const GLASS = document.getElementById("glass")
const LOADING_SCREEN = document.getElementById("loader")

const PLAY_PAUSE_BTN = document.getElementById("playPause");
const RESET_BTN = document.getElementById("reset");
const PLAY_ICON = '<i class="fa-solid fa-play"></i>';
const PAUSE_ICON = '<i class="fa-solid fa-pause"></i>';

const SCALES = {
  cymbal: 0.75,
  synths: 3,
  hiHat1: 1.2,
  hiHat2: 1.2,
  snare: 0.2,
  kick: 1,
  bass: 0.3,
};

let isPlaying = false
let animationIds = AUDIO_BLOCKS.reduce(function createKeyForAnimationId(accum, val) {
  accum[val.id] = null;
  return accum;
}, {});
let context = new AudioContext();
const sources = {};

(function init() {
  AUDIO_BLOCKS.forEach(function createMediaSource(block) {
    const id = block.id;
    const music = getAudioTrack(block);
    const analyser = context.createAnalyser();
    const source = context.createMediaElementSource(music);
    source.connect(analyser);
    analyser.connect(context.destination);
    sources[id] = analyser;
    music.load()
    music.addEventListener('canplaythrough', () => {
      console.log('lets goooo', id)
    })
  });
  PLAY_PAUSE_BTN.innerHTML = PLAY_ICON;
  PLAY_PAUSE_BTN.addEventListener("click", togglePlaying);
  RESET_BTN.addEventListener("click", reset)
})();

function togglePlaying() {
  isPlaying = !isPlaying;
  isPlaying ? startContext() : stopContext();
  AUDIO_BLOCKS.forEach(isPlaying ? playTrack : pauseTrack);
  PLAY_PAUSE_BTN.innerHTML = isPlaying ? PAUSE_ICON : PLAY_ICON;
}

function getVisual(el) {
  return el.children[0];
}

function getAudioTrack(el) {
  return el.children[1];
}

function playTrack(block) {
  const id = block.id;
  const visualToChange = getVisual(block);
  const music = getAudioTrack(block);
  music.play();
  const analyser = sources[id];
  animationIds[id] = getNextFrame(id, visualToChange, analyser);
  document.body.style.cursor = "none"
  if (LOADING_SCREEN.style.display === "flex") LOADING_SCREEN.style.display = "none"

  music.addEventListener('waiting', function letLoad(e) {
    AUDIO_BLOCKS.forEach(pauseTrack);
    LOADING_SCREEN.style.display = "flex"
    music.addEventListener('canplay', () => {
      AUDIO_BLOCKS.forEach(playTrack)
      LOADING_SCREEN.style.display = "none"
    })
  })
  music.addEventListener("ended", function resetTrack(e) {
    e.target.currentTime = 0
    isPlaying = false
    PLAY_PAUSE_BTN.innerHTML = PLAY_ICON;
    document.body.style.cursor = "auto"
  })
}

function pauseTrack(block) {
  stopContext()
  getAudioTrack(block).pause();
  cancelAnimationFrame(animationIds[block.id]);
  PLAY_PAUSE_BTN.innerHTML = PLAY_ICON;
  document.body.style.cursor = "auto"
}

function reset() {
  if (isPlaying) AUDIO_BLOCKS.forEach(pauseTrack)
  AUDIO_BLOCKS.forEach(function resetTrack(block) {
    const id = block.id
    const music = getAudioTrack(block)
    const visualToChange = getVisual(block)
    music.currentTime = 0
    const timer = setTimeout(() => {
      if (id === 'hiHat1') {
        visualToChange.style.opacity = 0
        GLASS.style.opacity = 0
      } else if (id === "hiHat2") {
        visualToChange.style.opacity = 0
        STARS.style.opacity = 0
      } else if (id === "kick") {
        visualToChange.style.transform = `translateX(-50%) scale(0)`;
        visualToChange.style.opacity = 0
        visualToChange.style.filter = `saturate(0%)`
      } else if (id === "snare") {
        visualToChange.style.transform = `scale(0)`;
        visualToChange.style.filter = `saturate(0%)`
      } else if (id === "bass") {
        visualToChange.style.transform = `translateX(-50%) scale(0)`;
        visualToChange.style.opacity = 0
      } else if (id === "cymbal") {
        visualToChange.style.filter = `contrast(0%)`
        visualToChange.style.transform = `translateX(-50%) scale(0)`;
      } else if (id === "synths") {
        visualToChange.style.backgroundColor = "#000000"
        visualToChange.style.opacity = 0
      } 
      clearTimeout(timer)
    }, 100)
  })
}

function getNextFrame(id, visualToChange, analyser) {
  const fbcArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(fbcArray);
  
  const average = fbcArray.reduce((accum, val) => accum + val, 0) / fbcArray.length;
  if (id === 'hiHat1') {
    visualToChange.style.opacity = (average / 100) * SCALES[id]
    GLASS.style.opacity = (average / 500) * SCALES[id]
  } else if (id === "hiHat2") {
    visualToChange.style.opacity = (average / 100) * SCALES[id]
    STARS.style.opacity = (average / 200) * SCALES[id]
  } else if (id === "kick") {
    visualToChange.style.transform = `translateX(-50%) scale(${average * SCALES[id]})`;
    visualToChange.style.opacity = (average / 10) * SCALES[id]
    visualToChange.style.filter = `saturate(${average * (SCALES[id] * 50)}%)`
  } else if (id === "snare") {
    visualToChange.style.transform = `scale(${average * SCALES[id]})`;
    visualToChange.style.filter = `saturate(${average * (SCALES[id] * 20)}%)`
  } else if (id === "bass") {
    visualToChange.style.transform = `translateX(-50%) scale(${average * SCALES[id]})`;
    visualToChange.style.opacity = (average / 10) * SCALES[id]
  } else if (id === "cymbal") {
    visualToChange.style.filter = `contrast(${average * (SCALES[id] * 20)}%)`
    visualToChange.style.transform = `translateX(-50%) scale(${average * SCALES[id]})`;
  } else if (id === "synths") {
    visualToChange.style.backgroundColor = generateColor((average * SCALES[id]) % 12)
    visualToChange.style.opacity = (average / 100) * SCALES[id]
  } 
  if (isPlaying) {
    requestAnimationFrame(() => getNextFrame(id, visualToChange, analyser));
  }
}

function startContext() {
  context.resume();
}

function stopContext() {
  context.suspend();
}

function generateColor(step) {
  // based on http://stackoverflow.com/a/7419630
  // Adam Cole, 2011-Sept-14
  let red = 0, green = 0, blue = 0;
  const hue = step * 6
  const i = ~~hue;
  const f = hue - i;
  const q = 1 - f;
  switch(i % 6){
    case 0: red = 1, green = f, blue = 0; break;
    case 1: red = q, green = 1, blue = 0; break;
    case 2: red = 0, green = 1, blue = f; break;
    case 3: red = 0, green = q, blue = 1; break;
    case 4: red = f, green = 0, blue = 1; break;
    case 5: red = 1, green = 0, blue = q; break;
  }
  const redHex = generateHex(red)
  const greenHex = generateHex(green)
  const blueHex = generateHex(blue)
  const color = "#" + redHex + greenHex + blueHex;
  return color;
}

function generateHex(step) {
  return ("00" + (~ ~(step * 235)).toString(16)).slice(-2);
}
