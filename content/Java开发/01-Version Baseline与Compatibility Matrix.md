# Java Backend Version Baseline 与 Compatibility Matrix

跟教程敲同样的代码却启动失败，有时不是代码写错，而是 JDK、Spring Boot 和插件版本没有配套。这里把版本放在一起核对。它是一份带核验日期的配置记录，不是“全部选最新”的安装清单；升级前仍要查看对应项目的兼容说明。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `verified 2026-08-24`
> - `source_type`: `official-JEP + official-project-docs`
> - `stability`: `fast-moving`

## 本轮核对范围：发布版本和项目兼容是两回事

2026-09-20 核对的 [OpenJDK 发布记录](https://openjdk.org/projects/jdk/27/)确认 JDK 27 已于 9 月 15 日正式发布。因此“当前功能版本还是 26”需要更新，但此前针对 JDK 26 编写的示例仍有它的版本范围，不能把代码里的 26 全部替换成 27。

本次读到的 [Spring Boot 系统要求](https://docs.spring.io/spring-boot/system-requirements.html)页面展示 4.1.1：Java 17 起、兼容范围列到 Java 26、Spring Framework 至少 7.0.9。这份页面并没有为 Java 27 提供兼容承诺。教程继续用 JDK 25；如果要用 27，先找对应 Boot 版本的明确说明，再跑编译、集成测试与部署测试。

2026-09-20 也重新核对了 Spring Cloud 的 Supported Versions、Alibaba 官方 README 和 Spring AI Getting Started。Cloud 2025.1 对应 Boot 4.0.x，Alibaba 2025.1.x 对应 Cloud 2025.1.x / Boot 4.0.x / JDK 17+；Spring AI 2.0.x 则明确支持 Boot 4.0.x 和 4.1.x。这里的“支持”来自各自官方声明，不是本项目把所有组合都跑了一遍。

读这张表时，要取**实际用到的组件兼容范围的交集**。仅使用 Spring AI 的项目，与同时引入 Spring Cloud Alibaba 的项目，最终可选的 Boot 版本可能不同。BOM 负责对齐一组依赖版本，并不让任意两套框架自动兼容。

## 1. 状态词

| 状态 | 含义 |
|---|---|
| LTS | 由具体 vendor 提供长期支持；OpenJDK 六个月发布节奏本身不承诺所有发行版的相同支持期 |
| feature release | 六个月功能发布；后续由新 feature release 取代 |
| GA | 正式发布，可用于生产评估；仍需 vendor 与依赖支持 |
| milestone / RC | 预发布，不作为默认生产基线 |
| preview | API/语言特性可能变化，编译与运行通常需 `--enable-preview` |
| incubator | 非永久 API 模块，命名和设计仍可变化 |
| deprecated / EOL | 计划移除或已结束维护；必须有迁移计划 |

## 2. 基线与 2026-09-20 增量核对

| Component | 教学/项目基线 | 当前状态与约束 |
|---|---|---|
| Java | JDK 25 | 作为本路线 LTS 主线；确认所选发行商支持周期 |
| Java current feature | JDK 27 | 2026-09-15 GA；JDK 25 仍作为本路线教学主线，功能发布不自动替换项目基线 |
| Virtual Threads | Java 21+ | stable；适合 thread-per-request 的阻塞 I/O 可扩展性 |
| Scoped Values | Java 25+ | JEP 506 delivered；用于有界、只读式上下文传播 |
| Structured Concurrency | JDK 26 / 27 | JDK 26 是 JEP 525 第六次预览；JDK 27 是 JEP 533 第七次预览，两者都不是稳定 API |
| Spring Boot | 4.1.x GA line | 官方 4.1.0 于 2026-06 GA，当前 reference 要求 Java 17+，兼容到 Java 26 |
| Spring Framework | 7.0.x line | Boot 4.1 reference 的最低 Framework 版本由 Boot 管理，应用不手工混配 |
| Servlet | 6.1 baseline | Boot 4.1 支持 Tomcat 11/Jetty 12.1 等 Servlet 6.1 容器；包名使用 `jakarta.*` |
| Spring Cloud | 2025.1 Oakwood | 官方矩阵对应 Boot 4.0.x；不要假定对 Boot 4.1 的组合兼容 |
| Spring Cloud Alibaba | 2025.1.x | 官方分支对应 Spring Cloud 2025.1.x / Boot 4.0.x / JDK 17+ |
| Spring AI | 2.0.x | 本次 reference 展示 2.0.1；Getting Started 明确支持 Boot 4.0.x / 4.1.x，按官方 BOM 管理 |

> Spring Boot 4.1 与 Spring Cloud 2025.1 不是已验证组合。需要 Spring Cloud 时以其 Supported Versions 为上限选择 Boot，或等待官方兼容矩阵更新。

## 3. 版本选择流程

1. 选 vendor JDK 并确认支持期；
2. 选 Boot GA line；
3. 若使用 Spring Cloud/Alibaba，反向检查官方 release train matrix；
4. 用 BOM 管理模块，不手工拼接 patch；
5. 检查 CVE、deprecated modules、EOL 与数据库驱动；
6. 在 CI 测试目标 JDK、容器和数据库组合；
7. 把实际版本写入构建文件与 SBOM，不散落在概念文章。

## 4. 官方来源

- [OpenJDK JDK 25](https://openjdk.org/projects/jdk/25/)
- [OpenJDK JDK 26](https://openjdk.org/projects/jdk/26/)
- [JEP 506: Scoped Values](https://openjdk.org/jeps/506)
- [JEP 525: Structured Concurrency (Sixth Preview)](https://openjdk.org/jeps/525)
- [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Spring Cloud supported versions](https://github.com/spring-cloud/spring-cloud-release/wiki/Supported-Versions)
- [Spring Cloud Alibaba repository](https://github.com/alibaba/spring-cloud-alibaba)
- [Spring AI reference](https://docs.spring.io/spring-ai/reference/)

- [Spring AI Getting Started：Boot 兼容范围](https://docs.spring.io/spring-ai/reference/getting-started.html)
