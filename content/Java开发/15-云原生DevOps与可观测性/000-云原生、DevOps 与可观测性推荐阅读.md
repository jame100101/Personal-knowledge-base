# 云原生、DevOps 与可观测性推荐阅读

这一组资料适合配合一个已经能运行的小服务阅读：先做镜像，再部署，再观察一次发布和故障。每一步都留下可重复的命令，下一次发布才不必重新凭记忆操作。

交付能力覆盖镜像、部署、配置、迁移、发布、回滚、遥测、SLO 和值班响应，使服务从“可运行”走向“可运营”。

## 官方资料优先顺序

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [OpenTelemetry Java](https://opentelemetry.io/docs/languages/java/)
- [OpenSLO](https://openslo.com/)

## 阅读方法

先选择本阶段正在练习的一项功能，按官方快速开始做通。随后带着实际遇到的问题查参考手册：参数默认值是什么，出错时返回什么，哪些行为随版本变化？把查到的结果写进测试或运行记录。升级时再看迁移说明，不必每次从文档第一页重新读起。
