const Client = require('socket.io-client');

// Mock firebase-admin before requiring server
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() }
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: jest.fn(async (token) => {
      if (token === 'valid_test_token') {
        return { uid: 'user_1', email: 'test@example.com', name: 'TestUser' };
      }
      throw new Error('Invalid token');
    })
  })
}));
const { server, io } = require('./server');

describe('Socket.io Server', () => {
  let clientSocket;

  beforeAll((done) => {
    // Start the server on an ephemeral port
    server.listen(0, () => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`, {
        auth: { token: 'valid_test_token' }
      });
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

    clientSocket.emit('joinRoom', { roomId: '123456' });
    
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
      id: 'test_msg_1',
      roomId: '123456',
      text: 'Hello Room',
      timestamp: new Date().toISOString()
    };

    clientSocket.emit('sendMessage', testMessage);

    clientSocket.on('newMessage', (msg) => {
      expect(msg.text).toBe('Hello Room');
      expect(msg.senderName).toBe('TestUser');
      done();
    });
  });
});
