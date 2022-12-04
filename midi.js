const rhythm = {
    whole: 4,
    half: 2,
    quarter: 1,
    eighth: 0.5,
    sixteenth: 0.25,
}
const duration = {
    whole: "1n",
    half: "2n",
    quarter: "4n",
    eighth: "8n",
    sixteenth: "16n"
}
const onlyNotes = [];
const img = localStorage.getItem("image")
const output = document.getElementById("outputimg")
function draw_isRotate(note){
		let octave = Number(note.replace(/[A-Z]|b|#|[A-Z]*|\./g,""))
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
function draw_getRhythm(numRhythm) {
    switch (numRhythm){
        case 2:
            return 'half/'
				case 0.5:
						return 'eighth/'
				default:
            return 'quarter/'
      
    }
}
function draw_pickSvg(note, numRhythm) {
    let octave = Number(note.replace(/[A-Z]|b|#|[A-Z]*|\./g,""))
		
    let rotate = draw_isRotate(note)
	
    let rhytm = draw_getRhythm(numRhythm)
    let noteOrRest = 'notes'; 
    if(note.includes('rest')){
      noteOrRest = 'rests'
    }
		if(octave === null || rotate === null || rhytm === null )
			console.log("somthing null")
    // rhytmArr.push(rhytm)
    let path = `./img/${noteOrRest}/${rhytm}`;
    if(noteOrRest === 'rests') return path.slice(0,-1) + '.svg'
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
const getrythm = (note) => {
    note = String(note.replace(/\.$|_fermata/g,''))
    if(String(note).endsWith("quarter"))
        return rhythm.quarter;
    if(String(note).endsWith("whole") || String(note).endsWith("1"))
        return rhythm.whole;
    if (String(note).endsWith("eighth"))
        return rhythm.eighth
    if (String(note).endsWith("half"))
        return rhythm.half;
    if (String(note).endsWith("sixteenth") || String(note).endsWith("thirty_second"))
        return rhythm.sixteenth;
    return rhythm.quarter;
    
    // return getrythm(note)
}

const getNote = (note) => {
    note = String(note).replace(/^note-|_[a-z]+/g,"");
    if(note.startsWith("rest") || note.startsWith("multirest") ) return "rest"
    return note
}

const getDuration = (note) => {
    note = String(note.replace(/\.$|_fermata/g,''))
    if(String(note).endsWith("quarter")  || String(note).endsWith("1"))
        return duration.quarter;
    if(String(note).endsWith("whole"))
        return duration.whole;
    if (String(note).endsWith("eighth"))
        return duration.eighth
    if (String(note).endsWith("half"))
        return duration.half;
    if (String(note).endsWith("sixteenth") || String(note).endsWith("thirty_second"))
        return duration.sixteenth;
    return duration.quarter;
}
const isBemol = (note) => {
    if (String(note).includes("b")) {
      return 'bemol';
    } else if (String(note).includes("#")){
      return 'Sharp';
    }
      return 'none';
}
const draw_noteToLocation = (note,getRotate) => {
	let octave = Number(note.note.replace(/[A-Z]|b|#|[A-Z]*|\./g,""))
    let rotate = draw_isRotate(note.note)
		getRotate === false ? rotate = false : null
    let start=-7;

    if(rotate && octave == 3){
      start = -101
    }
    else if(!rotate && octave == 4){
      start = -7
    }
    else if(rotate && octave == 4){
      start = -36
    }
    else if(!rotate && octave == 3){
      start =-71
    }
		else if(rotate && octave == 5){
      start =-2
    }
  
    let location = start
    let finalLocation
    let labels = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    
    labels.map((label) => {
      if (note.note.includes(label)) {
        finalLocation = location.toFixed()
        return finalLocation
      }
      location += 5
    })
    if(note.note.includes("rest") && note.rhythm == 2){
      finalLocation = 26
    }
    else if(note.note.includes("rest") && note.rhythm == 1){
      finalLocation = 10
    }
    return finalLocation
  }
const drawNotes = () => {
    let distance = 50
		let eighth_line_index = 0 ;
    onlyNotes.forEach((note,index) => {
        const divQuarter = document.getElementById('containerQuarterNoteGC')
        if(note.note.includes("barline")){
					eighth_line_index = 0
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
					return
        }  
      let quarter = document.createElement('img')
      let sharp = null
      let isRotate = draw_isRotate(note.note)
			note.rhythm === 0.5? isRotate = false : null	
      const flag = isBemol(note.note);
      if (flag !== 'none') {
        sharp = document.createElement('img')
        sharp.src = `./img/flags/${flag}.svg`
        var bottomPos = Number(draw_noteToLocation(note,isRotate));
        !isRotate ? bottomPos-= 8 : bottomPos +=20;
        const bemol = flag === 'bemol' ? 7 : 0 
        sharp.style.bottom= bottomPos + bemol + 'px'
        sharp.style.position = 'absolute'
        // sharp.style.zIndex = -1
        
        sharp.style.left = distance - 10 + 'px'
        sharp.style.height = '30px'
        divQuarter.appendChild(sharp)
      }
			
      quarter.src = draw_pickSvg(note.note,note.rhythm)
			
			let quarterPlace =  draw_noteToLocation(note,isRotate)
      quarter.style.bottom = quarterPlace + 'px'
      quarter.style.position = 'absolute'
      // quarter.style.zIndex = -1
      quarter.style.left = distance + 'px'
      divQuarter.appendChild(quarter)
			if(note.rhythm == 0.5){
			let eight = document.createElement('img')
			eighth_line_index++;
			eighth_line_index < 4 ? eight.src = './img/staff/eightLine2.svg' : eight.src = ""
			eight.style.position = 'absolute';

			// }
			if(eighth_line_index === 4 )
					eighth_line_index = 0;
			
			if(quarterPlace && (index < onlyNotes.length-1 && onlyNotes[index+1].rhythm === 0.5)) {
				quarter.src = './img/notes/quarter/note.svg'
			let nextNote =  draw_noteToLocation(onlyNotes[index+1],isRotate)
				console.log("nextNote",nextNote)
				console.log("currentNote", quarterPlace)
				// eight.style.zIndex = 999;
				// eight.style.top = quarterPlace - 20 + 'px'
				const rotate = getRotate(quarterPlace,nextNote)
				eight.style.transform = `rotate(${rotate.rotate}deg)`;

				eight.style.bottom = (rotate.bottom) + 'px'
				
				if(rotate.left){
					eight.style.left = Number(distance) + 13 + rotate.left + 'px'
				}
				else
					eight.style.left = Number(distance) + 13 + 'px'
				if(rotate.width){
					eight.style.width = rotate.width + 'px'
				}
				divQuarter.appendChild(eight)
		}
		if(index > 0 && onlyNotes[index-1].rhythm === 0.5)
			quarter.src = './img/notes/quarter/note.svg'
	}
  if(note.note.includes('.')) {
    const dotSvg = document.createElement('img');
    dotSvg.src = './img/flags/dot.svg';
    dotSvg.style.position = 'absolute';
    dotSvg.style.height = '15px'
    dotSvg.style.width = '5px'
    let dotPlace = 50;
    !isRotate ? dotPlace-= 46 : dotPlace -=12;
    let leftPlace = 20
    quarter.src.includes('eighth') ? leftPlace+=10 : null 
    console.log(isRotate,"isRotate")
    console.log(dotPlace,"dotPlace")
    dotSvg.style.left = Number(distance) + leftPlace + 'px'
    dotSvg.style.bottom = Number(quarterPlace) + dotPlace + 'px'
    divQuarter.appendChild(dotSvg);
  }
      distance += 50
})
    sampleCounter = 0
    howMany=0
		
        // let path = draw_pickSvg(note.note, note.rhythm)
        // console.log(path)
};
const getRotate = (current,next) => {
	let sum = (Number(current) - Number(next)) / -50
	console.log(sum)
	switch(sum){
		case -0.4:
			return {rotate: 20, bottom: (Number(current) - Number(next)) + 20 - Math.abs(sum+4) }
		case -0.3:
			return {rotate: 14, bottom: (Number(current) - Number(next)) + 33.5 - Math.abs(sum+4), width: 53 }
		case -0.1:
			return {rotate: 5, bottom: (Number(current) - Number(next)) + 50 - Math.abs(sum+4) }
		case 0:
			return {rotate: sum, bottom: (Number(current) - Number(next)) + 50 - Math.abs(sum) }	
		case 0.1:
			return {rotate: -5, bottom: (Number(current) + Number(next)) + 27 - Math.abs(sum+4) }
		case 0.2:
			return {rotate: -10,bottom: (Number(current) + Number(next)) + 23 - Math.abs(sum +4)}
		case 0.4:
			return {rotate: -22,bottom: (Number(current) + Number(next)) + 32 - Math.abs(sum +4), left: -3, width: +55}	
		default:
			return {rotate: -5,bottom: (Number(current) + Number(next)) + 33 - Math.abs(sum +4)}	
	}
}
const createNotes = () => {
    output.src = img;
    let data = localStorage.getItem("data")
    if(!data)
        return 
    console.log(data)
    data = data.split(',')
    
    data.forEach(note =>{
        if(!String(note).startsWith("note") && !String(note).startsWith("rest") && 
            !String(note).startsWith("multirest") && !String(note).startsWith("barline")){
            return;
        }
        onlyNotes.push({note: getNote(note), duration: getDuration(note),rhythm: getrythm(note)})
    })
    console.log("play Midi")
    console.log(onlyNotes)
    drawNotes();
}

var playMidi =() =>{
  const sampler = new Tone.Sampler({
	urls: {
		"C4": "C4.mp3",
		"D#4": "Ds4.mp3",
		"F#4": "Fs4.mp3",
		"A4": "A4.mp3",
	},
	release: 1,
	baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

Tone.loaded().then(() => {
    time = 0
    const now = Tone.now()
		const childrens = document.getElementById("containerQuarterNoteGC").children
		let index = 0;
    onlyNotes.forEach((note) => {
        if(note.note === "barline")
            return;
        if(note.note !== "rest"){
					setTimeout(() => {
						console.log(childrens[index])
					})
					sampler.triggerAttackRelease(note.note, note.duration,now+time)
        }
        time+=note.rhythm
    })
		for(var i=0;i< childrens.length;i++){
			Tone.Transport.schedule((time) => {
			// use the time argument to schedule a callback with Draw
			Tone.Draw.schedule(() => {
				// do drawing or DOM manipulation here
				try{
					childrens[index].style.background = 'green'
				} catch(e) {
					console.error(e);
				}
				index++
				time+=0.5
			}, time);
		}, "+0.5");
	}
})
}
createNotes()