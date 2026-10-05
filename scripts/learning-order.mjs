// Shared by all importers. Names/filenames are identities; URLs are not renamed.
export const rootSequence = [
  '语言基础',
  '软件工程',
  '前端架构',
  '后端知识',
  'Java开发',
  'Agent开发',
]
const folderSequences = {
  前端架构: [
    '从网页基础开始',
    '浏览器与工程基础',
    'Vue从入门到原理',
    'React从入门到原理',
    '组件与架构设计',
    '路由数据与渲染',
    '质量安全与交付',
    '双框架实战与选型',
  ],
  后端知识: [
    '请求与接口基础',
    '数据与存储',
    '身份权限与安全',
    '常见后端架构',
    '分布式与可靠性',
    '部署与可观测性',
    '项目实战与选型',
  ],
  Java开发: [
    'Java语言与核心API',
    '工程基础与Internet-Linux',
    '关系型数据库',
    'Spring Framework',
    'Spring Boot与Web',
    '数据访问与事务',
    '测试与质量工程',
    '安全认证与授权',
    '应用架构与模块化单体',
    '缓存与搜索',
    '消息与事件驱动',
    '分布式与微服务',
    'JVM与并发',
    '性能工程',
    '云原生DevOps与可观测性',
    '项目阶梯',
    '可选专项',
    '开源项目架构研究',
  ],
  Agent开发: [
    'Agent基础',
    'Agent Loop',
    'Context Engineering',
    'Tools与Runtime',
    'Knowledge与Memory',
    'Agent Harness',
    'Skills与Protocols',
    'Evaluation Observability Safety',
    'Production Agent',
    'Project Ladder',
    '完整Agent链路与架构对照',
    'Multi-Agent',
    'Agent Evolution',
    'Model Post-training',
    '现代Agent架构与源码研究',
  ],
}
const documentSequences = {
  'Java开发/Spring Framework': [
    '05-Spring产品族责任边界.md',
    '01-IoC依赖注入与Bean生命周期.md',
    '02-Spring-AOP代理与事务.md',
    '03-Spring资源事件校验缓存与调度.md',
    '04-Spring异步定时任务Quartz与Batch.md',
  ],
  'Java开发/Java语言与核心API': [
    '01-Java开发入门.md',
    '02-Java编程基础.md',
    '03-面向对象上.md',
    '04-面向对象下.md',
    '05-异常处理.md',
    '06-Java核心API.md',
    '08-Java泛型.md',
    '07-Java集合框架.md',
    '14-泛型与集合框架综合.md',
    '09-反射机制.md',
    '10-IO与NIO.md',
    '11-JDBC数据库访问.md',
  ],
  'Java开发/项目阶梯': [
    '01-P0到P8 Java后端项目阶梯.md',
    '01-项目一模块化单体任务系统.md',
    '02-项目二事件驱动订单与库存系统.md',
    '03-项目三云原生高可用平台.md',
    '04-作品集验收与面试证据.md',
  ],
  'Java开发/可选专项/前端与全栈交付': [
    '01-Web-HTML-CSS-JavaScript与TypeScript基础.md',
    '04-HTML语义表单媒体与可访问性.md',
    '05-CSS级联盒模型布局响应式与动画.md',
    '06-JavaScript基础类型函数集合DOM与事件.md',
    '07-JavaScript高级异步模块网络与性能.md',
    '02-Vue3-TypeScript与后台管理界面.md',
    '08-TypeScript-Vue工程化测试与性能.md',
    '03-全栈契约认证上传下载WebSocket与Nginx.md',
  ],
  'Agent开发/Agent基础': [
    '03-Agent适用范围.md',
    '01-Agent类型区分.md',
    '02-Agent基本循环.md',
    '04-SWE Agent基础概念与ACI.md',
    '05-统一工程模型与概念边界.md',
  ],
  'Agent开发/现代Agent架构与源码研究': [
    'AGENT_SOURCE_01_CODEX.md',
    'AGENT_SOURCE_02_CLAUDE_CODE.md',
    'AGENT_SOURCE_04_HERMES_AGENT.md',
    'AGENT_SOURCE_05_OPENCLAW.md',
    'AGENT_SOURCE_07_AIDER.md',
    'AGENT_SOURCE_08_GOOSE.md',
    'AGENT_SOURCE_09_OPENCODE.md',
    'AGENT_SOURCE_10_DEEPSEEK_HARNESS_WEB.md',
    'AGENT_SOURCE_11_PI_AGENT.md',
    'AGENT_SOURCE_12_GROK_BUILD.md',
    'AGENT_SOURCE_06_COMPARISON.md',
  ],
}
export const displayName = (value) => value.replace(/^\d{2,3}-/, '')
export const cleanPath = (value) =>
  value.replaceAll('\\', '/').split('/').filter(Boolean).map(displayName).join('/')
export function rootOrder(name) {
  const index = rootSequence.indexOf(name)
  return index < 0 ? 1000 : (index + 1) * 10
}
export function folderOrder(root, relative, fallback = 1000) {
  const parts = cleanPath(relative).split('/')
  if (parts.length === 1) {
    const index = folderSequences[root]?.indexOf(parts[0]) ?? -1
    if (index >= 0) return (index + 1) * 10
  }
  // Browser runtime is a specialization after the six tool/runtime lessons.
  if (root === 'Agent开发' && parts.join('/') === 'Tools与Runtime/Browser Runtime')
    return 100
  return fallback
}
export function documentOrder(root, parent, filename, fallback = 1000) {
  if (/^00-/.test(filename)) return 0
  if (/^000-/.test(filename) || /推荐阅读/.test(filename)) return 900
  const index =
    documentSequences[`${root}/${cleanPath(parent || '')}`]?.indexOf(filename) ?? -1
  if (index >= 0) return (index + 1) * 10
  return fallback
}
