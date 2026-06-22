const { server, io } = require('./server');
const Client = require('socket.io-client');

describe('Socket.io Server', () => {
  let clientSocket;

  beforeAll((done) => {
    // Start the server on an ephemeral port
    server.listen(0, () => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  it('should join a room and receive chat history and room users', (done) => {
    let historyReceived = false;
    let usersReceived = false;

    clientSocket.emit('joinRoom', { roomId: '123456', sender: 'TestUser', userId: 'user_1' });
    
    clientSocket.on('history', (history) => {
      expect(Array.isArray(history)).toBe(true);
      historyReceived = true;
      if (historyReceived && usersReceived) done();
    });

    clientSocket.on('roomUsers', (users) => {
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      usersReceived = true;
      if (historyReceived && usersReceived) done();
    });
  });

  it('should broadcast message to room', (done) => {
    const testMessage = {
      roomId: '123456',
      text: 'Hello Room',
      sender: 'TestUser',
      timestamp: new Date().toISOString()
    };

    clientSocket.emit('sendMessage', testMessage);

    clientSocket.on('newMessage', (msg) => {
      expect(msg.text).toBe('Hello Room');
      expect(msg.sender).toBe('TestUser');
      done();
    });
  });
});
