const express=require("express");
const app = express();
const path=require("path");
const http=require("http");

// socket io setup
const socketio=require("socket.io");
const server=http.createServer(app);
const io=socketio(server)


//ejs code
app.set("view engine","ejs")
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname,"public")));

//socket io connection 
io.on("connection",function(socket){
    socket.on("send-location",function(data){
        io.emit("receive-location",{id:socket.id,...data})

    })
    socket.on("disconnect",function(){
        io.emit("user-disconnected",socket.id);
    })
})


app.get("/", (req, res)=>
{
    res.render("index");   
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`server listening on port ${PORT}`));
