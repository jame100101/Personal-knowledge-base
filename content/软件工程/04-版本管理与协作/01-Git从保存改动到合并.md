# Git 从保存改动到合并：给每一次变化留下记录

目录里出现“收藏最终版”“收藏最终版2”“真的最终版”时，你已经遇到版本管理的问题。我们希望知道改了什么、为什么改、怎样回到可用状态。Git 用提交记录变化，不要求你靠文件夹名字记住全部历史。本章在独立练习目录操作，避免拿真实项目试验。

## 1. 先区分三个位置

工作区是你正在编辑的文件。暂存区是准备放进下一次提交的内容。仓库记录已经提交的历史。保存文件只是改了工作区；`git add` 选择要记录的内容；`git commit` 建立一次提交。

Git 是版本控制工具，GitHub 是一种仓库托管与协作平台。提交到本地不等于上传到 GitHub；`push` 才会尝试把提交发送到远端。反过来，联网不是建立本地提交的必要条件。

## 2. 建一个可以放心练习的仓库

以下命令适用于 macOS、Linux 或 Git Bash，要求已安装 Git，并在一个不存在同名子目录的位置运行：

```bash
mkdir favorite-git-lab
cd favorite-git-lab
git init -b main
git config user.name "Learning User"
git config user.email "learner@example.com"
printf '收藏：保存稍后阅读的文章
' > README.md
git status
git add README.md
git diff --staged
git commit -m "docs: describe favorite goal"
```

这里的身份配置只作用于练习仓库，不修改全局设置。`status` 告诉你哪些文件变了；`diff --staged` 查看将进入提交的内容。提交成功后，再执行 `git status`，应看到没有待提交改动。

## 3. 在分支上完成一件小事

分支可理解为指向一串提交中某个提交的可移动名字，建立分支不会复制一个完整项目文件夹。创建功能分支后，用编辑器给 README 增加一条规则：“同一用户重复保存不增加记录”。

```bash
git switch -c feature/favorite-rule
# 此时在编辑器修改 README.md 并保存
git diff
git add README.md
git commit -m "docs: define duplicate favorite behavior"
git switch main
git merge feature/favorite-rule
git log --oneline --graph --all
```

先编辑再提交，不能把注释当成已经发生的操作。如果提示没有可提交内容，检查文件是否保存、是否位于当前仓库。这个例子主分支没有新增提交，合并通常是快进；不是每次合并都会产生一个额外合并提交。

## 4. 冲突需要人理解两边意图

两条分支修改同一段文本时，Git 可能无法自动决定结果。打开冲突文件，找到标记，阅读两边各自想实现什么，整理成正确内容，删除标记，再暂存并完成合并。不能只为消除红色提示就一律“保留我的”。

如果合并方向选错，尚未完成时可以用 `git merge --abort` 尝试回到合并前状态。开始合并前先保存或提交工作区改动，有助于避免恢复困难。解决冲突后还需要检查和测试，因为文本合并成功不保证行为正确。

## 5. 撤销时先看改动有没有共享

对已经共享的普通提交，可以考虑 `git revert <提交ID>` 创建一条反向改动，保留原历史。它也可能发生冲突。`reset`、变基和强制推送会涉及不同程度的历史调整，不应在未理解影响时用于共享分支。

`.gitignore` 只影响未跟踪文件的忽略规则，不能自动抹掉已经提交的密码。真实项目应从一开始就忽略环境变量文件；若秘密已泄露，需要更换秘密，再处理历史，而不是只删除当前文件。

## 练习与参考答案

`git add` 后又改了同一文件，提交会包含哪一版？包含最近一次暂存的内容；之后的工作区改动不会自动进去。用 `git diff` 看尚未暂存的变化，用 `git diff --staged` 看将提交的变化。理解这点，就能把互不相关的修改分开提交。

## 阅读依据

- [Pro Git 中文版](https://git-scm.com/book/zh/v2)
- [Software Carpentry：Git 入门练习](https://swcarpentry.github.io/git-novice/)
