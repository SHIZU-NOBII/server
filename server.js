// WHEN IN PRODUCTION MODE 
const production = process.env.NODE_ENV === 'production'
const ClientUrl = production ? 'Example.com' : 'http://localhost:1234'

const io = require("socket.io")(3000, {
  cors: {
    origin : ClientUrl
  }
})

const rooms = {}
const WORD = ['Dog', 'Human', 'Bike']

io.on("connection" , socket =>{
  socket.on('join-room', data=>{
    const user = {id: socket.id, name: data.name, socket: socket}
    let room = rooms[data.roomId]
    if(room == null) {
      room = {users: [] , id:data.roomId}
      rooms[data.roomId] = room
    }

    room.users.push(user)
    socket.join(room.id)

    socket.on('ready' , ()=>{
      user.ready = true
      if(room.users.every(u => u.ready)){
        room.word = getRandomEntry(WORD)
        room.drawer = getRandomEntry(room.users)
        io.to(room.drawer.id).emit('start-drawer', room.word)
        room.drawer.socket.to(room.id).emit('start-guesser')
      }
    })

    socket.on('make-guess', data =>{
      socket.to(room.id).emit('guess', user.name, data.guess)
       
      if(data.guess.toLowerCase().trim() === room.word.toLowerCase()){
        io.to(room.id).emit('winner', user.name, room.word)
        room.users.forEach(user => {
          user.ready = false
        });
      }
    })

    socket.on('draw', data =>{
      socket.to(room.id).emit('draw-line', data.start , data.end)
    })

    // REMOVE USER WHEN DISCOONECT
    socket.on("disconnect", () => {
      room.users = room.users.filter(u => u !== user)
    })
  })
})

// GET RANDOM NUMBER 
function getRandomEntry(array){
  return array[Math.floor(Math.random() * array.length)]
}