const http = require('http');

// Demo Web Server
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Primal Demo</title>
</head>
<body>
    <h1>Primal Check Demo Page</h1>
    <form action="/submit" method="POST" onsubmit="event.preventDefault(); console.log('Form submitted!');">
        <label for="name">Name:</label>
        <input type="text" id="name" name="name"><br><br>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email"><br><br>
        <label for="options">Options:</label>
        <select id="options" name="options">
            <option value="1">One</option>
            <option value="2">Two</option>
        </select><br><br>
        <label for="comments">Comments:</label>
        <textarea id="comments" name="comments"></textarea><br><br>
        <button type="submit" id="submit-btn">Submit</button>
    </form>
    <button id="click-me" onclick="document.body.style.backgroundColor = 'lightblue'; console.log('Button clicked!');">Click Me</button>

    <img src="missing.png" /> <!-- Accessibility issue: no alt -->

    <script>
        // set some storage
        localStorage.setItem('session', '12345');
        document.cookie = "user=demo_user";

        // slow request
        fetch('/slow').then(() => console.log('Slow request completed.'));

        // large request
        fetch('/large').then(() => console.log('Large request completed.'));
    </script>

    <!-- For scrolling -->
    <div style="height: 2000px;"></div>
    <button id="bottom-btn" onclick="console.log('Scrolled and clicked!')">Bottom Button</button>
</body>
</html>
`;

const demoServer = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
    } else if (req.url === '/slow') {
        setTimeout(() => {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ status: 'ok' }));
        }, 1000); // 1s delay
    } else if (req.url === '/large') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('A'.repeat(600000)); // ~600KB payload
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

demoServer.listen(3002, () => console.log('Demo server running on port 3002'));

// Webhook Receiver Server
const webhookServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        console.log('[Webhook Received]', req.method, req.url);
        console.log(JSON.stringify(JSON.parse(body), null, 2));
        res.writeHead(200);
        res.end('OK');
    });
});

webhookServer.listen(3003, () => console.log('Webhook server running on port 3003'));
