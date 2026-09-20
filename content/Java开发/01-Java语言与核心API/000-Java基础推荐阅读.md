# Java 基础推荐阅读

课件适合按顺序入门，官方教程适合补充例子，API 文档则适合查一个方法的具体行为。下面按这些用途整理资料。读到版本差异时，先核对自己安装的 JDK，再决定要不要跟进新写法。

基础部分按“语言规范与教程 → API → JVM/工具 → 课件实践”的顺序学习。JDK 25 LTS 用作主线，JDK 26 的既有示例按原版本阅读；截至 2026-09-20，JDK 27 已正式发布，版本差异见同级路线中的兼容矩阵，不把功能版本直接换成项目默认版本。

## 官方资料优先顺序

- [Dev.java Learn](https://dev.java/learn/)
- [Java SE 26 API](https://docs.oracle.com/en/java/javase/26/docs/api/)
- [Java Language Specification 26](https://docs.oracle.com/javase/specs/jls/se26/html/)
- [Java Virtual Machine Specification 26](https://docs.oracle.com/javase/specs/jvms/se26/html/)
- [Java SE 26 Core Libraries Guide](https://docs.oracle.com/en/java/javase/26/core/java-core-libraries1.html)
- [OpenJDK JDK 25](https://openjdk.org/projects/jdk/25/)

## 阅读方法

先选择本阶段正在练习的一项功能，按官方快速开始做通。随后带着实际遇到的问题查参考手册：参数默认值是什么，出错时返回什么，哪些行为随版本变化？把查到的结果写进测试或运行记录。升级时再看迁移说明，不必每次从文档第一页重新读起。
