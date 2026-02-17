# AI Translator 的隐私政策

**最后更新时间：** 2026 年 1 月 10 日

## 1. 概述

AI Translator（“我们”、“我们的”或“扩展程序”）是客户端浏览器扩展程序
允许用户使用自己的 AI API 密钥翻译文本。扩展名
完全在您的浏览器内运行，不会将数据传输到任何服务器
由开发商拥有或经营。

**这不是法律建议。** 本政策描述了扩展程序如何处理
数据来帮助您做出有关使用它的明智决定。

## 2. 数据收集和存储

- **个人数据：** 我们（开发商）不会收集、存储或访问
  任何个人数据、翻译文本或浏览历史记录。
- **API 密钥：** 您的 API 密钥仅使用以下方式存储在您的设备上：
  浏览器的同步存储 (`browser.storage.sync`)。这意味着您的
  登录后，设置会在您的浏览器之间同步，但它们永远不会
  传输给开发者或除特定AI之外的任何第三方
  您为翻译请求选择的提供商。
- **无后端服务器：** 此扩展不运行后端服务器。全部
  处理发生在您的浏览器本地。

## 3. 与第三方共享数据

为了发挥作用，此扩展程序会发送您明确选择进行翻译的文本
直接从您的浏览器连接到您已配置的 AI 提供商。通过使用
此扩展，您承认您的数据受到隐私保护
这些提供商的政策：

| 供应商               | 隐私政策                                                                           |
| -------------------- | ---------------------------------------------------------------------------------- |
| **OpenAI**           | [https://openai.com/privacy](https://openai.com/privacy)                           |
| **Anthropic**        | [https://www.anthropic.com/legal/privacy](https://www.anthropic.com/legal/privacy) |
| **Google（Gemini）** | [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)   |
| **xAI (Grok)**       | [https://x.ai/legal/privacy-policy](https://x.ai/legal/privacy-policy)             |
| **OpenRouter**       | [https://openrouter.ai/privacy](https://openrouter.ai/privacy)                     |
| **Ollama（本地）**   | 数据保留在您的本地计算机上；无外部传输。                                           |

**重要考虑因素：**

- 一些提供商可能会使用您的数据来训练他们的模型，除非您选择退出
  （检查每个提供商的政策）。
- OpenRouter 将请求路由到各个底层 AI 提供商，每个提供商都有自己的
  自己的数据政策。
- 我们不会出售、交易或以其他方式将您的数据传输给外部各方。

## 4. 浏览器商店策略

当通过浏览器扩展商店分发时，此扩展遵循
适用的用户数据政策，包括[Chrome Web Store用户数据政策](https://developer.chrome.com/docs/webstore/program-policies/)和[Firefox附加政策](https://extensionworkshop.com/documentation/publish/add-on-policies/)。

## 5. 权限说明

此扩展请求以下权限：

| 许可                              | 目的                                                                |
| --------------------------------- | ------------------------------------------------------------------- |
| `contextMenus`                    | 在右键菜单中添加“翻译”选项                                          |
| `scripting`                       | 在网页上注入翻译 UI 叠加层                                          |
| `storage`                         | 在本地保存您的 API 密钥和首选项                                     |
| `host_permissions` (`<all_urls>`) | 需要在您访问的任何网页上显示翻译并向您选择的 AI 提供商进行 API 调用 |

## 6. 用户控制

- **删除：**您可以通过卸载来删除此扩展程序存储的所有数据
  扩展程序或清除浏览器的扩展程序数据。

- **选择退出：** 除非您明确触发，否则不会将数据发送给人工智能提供商
  翻译动作。
- **提供商选择：** 您可以通过以下方式控制哪个人工智能提供商接收您的数据
  在扩展设置中选择它。

## 7. 安全

- API 密钥存储在浏览器的安全存储中并且仅传输
  通过 HTTPS 到 AI 提供商端点。
- 该扩展程序不会在之后记录、缓存或保留任何翻译后的文本
  显示它。

## 8. 本政策的变更

我们可能会不时更新本隐私政策。变化将得到反映
在本文档顶部的“最后更新”日期中。

## 9. 联系方式

如果您对此政策有疑问，请在
[GitHub 存储库](https://github.com/adinschmidt/AI-translator/issues)。

---

_此扩展是开源的。您可以查看代码来验证这些隐私
声明。_
