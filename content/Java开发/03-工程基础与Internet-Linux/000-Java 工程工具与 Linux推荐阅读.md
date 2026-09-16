# Java 工程工具与 Linux推荐阅读

这些资料不必一次读完。先选 Maven 或 Gradle 跑通构建，再用 Git 保存一次改动，最后到 Linux 查看进程和日志。每遇到一个实际问题，再回到相应手册查细节，会比连续读工具名词更有效。

从开发机到 CI 和生产环境，工具链必须可复现、可诊断、可回滚。

## 官方资料优先顺序

- [IntelliJ IDEA Documentation](https://www.jetbrains.com/help/idea/getting-started.html)
- [Apache Maven Guides](https://maven.apache.org/guides/)
- [Gradle User Manual](https://docs.gradle.org/current/userguide/userguide.html)
- [Pro Git](https://git-scm.com/book/zh/v2)
- [Docker Documentation](https://docs.docker.com/)
- [GNU Bash Manual](https://www.gnu.org/software/bash/manual/)

## 阅读方法

先选择本阶段正在练习的一项功能，按官方快速开始做通。随后带着实际遇到的问题查参考手册：参数默认值是什么，出错时返回什么，哪些行为随版本变化？把查到的结果写进测试或运行记录。升级时再看迁移说明，不必每次从文档第一页重新读起。
