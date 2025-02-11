import type { HTTPResponse } from 'puppeteer';

/** puppeteer会自动将请求头变成全小写 */
export const WEB_SECURITY_LIBRARY = [
  {
    v_type: 'MISSING_HSTS',
    risk: '中风险',
    check_headers: ['Strict-Transport-Security'],
    name: '缺少HTTP严格传输安全策略',
    category: 'security-header',
    description: `HTTP 严格传输安全策略（HTTP Strict Transport Security，简称 HSTS）是一种网络安全机制，用来保护网站免受某些类型的中间人攻击，特别是 SSL 剥离攻击。
HSTS 是一种由服务器端设置的响应头（Strict-Transport-Security），它告诉浏览器在未来的通信中只通过 HTTPS 与该服务器通信，即使用户点击了一个不安全的 HTTP 链接。这可以防止攻击者通过将 HTTPS 流量降级到 HTTP 来窃取敏感信息。
这个测试用例指出目标网站没有实施 HSTS 策略。测试通过
这个测试用例可能是指在检查过程中发现的特定实例或情况，其中网站没有使用 HSTS 策略来保护特定的页面或资源。例如，如果一个网站只有一个页面或几个页面没有通过 HTTPS 提供，那么这些页面就被认为是缺少 HSTS 策略的实例。
为什么 HSTS 很重要？
防止 SSL 剥离攻击：这种攻击发生在攻击者在用户与服务器建立安全连接之前拦截用户的请求，将 HTTPS 流量降级到 HTTP，从而允许攻击者查看或修改传输的数据。
增强用户数据的保密性：通过强制使用 HTTPS，HSTS 确保用户数据在传输过程中被加密，防止窃听和数据泄露。
减少某些类型的钓鱼攻击：如果用户书签了 HTTPS 网站，HSTS 可以防止攻击者通过使用看似合法的 HTTP 链接来欺骗用户。

如何实施 HSTS？
1、设置响应头：在服务器配置中添加 Strict-Transport-Security 响应头，例如：
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
这个头指示浏览器在一年（31536000 秒）内只通过 HTTPS 与该域及其子域通信，并考虑将该域包含在 HSTS 预加载列表中。
2、配置 Web 服务器：确保所有的 HTTP 请求都被重定向到 HTTPS。
3、更新安全策略：定期审查和更新 HSTS 策略，以确保其仍然符合安全最佳实践。
`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return !!headers['strict-transport-security'];
    },
  },
  {
    v_type: 'MISSING_HTTPONLY_COOKIE',
    risk: '中风险',
    check_headers: ['set-cookie'],
    name: '检测到的没有 HttpOnly 标志的 Cookie 实例',
    category: 'security-header',
    description: `这个测试用例指出在对Web应用进行渗透测试时，测试人员发现应用设置的cookies没有使用HttpOnly标志。HttpOnly是一个cookie的属性，当设置后，这个cookie不会被JavaScript的document.cookie API访问。这可以减少跨站脚本攻击（XSS）的风险，因为即使攻击者能够通过XSS漏洞注入恶意脚本，该脚本也无法读取带有HttpOnly属性的cookie。`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      const cookie = headers['set-cookie'];
      if (!cookie) {
        return true;
      }
      const cookieArr = cookie.split(';');
      return cookieArr.every((v) => v.includes('HttpOnly'));
    },
  },
  {
    v_type: 'MISSING_SECURE_COOKIE',
    risk: '中风险',
    check_headers: ['set-cookie'],
    name: '缺少Secure标志的Cookie实例',
    category: 'security-header',
    description: `“Cookie Without Secure Flag Detected”（检测到未设置安全标志的Cookie）是一个常见的测试案例。这通常是指HTTP响应中的Set-Cookie头缺少了Secure属性。下面我将详细解释这一概念以及它的重要性。
安全标志 (Secure Flag) 的意义
当一个Cookie被标记为“Secure”，这意味着该Cookie只应该通过HTTPS安全连接发送。换句话说，浏览器不会通过非加密的HTTP连接发送带有Secure标志的Cookie。这样的做法可以防止中间人攻击者（Man-in-the-Middle, MITM）窃取这些Cookie，因为非加密的HTTP流量可以被轻易地监听和捕获。
在进行渗透测试时，如果发现了缺少Secure标志的Cookie，那么这意味着：
潜在的安全风险：攻击者可能通过非安全的HTTP连接截获这些Cookie，并利用它们来进行会话劫持或身份冒充等攻击。
不符合最佳实践：根据OWASP（开放Web应用程序安全项目）的最佳实践指南，所有包含敏感信息的Cookie都应该设置Secure标志。
`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      const cookie = headers['set-cookie'];
      if (!cookie) {
        return true;
      }
      const cookieArr = cookie.split(';');
      return cookieArr.every((v) => v.includes('Secure'));
    },
  },
  {
    v_type: 'MISSING_X-Content-Type-Options',
    risk: '中风险',
    check_headers: ['x-content-type-options'],
    name: '缺少X-Content-Type-Options头实例',
    category: 'security-header',
    description: `X-Content-Type-Options 是一个用于增加Web应用安全性的HTTP响应头。它目前只有一个有效的值：nosniff。当设置为 nosniff 时，它告诉浏览器不要尝试猜测响应内容的类型（即MIME类型），而是应该严格使用服务器所声明的MIME类型来处理响应内容。
为什么这个标头很重要？
1、防止 MIME 类型混淆攻击：某些攻击者可能会尝试上传一个恶意文件，该文件的实际内容与其扩展名或MIME类型不匹配。如果浏览器尝试猜测MIME类型，它可能会错误地将恶意文件解释为一个无害的类型，例如将一个可执行文件解释为图片。nosniff 选项可以防止这种情况发生。
2、增强数据的安全性：通过确保浏览器按照服务器指定的MIME类型来处理数据，可以减少由于内容误解而导致的安全风险。
3、符合安全最佳实践：使用 X-Content-Type-Options 响应头是提高Web应用安全性的最佳实践之一。

如何设置 X-Content-Type-Options 响应头？
要在Web应用中设置 X-Content-Type-Options 响应头，你可以在服务器的配置中添加以下指令：
对于Apache服务器，可以在 .htaccess 文件或服务器配置文件中添加： Header set X-Content-Type-Options "nosniff"
对于Nginx服务器，可以在配置文件中添加： add_header X-Content-Type-Options "nosniff";
对于IIS服务器，可以通过IIS管理器设置响应头。
对于Node.js等Web应用框架，可以在应用的中间件中设置这个响应头。
`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return headers['x-content-type-options'] === 'nosniff';
    },
  },
  {
    v_type: 'MISSING_CSP',
    risk: '中风险',
    check_headers: ['content-security-policy'],
    name: '缺少CSP头实例',
    category: 'security-header',
    description: `什么是内容安全策略（CSP）？
内容安全策略是一个额外的安全层，用于减少跨站脚本（XSS）和其他某些类型的攻击。通过 Content-Security-Policy HTTP响应头，网站管理员可以指定哪些动态资源（如JavaScript、CSS、图片等）是允许加载的，以及这些资源可以从哪些来源请求。

为什么CSP很重要？
1、防止XSS攻击：通过限制可以执行的脚本的来源，CSP可以减少XSS攻击的机会。
2、控制资源加载：CSP允许网站指定哪些类型的资源可以被加载，以及这些资源可以来自哪里。
3、减少数据泄露风险：通过限制连接到不受信任的源，CSP有助于防止数据泄露。
4、增强Web应用的安全性：CSP是提高Web应用安全性的最佳实践之一。

如何设置CSP？
要在Web应用中设置CSP，你需要在服务器的HTTP响应头部中添加 Content-Security-Policy 响应头。例如：
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com;
这个例子中，default-src 指定了默认的资源来源是当前域（'self'），而 script-src 指定了JavaScript脚本只能从当前域或 https://trusted.cdn.com 加载。
`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return !!headers['content-security-policy'];
    },
  },
  {
    v_type: 'MISSING_CACHE_CONTROL',
    risk: '中风险',
    check_headers: ['cache-control'],
    name: `缺少“缓存控制”标头实例`,
    category: 'security-header',
    description: `"缺少 Cache-Control 头文件"（Missing 'Cache-Control' Header）是一个Web安全和性能测试用例，它指出Web应用在HTTP响应中没有设置 Cache-Control 响应头。这个响应头用于控制响应的缓存行为，对保护敏感信息和优化网站性能都非常重要。
什么是 Cache-Control 响应头？
Cache-Control 是一个用于Web缓存控制的HTTP响应头。它提供一种机制，允许服务器指明浏览器和中间缓存（如代理服务器）如何存储和使用响应数据。

为什么 Cache-Control 很重要？
1、防止敏感信息缓存：如果敏感信息（如登录凭证、个人数据等）被客户端或中间代理缓存，可能会被未授权访问。
2、控制数据新鲜度：通过设置如 no-cache 或 max-age 指令，可以控制数据的新鲜度，确保用户获取最新的内容。
3、优化网站性能：适当的缓存策略可以减少服务器负载，加快内容的加载速度。
4、符合安全最佳实践：对于某些类型的响应，如登录页面或包含敏感信息的页面，使用 Cache-Control 头是提高Web应用安全性的最佳实践之一。

如何设置 Cache-Control 响应头？
要在Web应用中设置 Cache-Control 响应头，你可以在服务器的配置中添加相应的指令。例如：
禁止缓存任何内容：Cache-Control: no-store
允许缓存，但必须重新验证：Cache-Control: no-cache
设置内容在缓存中的最长存储时间：Cache-Control: max-age=3600
允许公共缓存但禁止转换内容：Cache-Control: public, no-transform

检查Web应用的HTTP响应头部，以确定是否设置了 Cache-Control 响应头。如果发现缺少这个响应头，这可能意味着：
•	敏感页面或数据可能被客户端或中间代理缓存，增加了信息泄露的风险。
•	Web应用可能没有充分利用缓存来优化性能。
`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return !!headers['cache-control'];
    },
  },
];
