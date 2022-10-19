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
var MAX_SIZE;
var lastItem;
var soundPath = './audio/littleY.wav'
let barFlag=0;

window.onload = function () {
  audioContext = new AudioContext()
  sampleRate = audioContext.sampleRate;
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
function noteToLocation(note, pitch,octave) {
  let rotate = isRotate(pitch,octave)
  let start=-7;
  if(rotate && octave == 3){
    start = -101
  }
  else if(!rotate && octave == 4){
    start = -7
  }
  else if(rotate && octave == 4){
    start = -7
  }
  else if(!rotate && octave == 3){
    start =-71
  }

  // let bottom = (rotate && octave == 3) ? -95 
  // : (rotate && octave==4)?  -7;
  let location = start
  let finalLocation
  labels = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
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
}
function getRhythm(index) {
  if (20 < howManyArr[index] && howManyArr[index] < 30){
    barFlag++;
    return 'quarter/';
  }
  else{
    barFlag+=2
    return 'half/';
  }
    

  // setTimeout(() => {let duration = index !== songBeats ? (Math.abs(songBeats[index] - songBeats[index+1])) : null},50)
  // console.log('duration',duration)
}
function isRotate(note,octave){
  const regular4 = ['C','D','E','F','G','A']
  const regular3 = 'C'
  let res=true;
  if(octave == 4){
    regular4.map(label => {
      if(note.includes(label)) res=false;
    })
  }
  else if(octave == 3){
      if(note.includes(regular3)) return false;   
  }
  return res
}
let rhytmArr=[]
function pickSvg(note, octave, index) {
  console.log('octave', octave)
  let rotate = isRotate(note,octave)
  let rhytm = getRhythm(index)
  rhytmArr.push(rhytm)
  let path = './img/notes/'+rhytm;
  if (!rotate) {
    if (note.includes('C') && octave == 4) {

      return path + 'lineNote.svg'
    }
      return path + 'note.svg'
    }
  else {
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


const notesArr = []
const pitchArr = []
const octaveArr = []
const sampleCounters = []
// var BPMDetector = require('./bpmDetector.js')
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
    let distance = 50
    const isFlatArr = []

    notesArr.map((note) => {
      isFlatArr.push(note.toString().includes('#') ? 'sharp' : false)
    })
    pitchArr.map((note, i) => {
      // console.log('note',note.toString())
      // const isFlat = note.toString().includes('#') ? 'sharp' : false;
      //const GDiv = document.getElementById('GClef')
      const divQuarter = document.getElementById('containerQuarterNoteGC')
      let quarter = document.createElement('img')
      let sharp = null
      // console.log(isFlatArr[i])
      // console.log('note',note.toString())
      // console.log('distance',distance)
      let rotate = isRotate(notesArr[i],octaveArr[i])
      if (isFlatArr[i] === 'sharp') {
        sharp = document.createElement('img')
        sharp.src = './img/flags/Sharp.svg'
        let bottomPos = Number(noteToLocation(note, notesArr[i],octaveArr[i]));
        !rotate ? bottomPos-= 8 : bottomPos +=20;
        sharp.style.bottom= bottomPos + 'px'
        sharp.style.position = 'absolute'
        // sharp.style.zIndex = -1
        sharp.style.left = distance - 10 + 'px'
        sharp.style.height = '30px'
        divQuarter.appendChild(sharp)
      }
      quarter.src = pickSvg(notesArr[i], octaveArr[i], i)
      quarter.style.bottom = noteToLocation(note, notesArr[i],octaveArr[i]) + 'px'
      quarter.style.position = 'absolute'
      // quarter.style.zIndex = -1
      quarter.style.left = distance + 'px'
      distance += 50
      divQuarter.appendChild(quarter)
      if(barFlag >= 4){
        let upperBar = document.createElement('img')
        let lowerBar = document.createElement('img')
        upperBar.src = './img/staff/barLine.svg'
        lowerBar.src = './img/staff/barLine.svg'
        upperBar.style.position = 'absolute'
        lowerBar.style.position = 'absolute'
        upperBar.style.bottom = '9px'
        lowerBar.style.bottom = '-80px'

        upperBar.style.left = distance + 'px'
        lowerBar.style.left = distance + 'px'
        distance += 50
        divQuarter.appendChild(upperBar)
        divQuarter.appendChild(lowerBar)
        barFlag = 0
      }
    })
    sampleCounter = 0
    console.log('notesarr', notesArr)
    console.log('howManyArr', howManyArr)
    console.log('picarr', pitchArr)

    return 'start'
  }
  sourceNode = audioContext.createBufferSource()
  console.log('so', sourceNode)
  sourceNode.buffer = theBuffer
  console.log('buff', sourceNode.buffer)
  sourceNode.loop = true

  analyser = audioContext.createAnalyser()
  analyser.fftSize = 1024
  sourceNode.connect(analyser)
  analyser.connect(audioContext.destination)
  sourceNode.start(0)
  isPlaying = true
  lastItem = false
  isLiveInput = false
  updatePitch()

  return 'stop'
}

function clear() {
  console.log('clear')
  return document.getElementById('deafult_page')
}

var rafID = null
var tracks = null
var buflen = 2048
var buf = new Float32Array(buflen)

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

// this is the previously used pitch detection algorithm.
/*
var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
var GOOD_ENOUGH_CORRELATION = 0.9; // this is the "bar" for how close a correlation needs to be

function autoCorrelate( buf, sampleRate ) {
  var SIZE = buf.length;
  var MAX_SAMPLES = Math.floor(SIZE/2);
  var best_offset = -1;
  var best_correlation = 0;
  var rms = 0;
  var foundGoodCorrelation = false;
  var correlations = new Array(MAX_SAMPLES);

  for (var i=0;i<SIZE;i++) {
    var val = buf[i];
    rms += val*val;
  }
  rms = Math.sqrt(rms/SIZE);
  if (rms<0.01) // not enough signal
    return -1;

  var lastCorrelation=1;
  for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    var correlation = 0;

    for (var i=0; i<MAX_SAMPLES; i++) {
      correlation += Math.abs((buf[i])-(buf[i+offset]));
    }
    correlation = 1 - (correlation/MAX_SAMPLES);
    correlations[offset] = correlation; // store it, for the tweaking we need to do below.
    if ((correlation>GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > best_correlation) {
        best_correlation = correlation;
        best_offset = offset;
      }
    } else if (foundGoodCorrelation) {
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
      // Now we need to tweak the offset - by interpolating between the values to the left and right of the
      // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
      // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
      // (anti-aliased) offset.

      // we know best_offset >=1, 
      // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and 
      // we can't drop into this clause until the following pass (else if).
      var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];  
      return sampleRate/(best_offset+(8*shift));
    }
    lastCorrelation = correlation;
  }
  if (best_correlation > 0.01) {
    // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
    return sampleRate/best_offset;
  }
  return -1;
//	var best_frequency = sampleRate/best_offset;
}
*/

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
let sampleCounter = 0;
let prevNote = null;
let howMany = 0;
const howManyArr = [];

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
          sampleCounter > 10
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
      else if (prevNote == null) {
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
    if(prevNote !== noteStrings[note % 12] && sampleCounter > 10){
      console.log("insida if")
      notesArr.push(prevNote);
      pitchArr.push(prevPitch)
      octaveArr.push(prevNoteOctave)
      sampleCounters.push(sampleCounter)
      howManyArr.push(howMany)
    }
      
    // if (prevNote == noteStrings[note % 12] && sampleCounter < 10 || notesArr == [])
		sampleCounter++
    // else{
    // sampleCounter++;
  // }
    prevPitch = note;
    prevNoteOctave = noteOctave;
    prevNote = noteStrings[note % 12]
    howMany++;
    // console.log(noteOctave)

    var detune = centsOffFromPitch(pitch, note)
    if (detune == 0) {
      detuneElem.className = ''
      detuneAmount.innerHTML = '--'
    }
    else {
      if (detune < 0) detuneElem.className = 'flat'
      else detuneElem.className = 'sharp'
      detuneAmount.innerHTML = Math.abs(detune)
    }
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame
  rafID = window.requestAnimationFrame(updatePitch)
}
function getTheBPM() {
  let demoSound = loadSound(soundPath);
  let phrase = new p5.Phrase('phrase',)

}
function prepare(buffer) {
  var offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
  var source = offlineContext.createBufferSource();
  source.buffer = buffer;
  var filter = offlineContext.createBiquadFilter();
  filter.type = "lowpass";
  source.connect(filter);
  filter.connect(offlineContext.destination);
  source.start(0);
  offlineContext.startRendering();
  offlineContext.oncomplete = function (e) {
    process(e);
  };
}
var mt;
var songTempo;
var songBeats;
function process(e) {
  // console.log("enter process",e)
  var filteredBuffer = e.renderedBuffer;
  //If you want to analyze both channels, use the other channel later
  var data = filteredBuffer.getChannelData(0);
  mt = new MusicTempo(data);
  songTempo = mt.tempo
  songBeats = mt.beats
  while (mt.tempo < 70) mt.tempo *= 2;
  while (mt.tempo > 140) mt.tempo /= 2;
  console.log('tempo', mt.tempo)
  console.log('beats', mt.beats)
  var max = arrayMax(data);
  var min = arrayMin(data);
  var threshold = min + (max - min) * 0.80;
  threshold = 0.01
  console.log('threshold', threshold)
  var peaks = getPeaksAtThreshold(data, threshold);
  var intervalCounts = countIntervalsBetweenNearbyPeaks(peaks);
  console.log(intervalCounts)
  var tempoCounts = groupNeighborsByTempo(intervalCounts);
  console.log(tempoCounts);
  tempoCounts.sort(function (a, b) {
    return b.count - a.count;
  });
  let sum = 0
  tempoCounts.map(tempo => sum += tempo.tempo)
  let mean = sum / tempoCounts.length
  console.log(mean)
  if (tempoCounts.length) {
    console.log(tempoCounts[0].tempo);
    //   output.innerHTML = tempoCounts[0].tempo;
  }
}

// http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/
function getPeaksAtThreshold(data, threshold) {
  // console.log(`enter getPeaksAtThreshold data:${data} threshold:${threshold}`);
  var peaksArray = [];
  var length = data.length;
  for (var i = 0; i < length;) {
    if (data[i] > threshold) {
      peaksArray.push(i);
      // Skip forward ~ 1/4s to get past this peak.
      i += 10000;
    }
    i++;
  }
  return peaksArray;
}

function countIntervalsBetweenNearbyPeaks(peaks) {
  // console.log(`enter countIntervalsBetweenNearbyPeaks peaks: ${peaks}`)
  var intervalCounts = [];
  peaks.forEach(function (peak, index) {
    for (var i = 0; i < 10; i++) {
      var interval = peaks[index + i] - peak;
      var foundInterval = intervalCounts.some(function (intervalCount) {
        if (intervalCount.interval === interval) return intervalCount.count++;
      });
      //Additional checks to avoid infinite loops in later processing
      if (!isNaN(interval) && interval !== 0 && !foundInterval) {
        intervalCounts.push({
          interval: interval,
          count: 1
        });
      }
    }
  });
  return intervalCounts;
}

function groupNeighborsByTempo(intervalCounts) {
  // console.log(`enter groupNeighborsByTempo intervalCounts: ${intervalCounts}`)
  var tempoCounts = [];
  intervalCounts.forEach(function (intervalCount) {
    //Convert an interval to tempo
    var theoreticalTempo = 60 / (intervalCount.interval / sampleRate);
    theoreticalTempo = Math.round(theoreticalTempo);

    if (theoreticalTempo === 0) {
      return;
    }
    // Adjust the tempo to fit within the 90-180 BPM range
    while (theoreticalTempo < 70) theoreticalTempo *= 2;
    while (theoreticalTempo > 140) theoreticalTempo /= 2;

    var foundTempo = tempoCounts.some(function (tempoCount) {
      if (tempoCount.tempo === theoreticalTempo)
        return tempoCount.count += intervalCount.count;
    });
    if (!foundTempo && theoreticalTempo < Number(mt.tempo) + 10 && theoreticalTempo > Number(mt.tempo) - 10) {
      tempoCounts.push({
        tempo: theoreticalTempo,
        count: intervalCount.count
      });
    }
  });
  return tempoCounts;
}

// http://stackoverflow.com/questions/1669190/javascript-min-max-array-values
function arrayMin(arr) {
  var len = arr.length,
    min = Infinity;
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
  }
  return min;
}

function arrayMax(arr) {
  var len = arr.length,
    max = -Infinity;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max;
}