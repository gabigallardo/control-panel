import http from 'http';

const server = http.createServer((req, res) => {
    console.log('Request received:', req.url);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World');
});

const PORT = 3002;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Debug server running at http://localhost:${PORT}`);
});
