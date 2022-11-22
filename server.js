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
    }
  };
initServer();