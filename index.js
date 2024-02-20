const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

let targetURLs = process.env.TARGET_URLS ? process.env.TARGET_URLS.split(',') : ['https://api.deeplx.org'];

app.use(express.json());
app.use(express.text());

app.all('*', async (req, res) => {
    let response;
    try {
        response = await Promise.any(targetURLs.map(async (targetURL) => {
            const userURI = req.path;
            const proxyURL = targetURL + userURI;

            return await axios({
                method: req.method,
                url: proxyURL,
                data: req.method !== 'GET' ? req.body : null,
            });
        }));
    } catch (error) {
        console.error('Error during fetch:', error);
        return res.status(500).send('所有目标URL都无法获取有效响应');
    }

    if (response && response.status >= 200 && response.status < 300) {
        // 设置一个固定的 Content-Type，例如 'application/octet-stream'
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/octet-stream', // 或者根据你的需求选择其他类型
        }).status(response.status).send(response.data);
    } else {
        res.status(500).send('所有目标URL都无法获取有效响应');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
