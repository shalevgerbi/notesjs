async function initServer(){ 
let res = await fetch('http://localhost:5000/')
let data = await res.json()
console.log(data)
}
var openFile = function(file) {
    var input = file.target;
    var output = document.getElementById('outputimg');
    var reader = new FileReader();
    
    reader.onload = function(){
      var dataURL = reader.result;
    };
    
    reader.readAsDataURL(input.files[0]);

    reader.onloadend = async function(){
        output.src = reader.result;
        console.log("end")
        encodedData = reader.result
        console.log(reader.result)
        localStorage.setItem('image',reader.result)
        res =await fetch('http://localhost:5000/predict', {
            "method": "POST",
            "body": encodedData,
        })
        data = await res.json();
        data = data.result.replace(/^(tf.Tensor\(\n\[)|b'|'|\[UNK\]|'|\n|\], shape=\(\d\d,\), dtype=string\)/g,"")
        data = data.split(" ")
        let index=0;
        
        const firstEmpty = data.map(item => {
          if(item === "") return index
          index++
        })

        data.splice(index);
        console.log(data)
        // res =await fetch('http://localhost:5000/midi', {
        //     "method": "POST",
        //     "body": JSON.stringify(data),
        // })
        // data = await res.json();
        // console.log(data)
        // res = await fetch('http://localhost:5000/objects/output.mid')
        // data = await res.json();
        // console.log(data)
        localStorage.setItem("data",data)
        // const button = document.createElement("button")
        // button.addEventListener("click", () => window.location.href("./midi.html"))
        // button.textContent = "click on me";
        // button.style.zIndex = -1
        // document.querySelector("#buttons").appendChild(button)
        const form = document.createElement("form")
        form.action="./midi.html";
        const input = document.createElement("input")
        input.type = "submit"
        input.value ="go to midi page"
        form.appendChild(input)
        document.querySelector("#buttons").appendChild(form)
        
    }
  };
initServer();