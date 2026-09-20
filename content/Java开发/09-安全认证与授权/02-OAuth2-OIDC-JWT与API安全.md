# OAuth 2.0、OIDC、JWT 与 API 安全

“用 JWT 登录”和“接入 OAuth”经常被放在一起说，但令牌格式、授权流程和身份信息是不同的问题。先把 OAuth 2.0、OIDC、JWT 分开，再通过一次调用过程看它们怎样配合。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `Spring Security 7 concepts; OAuth2/OIDC standards`
> - `source_type`: `official-docs`
> - `stability`: `fast-moving`


OAuth 2.0 是委托授权框架，OIDC 在其上提供身份层，JWT 是一种令牌格式；三者不是同义词。

## 先分开三个问题

认证回答“你是谁”，授权回答“你能做什么”，令牌格式回答“这些声明怎样表示”。OAuth 2.0 主要处理授权，OIDC 在其上增加身份层，JWT 是一种承载声明的令牌格式。一个令牌看起来像 JWT，不代表它自动构成完整登录流程。

例如用户授权日历应用读取日程，应用应得到有限范围的访问凭据，而不是用户的账号密码。服务端收到凭据后，还需要核对签发方、受众、有效期和所请求操作的权限。只把 JWT 的 payload 解码出来并读取用户 ID，缺少真实性校验。

先完成一个最小流程：登录、访问自己的数据、访问他人数据被拦截、退出或凭据过期后的处理。前端隐藏按钮只改变界面；真正的数据访问判断仍要在服务端执行。后面的协议与令牌细节，都应回到这几条实际验收路径上。

## 1. 本文覆盖范围

- 授权码与 PKCE
- OIDC ID Token
- JWT 验证
- Refresh token、撤销与资源服务器

## 2. 核心知识详解

### 1. 角色与流程

OAuth 定义 resource owner、client、authorization server 和 resource server。浏览器/移动端通常使用 Authorization Code + PKCE。

- redirect URI 精确匹配，state 防请求关联攻击，nonce 关联 OIDC 登录。
- 公开客户端不保存 client secret。
- 避免隐式授权和资源所有者密码流程。

**这里容易混淆的是：** OAuth access token 证明授权，不天然证明用户登录属性；OIDC ID Token 面向 client 身份会话。

### 2. JWT 验证

JWT 是带声明的 JWS/JWE 容器。资源服务器验证签名算法、issuer、audience、有效期、not-before 和业务权限。

- 算法由服务端配置白名单，不信任 header 自选。
- 按 `kid` 获取并缓存可信 JWK，处理轮换。
- 令牌只放必要声明，避免敏感数据和过大 header。

**这里容易混淆的是：** Base64URL 编码不是加密；签名 JWT 的 payload 对持有者可见。

### 3. 令牌生命周期

短 access token 限制泄露窗口；refresh token 用于获取新 token，并执行 rotation、重用检测和客户端绑定。

- 撤销、登出、密码/权限变化定义传播延迟。
- 浏览器 token 优先安全 cookie/BFF，降低脚本窃取面。
- 服务间使用专用 client identity 和最小 scope。

**这里容易混淆的是：** “无状态 JWT”不代表系统没有状态；密钥、授权、撤销、客户端和审计仍是状态。

### 4. API 防护

API 除身份外还需输入校验、对象级授权、CSRF/CORS、速率限制、审计和秘密管理。

- CORS 是浏览器读取策略，不是认证。
- cookie 认证的状态变更请求使用 CSRF token/SameSite 等防护。
- 输出编码、参数化查询和安全反序列化分别处理不同注入面。

**这里容易混淆的是：** 允许任意 Origin 并携带凭据会扩大跨站风险；规则应是明确来源白名单。

## 3. 工程链路

```mermaid
sequenceDiagram
  participant U as Browser
  participant C as Client/BFF
  participant A as Authorization Server
  participant R as Resource Server
  U->>A: authorize + PKCE challenge + state
  A-->>C: code
  C->>A: code + verifier
  A-->>C: access token / ID token
  C->>R: access token
  R->>R: 验签 + iss/aud/exp/scope
  R-->>C: resource
```

## 4. 最小可运行示例

这只是 JWT payload 的示意，不是可直接使用的令牌。字段能被解码不代表令牌可信；服务端还要校验签名、发行者、受众与有效期。这里的时间值仅用于说明字段，实际测试请生成有效的测试令牌。

```json
{
  "iss": "https://id.example.com",
  "sub": "user-42",
  "aud": ["order-api"],
  "exp": 1785000000,
  "scope": "orders:read orders:write"
}
```

## 5. 实践与验证

1. 画出 BFF 授权码+PKCE流程和威胁点。
2. 为资源服务器写错误 issuer、audience、过期和权限不足测试。
3. 设计 refresh rotation 与重用检测状态。

## 6. 掌握检查

- [ ] 能区分 OAuth/OIDC/JWT。
- [ ] 能完整验证 JWT。
- [ ] 能安全管理 refresh token。
- [ ] 能区分 CORS 与 CSRF。

## 参考资料

- [OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [Spring Security OAuth2](https://docs.spring.io/spring-security/reference/servlet/oauth2/)
