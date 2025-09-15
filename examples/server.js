// 引入必要的模块
const http = require("http");
const https = require("https");

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors()); // 允许跨域请求

// 配置代理服务器
const PORT = 3000; // 代理服务器端口
const TARGET_HOST = "https://fat-hapi.halaladmin.vip"; // 目标服务器主机
const CLIENT_SECRET = "test"; // 客户端密钥，根据实际情况填写


app.post("/api/user-account/oauth/v1/OauthService/Token",express.json(), (req, res) => {
  // 获取请求参数
  let body = { ...req.body };
  body.client_secret = CLIENT_SECRET; // 设置你的 client_secret 值
  const postData = JSON.stringify(body);
  const targetUrl = new URL(req.url, TARGET_HOST);
  const httpModule = targetUrl.protocol === "https:" ? https : http;
  
  // 准备请求选项
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80),
    path: targetUrl.pathname + (targetUrl.search || ""),
    method: req.method,
    headers: { 
      ...req.headers,
    },
  };
  
  options.headers["Content-Length"] = Buffer.byteLength(postData);

  // 删除可能导致问题的headers
  delete options.headers.host;

  // 向目标服务器创建请求
  const proxyReq = httpModule.request(options, (proxyRes) => {
    // 设置响应头
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    // 将目标服务器的响应流式传输回客户端
    proxyRes.pipe(res, { end: true });
  });

  // 处理代理请求错误
  proxyReq.on("error", (err) => {
    console.error("代理请求错误:", err);
    res.writeHead(500);
    res.end("代理服务器内部错误");
  });
  // console.log("修改后的请求体:", body);

  // 将修改后的请求体写入代理请求
  proxyReq.write(postData);
  // req.pipe(proxyReq, { end: true });
  proxyReq.end();
});

// 启动代理服务器
app.listen(PORT, () => {
  console.log(`代理服务器已启动， http://localhost:${PORT}`);
});
