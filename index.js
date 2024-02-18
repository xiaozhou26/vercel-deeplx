const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// 从环境变量获取目标URLs，如果未设置，则使用默认URL
const targetURLs = process.env.TARGET_URLS ? process.env.TARGET_URLS.split(',') : ['https://api.deeplx.org'];

const maxRetries = 5;

app.use(express.json());
app.use(express.text());

app.all('*', async (req, res) => {
    let response;
    let attempt = 0;

    while (attempt < maxRetries) {
        // 随机选择一个目标URL
        const randomIndex = Math.floor(Math.random() * targetURLs.length);
        const targetURL = targetURLs[randomIndex];
        const userURI = req.path;
        const proxyURL = targetURL + userURI;

        // 伪装成浏览器的请求头
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': proxyURL,
            'Origin': targetURL,
        };

        // 如果原始请求有正文，确保Content-Type匹配
        if (req.method !== 'GET' && req.headers['content-type']) {
            headers['Content-Type'] = req.headers['content-type'];
        }

        try {
            response = await fetch(proxyURL, {
                method: req.method,
                headers: headers,
                body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
            });

            if (response.ok) {
                break; // 成功响应，跳出循环
            }
        } catch (error) {
            console.error('Error during fetch:', error);
        }

        attempt++;
    }

    if (response) {
        const responseBody = await response.text();
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': response.headers.get('Content-Type'),
        }).status(response.status).send(responseBody);
    } else {
        res.status(500).send('无法获取有效响应');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
