# JDK、IDE、Maven 与 Gradle：可复现 Java 构建

IDE 的运行按钮背后，仍然需要 JDK、依赖解析和构建命令。把这几层分开后，就能判断问题出在编辑器配置、项目描述还是运行环境。本章先建立命令行可重复的构建，再看 IDE 怎样使用它。

本章把 JDK toolchain、IDE 导入、Maven 生命周期/依赖机制和 Gradle 任务图连成一条可复现构建链。

## 1. 本文覆盖范围

- JDK 25 LTS 与 JDK 26 的版本策略
- IDEA Project SDK、language level、模块和运行配置
- Maven POM、生命周期、scope、BOM、多模块与私服
- Gradle task、configuration、toolchain、version catalog 与多项目

## 2. 核心知识详解

### 1. 工具链与目标字节码

构建时先分清两个问题：由哪个 JDK 执行编译，以及生成的程序准备在哪个 Java 版本运行。Toolchain 解决前一个问题；`--release` 则同时约束语言、目标 class 版本和对应 Java 平台 API。它们互相配合，并非同一个选项。

例如，用 JDK 25 构建但要运行在 Java 21 上，Gradle 可以选择 25 的 toolchain，同时给 `JavaCompile` 设置 `options.release = 21`；Maven Compiler Plugin 则配置 `release`。仅设置 `sourceCompatibility` / `targetCompatibility` 不足以拦住误用较新 JDK API。第三方依赖还要单独检查字节码和运行要求，最后在目标 JDK 上测试。参见 [Gradle Toolchains](https://docs.gradle.org/current/userguide/toolchains.html)。

- 构建记录 `java -version`、操作系统、架构和依赖锁定信息。
- preview 特性需要编译、测试、运行阶段一致启用，并与长期维护模块隔离。
- IDE 只导入构建模型，不作为依赖版本的唯一真实来源。

**这里容易混淆的是：** `source/target` 只限制语法和字节码时可能仍错误引用新 API，`--release` 同时约束标准 API 视图。

### 2. Maven 生命周期与坐标

Maven 按 validate、compile、test、package、verify、install、deploy 生命周期阶段执行绑定插件。依赖坐标由 groupId/artifactId/version/classifier/type 识别，scope 决定编译、测试和运行可见性。

- 使用 dependencyManagement/BOM 统一版本，真正使用仍需 dependencies 声明。
- 多模块 reactor 按模块依赖拓扑构建，parent POM 与 aggregator 可以重合也可以分离。
- 用 dependency:tree、dependency:analyze 和 Enforcer 定位冲突与未声明依赖。

**这里容易混淆的是：** Maven 的“nearest definition”版本仲裁不等于选择最新版本；关键依赖应显式受 BOM/management 控制。

### 3. Gradle 任务图与依赖管理

Gradle 配置阶段构造 task graph，执行阶段运行需要的任务。Java 插件建立标准 source set；configuration 决定依赖暴露边界，`implementation` 不向消费者泄漏。

- 版本目录和 platform 集中版本，dependency locking 提高重现性。
- 多项目通过声明 project dependency 建立构建顺序，避免跨项目直接读写任务内部状态。
- 配置缓存、构建缓存和增量任务要求准确声明 inputs/outputs。

**这里容易混淆的是：** Gradle 动态版本和 SNAPSHOT 会削弱可复现性；生产构建锁定版本和校验依赖来源。

### 4. 依赖供应链与私服

依赖解析不仅是“下载 jar”，还涉及仓库优先级、校验和、签名、许可证、漏洞和传递依赖。企业私服可代理公共仓库并托管内部构件。

- 减少仓库数量，避免把不可信仓库放在公共坐标前。
- 生成 SBOM，运行 SCA，设定升级和 CVE 响应流程。
- 构建产物带 commit、版本和 provenance，可从制品回溯源码。

**这里容易混淆的是：** 锁版本只解决漂移，不证明依赖可信；仍需来源、哈希、审计和发布权限控制。

## 3. 工程链路

```mermaid
flowchart LR
  A["源码 + 构建声明"] --> B["固定 JDK Toolchain"]
  B --> C["解析并校验依赖"]
  C --> D["compile / test / verify"]
  D --> E["可重复制品 + SBOM"]
  E --> F["制品仓库"]
```

## 4. 最小可运行示例

这段内容应合并到 `pom.xml`，不是一份完整 POM。先留意 `release` 与源文件编码：它们影响编译目标与文本解释。测试依赖还要与测试插件配套，合并后用 Wrapper 跑一次测试，而不只看 IDE 是否识别注解。

```xml
<properties>
  <maven.compiler.release>25</maven.compiler.release>
  <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
<dependencies>
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>6.0.2</version>
    <scope>test</scope>
  </dependency>
</dependencies>
```

## 5. 实践与验证

1. 创建 Maven 多模块项目，使用 BOM 和 Enforcer 阻止依赖版本漂移。
2. 用 Gradle Toolchains 在本机缺少目标 JDK 时完成编译与测试。
3. 故意引入两个不同版本的日志依赖，分别用 Maven 和 Gradle 解释最终解析结果。

## 6. 掌握检查

- [ ] 能解释 Maven 生命周期与插件 goal 的关系。
- [ ] 能区分 dependencyManagement 与 dependencies。
- [ ] 能说明 Gradle configuration、task 和 source set。
- [ ] 能从干净机器复现同一构建。

## 参考资料

- [Maven Dependency Mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
- [Maven Lifecycle](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html)
- [Gradle Java Projects](https://docs.gradle.org/current/userguide/building_java_projects.html)
- [Gradle Dependency Management](https://docs.gradle.org/current/userguide/core_dependency_management.html)
- [Oracle Java Downloads](https://www.oracle.com/java/technologies/downloads/)
