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
        console.log(reader.result)
        console.log("end")
        // var encodedData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAARCAYAAADdRIy+AAAB0UlE';
        // encodedData = reader.result.replace(/^data:image\/(png|jpg);base64,/, '');
        // myBuff = reader.result
        encodedData = reader.result
        console.log(reader.result)
        // var canvas = document.createElement('canvas');
        // var context = canvas.getContext('2d');
        
        // canvas.width = output.width;
        // canvas.height = output.height;
        // context.drawImage(output, 0, 0 );
        // var myData = context.getImageData(0, 0, output.width, output.height);    
        // console.log(JSON.stringify(myData))
        
        // let res = await fetch(`http://localhost:5000/${myData.data}`)
        res =await fetch('http://localhost:5000/predict', {
            "method": "POST",
            "body": encodedData,
        })
        data = await res.json();
        // data = JSON.parse(data)
        console.log(data)
        
        data = data.result.replace(/^(tf.Tensor\(\n\[)|b'|'|\[UNK\]|'|\n|\], shape=\(\d\d,\), dtype=string\)/g,"")
        data = data.split(" ")
        // data[0].substring(0,12)
        console.log(data)
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