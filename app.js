const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

const cors = require('cors');
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

// Enable CORS
app.use(cors());

let waitingClients = [];
let connectedClients = [];

io.on('connection', (socket) => {
  console.log('A user connected');

  // Add client to waiting list
  waitingClients.push(socket);

  // Check if there are enough clients to start a chat
  if (waitingClients.length >= 2) {
    const client1 = waitingClients.pop();
    const client2 = waitingClients.pop();

    // Generate unique partner IDs
    const partnerId1 = generatePartnerId();
    const partnerId2 = generatePartnerId();

    // Assign partners to each other
    client1.partnerId = partnerId2;
    client2.partnerId = partnerId1;

    // Add connected clients to the list
    connectedClients.push(client1);
    connectedClients.push(client2);

    // Start the chat for both clients
    client1.emit('chat start', partnerId1);
    client2.emit('chat start', partnerId2);

     // Handle chat messages
     client1.on('chat message', (message) => {
      const msg = message.message
      const partnerSocket = connectedClients.find(
        (client) => client.partnerId === partnerId1
      );
      if (partnerSocket) {
        partnerSocket.emit('chat message', { from: 'Partner', message:msg });
      }
    });

    client2.on('chat message', (message) => {
      const msg = message.message
      const partnerSocket = connectedClients.find(
        (client) => client.partnerId === partnerId2
      );
      if (partnerSocket) {
        partnerSocket.emit('chat message', { from: 'Partner', message:msg });
      }
    });

    // // Handle next chat

    // client1.on('nextchat', () => {
    //   handleNextChat(client1, partnerId1);
    // });

  

    // client2.on('nextchat', () => {
    //   handleNextChat(client2, partnerId2);
    // });

    // function handleNextChat(socket, partnerId) {
    //   // Remove the client from the connected clients list
    //   connectedClients = connectedClients.filter((client) => client !== socket);
    
    //   // Add client back to the waiting list
    //  // waitingClients.push(socket);
    
    //   // Find the partner socket
    //   const partnerSocket = connectedClients.find(
    //     (client) => client.partnerId === partnerId
    //   );
    //   waitingClients.push(socket);
    //   if (partnerSocket) {
    //     // Inform the partner that the user has disconnected for the next chat
    //     partnerSocket.emit('chat message', {
    //       from: 'System',
    //       message: 'Your partner has disconnected. Search for a new partner...',
    //     });
    //   } else {
    //     // Check if there are enough clients in the waiting list to start a new chat
    //     if (waitingClients.length >= 2) {
    //       const client1 = waitingClients.pop();
    //       const client2 = waitingClients.pop();
    
    //       // Generate unique partner IDs
    //       const partnerId1 = generatePartnerId();
    //       const partnerId2 = generatePartnerId();
    
    //       // Assign partners to each other
    //       client1.partnerId = partnerId2;
    //       client2.partnerId = partnerId1;
    
    //       // Add connected clients to the list
    //       connectedClients.push(client1);
    //       connectedClients.push(client2);
    
    //       // Start the chat for both clients
    //       client1.emit('chat start', partnerId1);
    //       client2.emit('chat start', partnerId2);
    //     }
    //   }
    // }
    

    // Handle client disconnect
    client1.on('disconnect', () => {
      handleDisconnect(client1, partnerId1);
    });

  

    client2.on('disconnect', () => {
      handleDisconnect(client2, partnerId2);
    });
  } else {
    // Handle client disconnect before pairing
    socket.on('disconnect', () => {
      waitingClients = waitingClients.filter(
        (client) => client !== socket
      );
    });
  }
});

// Helper function to generate a random partner ID
function generatePartnerId() {
  return Math.random().toString(36).substring(2, 10);
}

// Function to handle client disconnect
function handleDisconnect(socket, partnerId) {
  
  // Remove the client from the connected clients list
  connectedClients = connectedClients.filter(
    (client) => client !== socket
  );

  // Find the partner socket
  const partnerSocket = connectedClients.find(
    (client) => client.partnerId === partnerId
  );

  if (partnerSocket) {
    // Inform the partner that the user has disconnected
    partnerSocket.emit('chat message', {
      from: 'System',
      message: 'Your partner has disconnected. Restart...'
    });
  }
}

// Start the server
const port = 'angularchat.vercel.app';
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
