const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const targetURLs = process.env.TARGET_URLS ? process.env.TARGET_URLS.split(',') : ['https://deeplx.vercel.app'];

app.use(express.json());
app.use(express.text());

app.all('*', async (req, res) => {
    // 创建请求配置，考虑设置请求超时
    const createRequestConfig = (targetURL) => ({
        method: req.method,
        url: targetURL + req.path,
        data: req.method !== 'GET' ? req.body : null,
        timeout: 5000, // 设置5秒超时
    });

    // 封装请求以捕获并处理单个请求的错误
    const makeRequest = async (config) => {
        try {
            return await axios(config);
        } catch (error) {
            return Promise.reject(`请求到 ${config.url} 失败: ${error.message}`);
        }
    };

    try {
        const responses = await Promise.any(targetURLs.map(targetURL => makeRequest(createRequestConfig(targetURL))));

        // 响应成功，设置响应头并返回数据
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json', // 根据需要调整Content-Type
        }).status(responses.status).send(responses.data);

    } catch (error) {
        // 所有请求都失败了
        res.status(500);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
