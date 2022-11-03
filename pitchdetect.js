window.AudioContext = window.AudioContext || window.webkitAudioContext

var audioContext = null
var isPlaying = false
var isquarterNoteDisplay = false
var sourceNode = null
var analyser = null
var theBuffer = null
var sampleRate
var DEBUGCANVAS = null
var mediaStreamSource = null
var detectorElem,
  canvasElem,
  waveCanvas,
  pitchElem,
  noteElem,
  detuneElem,
  detuneAmount
var MAX_SIZE
var lastItem
var soundPath = './audio/littleY.wav'
let barFlag=0;
let model;
const rhytmArr=[]
const notesArr = []
const pitchArr = []
const octaveArr = []
const sampleCounters = []
const howManyArr = [];
let sampleCounter = 0;
let prevNote = null;
let howMany = 0;
let prevNoteOctave = 0;

var rafID = null
var tracks = null
var buflen = 2048
var buf = new Float32Array(buflen)

var mt;
var songTempo;
var songBeats;

var amountContainerQuarter = 1
var currentContainerQuarter = null

var noteStrings = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]
var octave = {
  0: {
    start: 16.35,
    end: 31,
  },
  1: {
    start: 31.1,
    end: 63,
  },
  2: {
    start: 63.1,
    end: 125,
  },
  3: {
    start: 125.1,
    end: 247,
  },
  4: {
    start: 247.1,
    end: 495,
  },
  5: {
    start: 495.1,
    end: 990,
  },
  6: {
    start: 990.1,
    end: 1976,
  },
  7: {
    start: 1976.1,
    end: 3952,
  },
  8: {
    start: 3952.1,
    end: 7902.13,
  },
}
window.onload = function () {
  audioContext = new AudioContext()
  sampleRate = audioContext.sampleRate
  MAX_SIZE = Math.max(4, Math.floor(audioContext.sampleRate / 5000)) // corresponds to a 5kHz signal

  detectorElem = document.getElementById('detector')
  canvasElem = document.getElementById('output')
  DEBUGCANVAS = document.getElementById('waveform')
  
  if (DEBUGCANVAS) {
    waveCanvas = DEBUGCANVAS.getContext('2d')
    waveCanvas.strokeStyle = 'black'
    waveCanvas.lineWidth = 1
  }

  pitchElem = document.getElementById('pitch')
  noteElem = document.getElementById('note')
  detuneElem = document.getElementById('detune')
  detuneAmount = document.getElementById('detune_amt')

  detectorElem.ondragenter = function () {
    this.classList.add('droptarget')
    return false
  }

  detectorElem.ondragleave = function () {
    this.classList.remove('droptarget')
    return false
  }

  detectorElem.ondrop = function (e) {
    this.classList.remove('droptarget')
    e.preventDefault()
    theBuffer = null

    var reader = new FileReader()
    
    reader.onload = function (event) {
      audioContext.decodeAudioData(
        event.target.result,
        function (buffer) {
          theBuffer = buffer
        },
        function () {
          alert('error loading!')
        },
      )
    }

    reader.onerror = function (event) {
      alert('Error: ' + reader.error)
    }
    
    reader.readAsArrayBuffer(e.dataTransfer.files[0])
    
    return false
  }

  fetch(soundPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error, status = ${response.status}`)
      }
      return response.arrayBuffer()
    })
    .then((buffer) => audioContext.decodeAudioData(buffer))
    .then((decodedData) => {
      theBuffer = decodedData
    })
}

// =============================MACHINE LEARNING============= //

// loadModel().then(() => console.log("loaded"))
async function loadModel(){
  // tf.serilization.registerClass(CTCLayer);
  // model = tf.keras.models.load_model('my_model.h5', custom_objects={'CTClayer': CTCLayer})
  model = await tf.loadLayersModel('./model/modeljs/model.json');
  console.log("model loaded")
}

// ============================================================ //

function noteToLocation(note, pitch,octave) {
  let rotate = isRotate(pitch,octave)
  let start=-7;
  if(rotate && octave == 3){
    start = -101
  } else if (!rotate && octave == 4) {
    start = -7
  } else if (rotate && octave == 4) {
    start = -7
  } else if (!rotate && octave == 3) {
    start = -71
  }

  let location = start
  let finalLocation
  let labels = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  
  labels.map((label) => {
    if (pitch.includes(label)) {
      finalLocation = location.toFixed()
      return finalLocation
    }
    location += 5
  })

  return finalLocation
}

function startPitchDetect() {
  let buttonText = document.getElementById('live').textContent;
  if(buttonText !== 'Start'){
    lastItem = true
    // sourceNode.stop(0)
    sourceNode = null
    analyser = null
    isPlaying = false
    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = window.webkitCancelAnimationFrame
    window.cancelAnimationFrame(rafID)
    // prepare(theBuffer);
    buildNotes()
    return 'Start'
  }
  // grab an audio context
  audioContext = new AudioContext()

  // Attempt to get audio input
  navigator.mediaDevices
    .getUserMedia({
      audio: {
        mandatory: {
          googEchoCancellation: 'false',
          googAutoGainControl: 'false',
          googNoiseSuppression: 'false',
          googHighpassFilter: 'false',
        },
        optional: [],
      },
    })
    .then((stream) => {
      // Create an AudioNode from the stream.
      mediaStreamSource = audioContext.createMediaStreamSource(stream)

      // Connect it to the destination.
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      mediaStreamSource.connect(analyser)
      updatePitch()
    })
    .catch((err) => {
      // always check for errors at the end.
      console.error(`${err.name}: ${err.message}`)
      alert('Stream generation failed.')
    })
    return 'stop'
}

function getRhythm(index) {
  if (20 < howManyArr[index] && howManyArr[index] < 30) {
    barFlag++
    return 'quarter/'
  } else {
    barFlag += 2
    return 'half/'
  }
}
function isRotate(note,octave){
  const regular4 = ['C','D','E','F','G','A']
  const regular3 = 'C'
  let res = true
  if (octave == 4) {
    regular4.map((label) => {
      if (note.includes(label)) res = false
    })
  } else if (octave == 3) {
    if (note.includes(regular3)) return false
  }
  return res
}
function pickSvg(note, octave, index) {
  console.log('octave', octave)
  let rotate = isRotate(note, octave)
  let rhytm = getRhythm(index)
  rhytmArr.push(rhytm)
  let path = './img/notes/' + rhytm
  if (!rotate) {
    if (note.includes('C') && octave == 4) {
      return path + 'lineNote.svg'
    }
    return path + 'note.svg'
  } else {
    return path + 'note_Rotate.svg'
  }
}

function toggleOscillator() {
  if (isPlaying) {
    //stop playing and return
    sourceNode.stop(0)
    sourceNode = null
    analyser = null
    isPlaying = false
    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = window.webkitCancelAnimationFrame
    window.cancelAnimationFrame(rafID)
    return 'play oscillator'
  }
  sourceNode = audioContext.createOscillator()

  analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  sourceNode.connect(analyser)
  analyser.connect(audioContext.destination)
  sourceNode.start(0)
  isPlaying = true
  isLiveInput = false
  updatePitch()

  return 'stop'
}

function toggleLiveInput() {
  if (isPlaying) {
    //stop playing and return
    sourceNode.stop(0)
    sourceNode = null
    analyser = null
    isPlaying = false
    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = window.webkitCancelAnimationFrame
    window.cancelAnimationFrame(rafID)
  }
  getUserMedia(
    {
      audio: {
        mandatory: {
          googEchoCancellation: 'false',
          googAutoGainControl: 'false',
          googNoiseSuppression: 'false',
          googHighpassFilter: 'false',
        },
        optional: [],
      },
    },
    gotStream,
  )
}

// var BPMDetector = require('./bpmDetector.js')
function buildNotes() {
    console.log('buildNotes')
    if (currentContainerQuarter === null) {
      currentContainerQuarter = document.getElementById('containerQuarter0')
    }
    let distance = 50
    const isFlatArr = []
    let quarterLeftSize=[]
    let quarter, sharp, upperBar, lowerBar
    notesArr.map((note) => {
      console.log('note', note)
      isFlatArr.push(note.toString().includes('#') ? 'sharp' : false)
    })
    pitchArr.map((note, i) => {
      quarter = document.createElement('img')
      let rotate = isRotate(notesArr[i], octaveArr[i])
      if (isFlatArr[i] === 'sharp') {
        sharp = document.createElement('img')
        sharp.src = './img/flags/Sharp.svg'
        let bottomPos = Number(noteToLocation(note, notesArr[i], octaveArr[i]))
        !rotate ? (bottomPos -= 8) : (bottomPos += 20)
        sharp.style.bottom = bottomPos + 'px'
        sharp.style.position = 'absolute'
        sharp.style.left = distance - 10 + 'px'
        sharp.style.height = '30px'
        if(parseInt(sharp.style.left)>1100){
          quarterLeftSize.push(sharp)
        }else{
        currentContainerQuarter.appendChild(sharp)
        }
      }
      quarter.src = pickSvg(notesArr[i], octaveArr[i], i)
      quarter.style.bottom =
        noteToLocation(note, notesArr[i], octaveArr[i]) + 'px'
      quarter.style.position = 'absolute'
      quarter.style.left = distance + 'px'
      if(parseInt(quarter.style.left)>1100){
        quarterLeftSize.push(quarter)
      }else{
      currentContainerQuarter.appendChild(quarter)
      }
      distance += 50
      if (barFlag >= 4) {
        upperBar = document.createElement('img')
        lowerBar = document.createElement('img')
        upperBar.src = './img/staff/barLine.svg'
        lowerBar.src = './img/staff/barLine.svg'
        upperBar.style.position = 'absolute'
        lowerBar.style.position = 'absolute'
        upperBar.style.bottom = '9px'
        lowerBar.style.bottom = '-80px'

        upperBar.style.left = distance + 'px'
        lowerBar.style.left = distance + 'px'
        if(parseInt(lowerBar.style.left)>1100 || parseInt(upperBar.style.left)>1100){
          quarterLeftSize.push(lowerBar)
          quarterLeftSize.push(upperBar)
        }else{
        currentContainerQuarter.appendChild(lowerBar)
        currentContainerQuarter.appendChild(upperBar)
        }
        distance += 50
        barFlag = 0
      }
    })
    console.log('quarterLeftSize',quarterLeftSize)
    if(quarterLeftSize.length !=0 )
    {
      addMusicSheet(quarterLeftSize)
    }
    sampleCounter = 0
    howMany=0
  }

function togglePlayback() {
  if (isPlaying) {
    //stop playing and return
    lastItem = true
    sourceNode.stop(0)
    sourceNode = null
    analyser = null
    isPlaying = false
    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = window.webkitCancelAnimationFrame
    window.cancelAnimationFrame(rafID)
    prepare(theBuffer);
    buildNotes()
    console.log('notesarr', notesArr)
    console.log('howManyArr', howManyArr)
    console.log('picarr', pitchArr)

    return 'start'
  }
  sourceNode = audioContext.createBufferSource()
  console.log('so', sourceNode)
  sourceNode.buffer = theBuffer
  console.log('buff', sourceNode.buffer)
  sourceNode.loop = false

  analyser = audioContext.createAnalyser()
  analyser.fftSize = 1024
  sourceNode.connect(analyser)
  analyser.connect(audioContext.destination)
  console.log('audioContext.destination',audioContext.destination)
  sourceNode.start(0)
  isPlaying = true
  lastItem = false
  isLiveInput = false
  updatePitch()
  // let audioEnd=true //for now for the notes wont be on each other
  // if(audioEnd){
  //   notesArr=[]
  //   pitchArr=[]
  // }
  return 'stop'
}
function createLineImgs() {
  imgs = []
  for (var i = 0; i < 5; i++) {
    img = document.createElement('img')
    img.src = './img/staff/VerticalLine.svg'
    img.alt = 'Vertical Line'
    imgs.push(img)
  }
  return imgs
}
let marginTop = 250
let paddingTop = 50
function addMusicSheet(muiscNoteAppend) {
    imgArray = createLineImgs()
    root = document.getElementById('root')
    divCenter = document.createElement('div')
    divCenter.className = 'center'
    divCenter.style.marginTop = '180px'
    divNotesContainer = document.createElement('div')
    divNotesContainer.className = 'notes-container'
    divLinesContainer = document.createElement('div')
    divLinesContainer.className = 'lines-container'
    divLinesContainer.style.marginTop = '50px'
    divLinesContainer.style.marginBottom = '20px'
    gClef = document.createElement('img')
    gClef.className = 'GClefsvg'
    gClef.src = './img/staff/G-clef.svg'
    gClef.alt = 'GClef'
    divContainerQuarter = document.createElement('div')
    divContainerQuarter.id = 'containerQuarter' + amountContainerQuarter
    amountContainerQuarter++
    divLinesContainerSecondly = document.createElement('div')
    divLinesContainerSecondly.className = 'lines-container'
    divLinesContainerSecondly.style.marginTop = '20px'
    divLinesContainerSecondly.style.marginBottom = '50px'
    fClef = document.createElement('img')
    fClef.className = 'FClefsvg'
    fClef.src = './img/staff/FClef.svg'
    fClef.alt = 'FClef'

    root.appendChild(divCenter)
    divCenter.appendChild(divNotesContainer)
    divNotesContainer.appendChild(divLinesContainer)

    divLinesContainer.appendChild(gClef)
    for (let i = 0; i < 5; i++) {
      //TODO : the foreach below doesn't work properly'
      img = document.createElement('img')
      img.className = 'line'
      img.src = './img/staff/VerticalLine.svg'
      img.alt = 'Vertical Line'
      divLinesContainer.appendChild(img)
    }
    divLinesContainer.appendChild(divContainerQuarter)
    // imgArray.forEach((item)=>{
    //   divLinesContainer.appendChild(item);
    // });

    divNotesContainer.appendChild(divLinesContainerSecondly)
    divLinesContainerSecondly.appendChild(fClef)
    imgArray.forEach((item) => {
      divLinesContainerSecondly.appendChild(item)
    }) 
    currentContainerQuarter=divContainerQuarter
    appdedNotes(muiscNoteAppend)
}
let distance = 50
function appdedNotes(muiscNoteAppend) {
  muiscNoteAppend.forEach((item) => {
    if (item.src.includes("sharp")) {
      item.style.left = distance - 10 + 'px'
      currentContainerQuarter.appendChild(item)
    }
    if(item.src.includes("quarter") || item.src.includes("half")) {
      item.style.left = distance + 'px'
      distance += 50
      currentContainerQuarter.appendChild(item)
    }
    if (item.src.includes("barLine")) {
      item.style.left = distance + 'px'
      distance += 50
      currentContainerQuarter.appendChild(item)
    }
  })
}

function clear() {
  console.log('clear')
  return document.getElementById('deafult_page')
}

function noteFromPitch(frequency) {
  var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2))
  return Math.round(noteNum) + 69
}

function frequencyFromNoteNumber(note) {
  return 440 * Math.pow(2, (note - 69) / 12)
}

function centsOffFromPitch(frequency, note) {
  return Math.floor(
    (1200 * Math.log(frequency / frequencyFromNoteNumber(note))) / Math.log(2),
  )
}

function autoCorrelate(buf, sampleRate) {
  // The Autocorrelate algorithm
  var SIZE = buf.length
  var rms = 0

  for (var i = 0; i < SIZE; i++) {
    var val = buf[i]
    rms += val * val
  }
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01)
    // not enough signal
    return -1

  var r1 = 0,
    r2 = SIZE - 1,
    thres = 0.2
  for (var i = 0; i < SIZE / 2; i++)
    if (Math.abs(buf[i]) < thres) {
      r1 = i
      break
    }
  for (var i = 1; i < SIZE / 2; i++)
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i
      break
    }

  buf = buf.slice(r1, r2)
  SIZE = buf.length

  var c = new Array(SIZE).fill(0)
  for (var i = 0; i < SIZE; i++)
    for (var j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i]

  var d = 0
  while (c[d] > c[d + 1]) d++
  var maxval = -1,
    maxpos = -1
  for (var i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i]
      maxpos = i
    }
  }
  var T0 = maxpos

  var x1 = c[T0 - 1],
    x2 = c[T0],
    x3 = c[T0 + 1]
  a = (x1 + x3 - 2 * x2) / 2
  b = (x3 - x1) / 2
  if (a) T0 = T0 - b / (2 * a)

  return sampleRate / T0
}

function updatePitch(time) {
  var cycles = new Array()
  analyser.getFloatTimeDomainData(buf)
  var ac = autoCorrelate(buf, audioContext.sampleRate)
  // TODO: Paint confidence meter on canvasElem here.

  if (DEBUGCANVAS) {
    // This draws the current waveform, useful for debugging
    waveCanvas.clearRect(0, 0, 512, 256)
    waveCanvas.strokeStyle = 'red'
    waveCanvas.beginPath()
    waveCanvas.moveTo(0, 0)
    waveCanvas.lineTo(0, 256)
    waveCanvas.moveTo(128, 0)
    waveCanvas.lineTo(128, 256)
    waveCanvas.moveTo(256, 0)
    waveCanvas.lineTo(256, 256)
    waveCanvas.moveTo(384, 0)
    waveCanvas.lineTo(384, 256)
    waveCanvas.moveTo(512, 0)
    waveCanvas.lineTo(512, 256)
    waveCanvas.stroke()
    waveCanvas.strokeStyle = 'black'
    waveCanvas.beginPath()
    waveCanvas.moveTo(0, buf[0])
    for (var i = 1; i < 512; i++) {
      waveCanvas.lineTo(i, 128 + buf[i] * 128)
    }
    waveCanvas.stroke()
  }

  // console.log('howMany',howMany)
  if (ac == -1) {
    setTimeout(() => {
      if (
        // prevNote != null
        //  && noteElem.innerText !== '-'
          // && 
          prevNoteOctave > 1 && prevNoteOctave < 6 &&
          sampleCounter > 20
          ) {
        console.log("inside ac =-1")
        notesArr.push(prevNote);
        pitchArr.push(prevPitch)
        octaveArr.push(prevNoteOctave)
        sampleCounters.push(sampleCounter)
        howManyArr.push(howMany)
        sampleCounter = 0
        prevNote = null;
        howMany = 0;
      }
      else if (prevNote == null || notesArr.length==0) {
        howMany = 0;
      }
      else {
        
          howMany++
          sampleCounter++

        
      }
    }, 20)
    detectorElem.className = 'vague'
    pitchElem.innerText = '--'
    noteElem.innerText = '-'
    detuneElem.className = ''
    detuneAmount.innerText = '--'
  } else {
    detectorElem.className = 'confident'
    pitch = ac
    pitchElem.innerText = Math.round(pitch)
    var note = noteFromPitch(pitch)

    let noteOctave = Math.floor(note / 12) - 1
    noteElem.innerHTML = noteStrings[note % 12] + noteOctave

    // if(prevNote !== noteStrings[note % 12] && sampleCounter > 20 && prevNoteOctave > 1 && prevNoteOctave < 6 ) {
    //   console.log("insida if")
    //   notesArr.push(prevNote);
    //   pitchArr.push(prevPitch)
    //   octaveArr.push(prevNoteOctave)
    //   sampleCounters.push(sampleCounter)
    //   howManyArr.push(howMany)
    // }
      
    if (prevNote == noteStrings[note % 12] && noteOctave > 1 && noteOctave < 6){ //|| notesArr == [] ){
      sampleCounter++
      howMany++;
    }
    // else{
    // sampleCounter++;
    // }
    prevPitch = note
    prevNoteOctave = noteOctave
    prevNote = noteStrings[note % 12]
    
    // console.log(noteOctave)

    var detune = centsOffFromPitch(pitch, note)
    if (detune == 0) {
      detuneElem.className = ''
      detuneAmount.innerHTML = '--'
    } else {
      if (detune < 0) detuneElem.className = 'flat'
      else detuneElem.className = 'sharp'
      detuneAmount.innerHTML = Math.abs(detune)
    }
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame
  rafID = window.requestAnimationFrame(updatePitch)
}

//======== BMP DETECTOR =================== //

function getTheBPM() {
  let demoSound = loadSound(soundPath)
  let phrase = new p5.Phrase('phrase')
}

function prepare(buffer) {
  var offlineContext = new OfflineAudioContext(
    1,
    buffer.length,
    buffer.sampleRate,
  )
  var source = offlineContext.createBufferSource()
  source.buffer = buffer
  var filter = offlineContext.createBiquadFilter()
  filter.type = 'lowpass'
  source.connect(filter)
  filter.connect(offlineContext.destination)
  source.start(0)
  offlineContext.startRendering()
  offlineContext.oncomplete = function (e) {
    process(e);
  };
}

function process(e) {
  // console.log("enter process",e)
  var filteredBuffer = e.renderedBuffer
  //If you want to analyze both channels, use the other channel later
  var data = filteredBuffer.getChannelData(0)
  mt = new MusicTempo(data)
  songTempo = mt.tempo
  songBeats = mt.beats
  while (mt.tempo < 70) mt.tempo *= 2
  while (mt.tempo > 140) mt.tempo /= 2
  console.log('tempo', mt.tempo)
  console.log('beats', mt.beats)
  var max = arrayMax(data)
  var min = arrayMin(data)
  var threshold = min + (max - min) * 0.8
  threshold = 0.01
  console.log('threshold', threshold)
  var peaks = getPeaksAtThreshold(data, threshold)
  var intervalCounts = countIntervalsBetweenNearbyPeaks(peaks)
  console.log(intervalCounts)
  var tempoCounts = groupNeighborsByTempo(intervalCounts)
  console.log(tempoCounts)
  tempoCounts.sort(function (a, b) {
    return b.count - a.count
  })
  let sum = 0
  tempoCounts.map((tempo) => (sum += tempo.tempo))
  let mean = sum / tempoCounts.length
  console.log(mean)
  if (tempoCounts.length) {
    console.log(tempoCounts[0].tempo)
    //   output.innerHTML = tempoCounts[0].tempo;
  }
}

// http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/
function getPeaksAtThreshold(data, threshold) {
  // console.log(`enter getPeaksAtThreshold data:${data} threshold:${threshold}`);
  var peaksArray = []
  var length = data.length
  for (var i = 0; i < length; ) {
    if (data[i] > threshold) {
      peaksArray.push(i)
      // Skip forward ~ 1/4s to get past this peak.
      i += 10000
    }
    i++
  }
  return peaksArray
}

function countIntervalsBetweenNearbyPeaks(peaks) {
  // console.log(`enter countIntervalsBetweenNearbyPeaks peaks: ${peaks}`)
  var intervalCounts = []
  peaks.forEach(function (peak, index) {
    for (var i = 0; i < 10; i++) {
      var interval = peaks[index + i] - peak
      var foundInterval = intervalCounts.some(function (intervalCount) {
        if (intervalCount.interval === interval) return intervalCount.count++
      })
      //Additional checks to avoid infinite loops in later processing
      if (!isNaN(interval) && interval !== 0 && !foundInterval) {
        intervalCounts.push({
          interval: interval,
          count: 1,
        })
      }
    }
  })
  return intervalCounts
}

function groupNeighborsByTempo(intervalCounts) {
  // console.log(`enter groupNeighborsByTempo intervalCounts: ${intervalCounts}`)
  var tempoCounts = []
  intervalCounts.forEach(function (intervalCount) {
    //Convert an interval to tempo
    var theoreticalTempo = 60 / (intervalCount.interval / sampleRate)
    theoreticalTempo = Math.round(theoreticalTempo)

    if (theoreticalTempo === 0) {
      return
    }
    // Adjust the tempo to fit within the 90-180 BPM range
    while (theoreticalTempo < 70) theoreticalTempo *= 2
    while (theoreticalTempo > 140) theoreticalTempo /= 2

    var foundTempo = tempoCounts.some(function (tempoCount) {
      if (tempoCount.tempo === theoreticalTempo)
        return (tempoCount.count += intervalCount.count)
    })
    if (
      !foundTempo &&
      theoreticalTempo < Number(mt.tempo) + 10 &&
      theoreticalTempo > Number(mt.tempo) - 10
    ) {
      tempoCounts.push({
        tempo: theoreticalTempo,
        count: intervalCount.count,
      })
    }
  })
  return tempoCounts
}

// http://stackoverflow.com/questions/1669190/javascript-min-max-array-values
function arrayMin(arr) {
  var len = arr.length,
    min = Infinity
  while (len--) {
    if (arr[len] < min) {
      min = arr[len]
    }
  }
  return min
}

function arrayMax(arr) {
  var len = arr.length,
    max = -Infinity
  while (len--) {
    if (arr[len] > max) {
      max = arr[len]
    }
  }
  return max;
}