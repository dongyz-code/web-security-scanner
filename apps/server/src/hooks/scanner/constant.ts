import type { HTTPResponse } from 'puppeteer';

/** puppeteer会自动将请求头变成全小写 */
export const WEB_SECURITY_LIBRARY: {
  v_type: string;
  risk: 'risk_low' | 'risk_medium' | 'risk_high';
  check_headers: string[];
  name: string;
  category: string;
  description: string;
  validate: (response: HTTPResponse) => boolean;
}[] = [
  {
    v_type: 'MISSING_HSTS',
    risk: 'risk_low',
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
    risk: 'risk_low',
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
    risk: 'risk_low',
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
    risk: 'risk_low',
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
    risk: 'risk_low',
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
    risk: 'risk_low',
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
  {
    v_type: 'MISSING_SAMESITE_CONTROL',
    risk: 'risk_low',
    check_headers: ['set-cookie'],
    name: '未检测到同站标标记的Cookie',
    category: 'security-header',
    description: `
"未检测到同站标标记的Cookie"（Cookie Without SameSite Flag Detected）是一个Web安全测试用例，它指出在对Web应用进行渗透测试时，测试人员发现应用设置的某些cookies没有使用SameSite属性。SameSite属性是一个相对较新的安全特性，旨在减少跨站请求伪造（CSRF）攻击的风险。

什么是SameSite属性？
SameSite属性是cookie的一个属性，可以用来控制cookie的跨站请求行为。它允许服务器指示浏览器应该在跨站请求时限制cookie的发送。SameSite属性有三个可能的值：
Lax：允许从原始页面和同一站点的请求中发送cookie，但在第三方上下文中不会发送。
Strict：仅在原始页面的请求中发送cookie，不允许在任何跨站请求中发送。
None：cookie可以随跨站请求发送，但要求服务器设置Secure属性，即cookie只能在HTTPS连接中发送。

为什么SameSite属性很重要？
减少CSRF攻击风险：通过限制第三方请求携带cookie，SameSite属性可以减少CSRF攻击的潜在威胁。
提高用户隐私：限制第三方网站访问cookie可以减少用户跟踪和数据泄露的风险。
符合安全最佳实践：使用SameSite属性是提高Web应用安全性和隐私保护的最佳实践之一。

如何设置SameSite属性？
在服务器端设置cookie时，需要在Set-Cookie响应头中添加SameSite属性。例如：
Set-Cookie: sessionId=abc123; SameSite=Lax; Secure;
在这个例子中，sessionId cookie被设置了SameSite=Lax属性，这意味着它在第三方请求中不会被发送，除非请求是从原始站点发起的。
`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      const cookie = headers['set-cookie'];
      if (!cookie) {
        return true;
      }
      const cookieArr = cookie.split(';');
      return cookieArr.every((v) => v.includes('SameSite'));
    },
  },
  {
    v_type: 'MISSING_Permissions_Policy',
    risk: 'risk_low',
    check_headers: ['permissions-policy'],
    name: '缺少权限策略',
    category: 'security-header',
    description: `
    在渗透测试中，“Missing Permissions Policy”（缺少权限策略）是指检测目标系统是否缺少了对特定功能或资源的权限控制策略。这种策略通常用于限制浏览器中的功能，以防止潜在的安全威胁，特别是针对那些可以被第三方内容滥用的功能。下面是对这一测试用例的详细解释。

缺少权限策略的意义
权限策略是一种安全机制，它允许网站指定哪些浏览器功能可以被第三方内容访问或使用。通过设置权限策略，可以限制特定API的可用性，从而减少安全风险。例如，可以限制对摄像头或麦克风的访问，防止恶意脚本滥用这些功能。
权限策略的设置
权限策略是通过在HTTP响应头中设置Permissions-Policy字段来实现的。例如：
Permissions-Policy: geolocation=(), camera=(), microphone=()
上述示例表示禁用了地理位置、摄像头和麦克风功能。
    `,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return !!headers['permissions-policy'];
    },
  },
  {
    v_type: 'MISSING_REFERRER_POLICY',
    risk: 'risk_low',
    check_headers: ['referrer-policy'],
    name: '缺少Referrer-Policy头实例',
    category: 'security-header',
    description: `
    在渗透测试中，“Missing Referrer Policy”（缺少推荐人策略）是指检测目标网站是否缺少了Referrer Policy（推荐人策略）。Referrer Policy是一种HTTP头部，用于控制浏览器如何发送referrer信息（即请求来源信息）到其他网站。正确设置Referrer Policy可以帮助保护用户的隐私，并减少跨站脚本（XSS）攻击的风险。

Referrer Policy的意义
Referrer Policy的作用是控制浏览器在发出请求时如何处理referrer头，以决定是否以及如何发送referrer信息。这对于保护用户隐私非常重要，因为referrer信息可以包含敏感的URL数据，例如用户访问过的页面地址。此外，正确的Referrer Policy设置还可以帮助防御某些类型的XSS攻击。

手动检查：直接查看HTTP响应头中的Referrer-Policy字段，确认是否设置了适当的Referrer Policy

    `,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return !!headers['referrer-policy'];
    },
  },
  {
    v_type: 'MISSING_EXPECT_CT',
    risk: 'risk_low',
    check_headers: ['expect-ct'],
    name: '缺少“Expect-CT”表头',
    category: 'security-header',
    description: `
    在渗透测试中，“Missing 'Expect-CT' Header”（缺少“Expect-CT”标头）是指检测目标网站是否缺少了“Expect-CT”（Expect Certificate Transparency）标头。这是一个重要的安全机制，用于提高HTTPS证书的透明度和信任度，进而增强网站的安全性。

“Expect-CT”标头的意义
“Expect-CT”标头是一种HTTP响应头，用于要求浏览器报告网站的证书透明度信息。证书透明度（Certificate Transparency, CT）是一种公开记录和监控HTTPS证书颁发的机制，它可以帮助网站所有者检测未经授权的证书颁发，从而提高HTTPS证书的信任度和透明度。

测试案例解释
在渗透测试中，“Missing 'Expect-CT' Header”主要关注以下几点：
1、证书透明度：确认网站是否启用了证书透明度，以提高证书的可信度。
2、安全风险：评估缺少“Expect-CT”标头可能导致的安全风险。
3、合规性：检查网站是否符合相关的安全标准和最佳实践。
    `,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return !!headers['expect-ct'];
    },
  },
  {
    v_type: 'MISSING_XSS_AUDITOR',
    risk: 'risk_low',
    check_headers: ['x-xss-protection'],
    name: `缺少'X-XSS-Protection'标头`,
    category: 'security-header',
    description: `
    在渗透测试中，“Missing 'X-XSS-Protection' Header”（缺少“X-XSS-Protection”标头）是指检测目标网站是否缺少了“X-XSS-Protection”标头。这是一个重要的安全机制，用于帮助浏览器自动防御跨站脚本（Cross-Site Scripting, XSS）攻击。

“X-XSS-Protection”标头的意义
“X-XSS-Protection”标头是一种HTTP响应头，用于启用浏览器内置的XSS过滤器，该过滤器可以检测并阻止潜在的XSS攻击。这个机制有助于减少XSS攻击的风险，尤其是在应用程序层面上没有充分防范XSS的情况下。

`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return !!headers['x-xss-protection'];
    },
  },
  {
    v_type: 'DISABLE_XSS_AUDITOR',
    risk: 'risk_low',
    check_headers: ['x-xss-protection'],
    name: `禁用'X-XSS-Protection'标头`,
    category: 'security-header',
    description: `
    在渗透测试中，“Missing 'X-XSS-Protection' Header”（缺少“X-XSS-Protection”标头）是指检测目标网站是否缺少了“X-XSS-Protection”标头。这是一个重要的安全机制，用于帮助浏览器自动防御跨站脚本（Cross-Site Scripting, XSS）攻击。

“X-XSS-Protection”标头的意义
“X-XSS-Protection”标头是一种HTTP响应头，用于启用浏览器内置的XSS过滤器，该过滤器可以检测并阻止潜在的XSS攻击。这个机制有助于减少XSS攻击的风险，尤其是在应用程序层面上没有充分防范XSS的情况下。

`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return !!headers['x-xss-protection'] && !headers['x-xss-protection'].startsWith('0');
    },
  },
  {
    v_type: 'DISABLE_HSTS',
    risk: 'risk_low',
    check_headers: ['Strict-Transport-Security'],
    name: `检测到HTTP严格传输安全策略`,
    category: 'security-header',
    description: `
    在渗透测试中，“HTTP Strict Transport Security Policy Detected”（检测到HTTP严格传输安全策略）是指检测目标网站是否启用了HTTP Strict Transport Security (HSTS)。这是一个重要的安全机制，用于强制浏览器始终使用HTTPS协议与网站通信，从而提高网站的安全性和隐私保护水平。

HTTP Strict Transport Security (HSTS) 的意义
HSTS是一种安全机制，它告诉浏览器该网站只应通过HTTPS协议访问。这意味着即使用户尝试通过HTTP访问网站，浏览器也会自动将请求重定向到HTTPS版本的网站。HSTS有助于防止中间人攻击（Man-in-the-Middle, MITM）和其他类型的安全威胁，因为它确保了所有通信都是加密的。

测试案例解释
在渗透测试中，“HTTP Strict Transport Security Policy Detected”主要关注以下几点：
HSTS启用：确认网站是否启用了HSTS策略。
安全风险：评估启用HSTS策略所带来的安全益处。
合规性：检查网站是否符合相关的安全标准和最佳实践。

`,
    validate: (response: HTTPResponse) => {
      const headers = response.headers();
      return !!headers['strict-transport-security'];
    },
  },
];

/** 漏洞风险级别 */
export const RISK_LEVEL_MAP = {
  risk_low: '低危',
  risk_medium: '中危',
  risk_high: '高危',
  risk_critical: '超危',
};

/** 总体风险级别 */
export const TOTAL_RISK_LEVEL_MAP = {
  risk_critical: '超高风险',
  risk_low: '高风险',
  risk_medium: '中风险',
  risk_high: '低风险',
};

export type RiskLevel = keyof typeof RISK_LEVEL_MAP;

export enum REPORT_DEFAULT_INFO {
  REPORT_NAME = '脉络洞察渗透测试报告',
  REPORT_SECRET_LEVEL = '商密',
  REPORT_CREATOR = '脉络安全服务团队',
  REPORT_VERSION = 'V1.0',
}
