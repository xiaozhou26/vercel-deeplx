# vercel-deeplx
## 使用 Vercel 部署 `vercel-deeplx`

### 步骤 1：Fork 项目

1. 访问 [vercel-deeplx](https://github.com/xiaozhou26/vercel-deeplx) 项目页面。

2. 点击右上角 "Fork" 按钮，将项目复制到 GitHub 账户下。

### 步骤 2：连接 Vercel 和 GitHub

1. 登录到 Vercel 账户。

2. 在 Vercel Dashboard 中，点击 "New Project"。

3. 选择刚刚 fork `vercel-deeplx` 项目。

4. Vercel 会请求访问 GitHub 账户以获取项目代码，同意授权。

### 步骤 3：配置环境变量

在 Vercel 项目设置中：

1. 找到 "Environment Variables" 部分。

2. 添加一个新环境变量，键名为 TARGET_URLS，值为https://github.com/xiaozhou26/serch_deeplx
中的success_result.txt文件中url

### 步骤 4：部署项目

1. 完成环境变量设置后，Vercel 会自动开始部署过程。

2. 部署完成后，Vercel 会提供一个 URL，可以通过这个 URL 访问服务。

### 步骤 5：使用服务

通过发送 HTTP 请求到 Vercel 提供 URL，可以开始使用 `vercel-deeplx` 服务进行文本翻译。
