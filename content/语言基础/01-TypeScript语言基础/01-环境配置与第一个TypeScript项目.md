# 环境配置与第一个 TypeScript 项目

刚开始学 TypeScript，最容易卡住的往往不是语法，而是：安装好了，接下来到底运行哪个文件？编辑器没有报错，是不是就算程序写对了？

这篇先把这些问题串起来。我们做一个很小的命令行程序，让它打印一句问候语。你会亲手看到 `.ts` 文件怎样变成 `.js` 文件，再由 Node.js 执行。不急着接框架，也先不引入打包工具。

## 1. 先分清我们要安装什么

这里会用到三个工具，各自负责一件事：

- **Node.js** 负责运行 JavaScript。浏览器也能运行 JavaScript，但这次我们在终端里练习，用 Node.js 更直接。
- **npm** 负责安装项目依赖，通常随 Node.js 一起安装。
- **TypeScript 编译器**负责检查类型、生成 JavaScript。它的命令叫 `tsc`。

先安装仍受支持的 Node.js LTS 版本，然后重新打开终端，输入：

```bash
node --version
npm --version
```

两条命令都打印版本号，就可以往下走。如果提示找不到命令，先检查 Node.js 是否安装完成、终端是否重新打开，以及 PATH 中有没有 Node.js 的安装目录。此时反复安装 TypeScript 并不会解决问题。

Windows PowerShell 可以用 `Get-Command node,npm,npx` 查看命令来自哪里；macOS、Linux 对应的是 `command -v node npm npx`。如果 PowerShell 阻止运行 `npm.ps1`，可以直接使用 `npm.cmd` 和 `npx.cmd`，不必为这个练习修改整台电脑的脚本执行策略。

## 2. 建一个独立的练习目录

在你存放代码的位置执行下面的命令。本章用 TypeScript 5.9.3 作为可复现的练习版本；它不是在声称这是最新版本。先把这一套运行通，再升级版本，更容易判断问题出在哪里。

```bash
mkdir hello-typescript
cd hello-typescript
npm init -y
npm install --save-dev --save-exact typescript@5.9.3 @types/node@24
mkdir src
```

`npm init -y` 会创建 `package.json`，记录项目名称、依赖和脚本。`--save-dev` 表示这些包是开发工具，`--save-exact` 会把本次安装到的具体版本写进依赖配置。`package-lock.json` 还会记录依赖树，分享项目时应一起提交。

这里把 TypeScript 装进项目，而不是全局安装。这样，同一个仓库里的成员可以使用同一套编译器，不必猜对方电脑上的 `tsc` 是哪个版本。

`@types/node` 则是一份给编辑器和编译器看的说明书：它描述 `process`、文件系统等 Node API 的类型。**它不是 Node.js 本身，也不会帮你安装运行环境。**

## 3. 告诉编译器：源码放哪，结果放哪

在项目根目录新建 `tsconfig.json`，写入：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "types": ["node"],
    "strict": true,
    "noEmitOnError": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"]
}
```

第一次看这份配置，先读懂最常用的几项：

| 配置 | 在这个项目里做什么 |
| --- | --- |
| `rootDir` / `outDir` | rootDir 决定源码到产物的目录映射，outDir 指定产物目录；文件选择由 include、files、导入等决定，不由 rootDir 筛选 |
| `strict` | 打开一组更严格的类型检查，例如检查可能为空的值 |
| `noEmitOnError` | 这次编译存在错误时，不生成新的输出文件；已有的旧文件仍然保留 |
| `sourceMap` | 生成源码映射，方便调试时找到原来的 `.ts` 行号 |
| `target` | 决定输出代码采用的 JavaScript 语法级别，不负责安装缺失的 API |
| `module` / `moduleResolution` | 按 Node 的模块规则检查导入，并决定相应的模块输出 |

然后打开刚生成的 `package.json`，保留已有内容，增加顶层 `type` 字段，并把 `scripts` 换成下面这段。**下面只是要合并进去的字段，不是让你删掉整个文件里的依赖。**

```json
{
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js"
  }
}
```

`"type": "module"` 表示这个包里的 `.js` 文件按 ESM 处理。以后写 `import`、`export` 时，这个设置就会参与决定 Node 怎样加载文件。本章的配置针对直接运行在 Node 中的程序；Vite 前端项目通常使用另一套模块配置，先别把两套配置拼到一起。

## 4. 写几行代码，再故意写错一次

新建 `src/index.ts`：

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`
}

console.log(greet("Ada"))
```

括号里的 `name: string` 是在说：调用这个函数时，名字应该是字符串。括号后面的 `: string` 表示函数返回一个字符串。函数体中的模板字符串则是普通 JavaScript 语法。

现在运行：

```bash
npm run typecheck
npm run build
npm start
```

第一条只检查类型；第二条生成 `dist/index.js`；第三条才真正执行程序。正常情况下，最后会看到：

```text
Hello, Ada!
```

接着把 `greet("Ada")` 改成 `greet(42)`，再运行 `npm run typecheck`。编译器会告诉你：`number` 类型的参数不符合 `string` 参数的要求。你甚至还没运行程序，它就已经找到了不一致的地方。

这里也能看出类型检查的作用范围：JavaScript 的模板字符串其实可以把数字拼进去，但我们给 `greet` 约定的是“接收名字字符串”。TypeScript 检查的是这份约定，而不只是程序会不会立即崩溃。

试完后把参数改回 `"Ada"`。以后构建失败时，也不要直接启动 `dist` 里的旧文件来判断修改是否生效；旧文件可能还在，运行结果并不代表这次源码。

## 5. 从一个字符串，走到一个用户对象

下面可以替换整个 `src/index.ts`，让函数一次接收用户编号和姓名：

```typescript
type User = {
  readonly id: string
  name: string
}

function greet(user: User): string {
  return `Hello, ${user.name}!`
}

const currentUser = { id: "u-1", name: "Ada", role: "admin" }
console.log(greet(currentUser))
```

先看函数实际需要什么：它接收一个符合 `User` 结构的对象。`currentUser` 有 `id` 和 `name`，所以即使它还带着 `role`，也可以传进去。这叫**结构化类型**，之后会专门展开。

`readonly id` 限制的是通过 `User` 类型访问时对 `id` 的赋值，不会把真实对象冻结。还有一个容易让人困惑的细节：如果把带 `role` 的对象字面量直接写在 `greet(...)` 里面，会遇到多余属性检查。这个额外检查常用来抓属性拼写错误，并不意味着所有带额外字段的变量都会被拒绝。

## 6. 调试时看源码，不要只盯着生成文件

打开 `dist/index.js`，你会发现 `type User`、`: string` 这些类型写法已经不见了。程序里的函数、对象和 `console.log` 还在。这正是下一篇要讲的“类型擦除”。

需要查看报错堆栈时，可以这样启动：

```bash
node --enable-source-maps dist/index.js
```

这会利用 `.map` 文件把位置映射回源码。源码映射有时会包含源码内容或源码路径，发布时要考虑它们是否适合公开；密钥本来就不应该写进源码。

如果你以后用到环境变量，也别把它当成一定存在的字符串。例如下面这个辅助函数会先检查，再返回结果：

```typescript
function requiredEnv(name: string): string {
  const value = process.env[name]
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

// 配好 API_URL 后，再调用 new URL(requiredEnv("API_URL"))。
```

`process.env[name]` 的类型包含 `undefined`，因为使用者可能忘了配置。上面的 `if` 既处理实际错误，也让 TypeScript 知道后面拿到的是字符串。

## 7. 跑通之后，再按需要增加检查

不用第一天就背下所有配置。等你开始访问数组、写可选字段或拆分模块时，可以逐项试试：

- `noUncheckedIndexedAccess`：访问可能不存在的数组元素或索引项时，把 `undefined` 也算进去。
- `exactOptionalPropertyTypes`：区分“没有这个可选属性”和“明确把属性写成 `undefined`”。
- `verbatimModuleSyntax`：要求你更明确地分开类型导入和值导入，减少导入被悄悄改写的困惑。
- `declaration`：生成 `.d.ts` 类型声明，发布供别人使用的库时尤其有用。
- `skipLibCheck`：控制是否跳过声明文件的类型检查，不是关闭你自己 `.ts` 业务代码的检查。本练习无需为了省事打开它。

`strict` 已经包含 `useUnknownInCatchVariables` 这项检查。后面学错误处理时，再看它怎样影响 `catch` 里的变量，会比现在死记配置更有用。

有些较新的 Node 版本和第三方工具可以直接处理一部分 TypeScript 文件。那是另一条运行路径，支持的语法还取决于工具版本。无论用哪种工具，保留 `tsc --noEmit` 都能让“运行过”和“检查过类型”不至于混为一谈。

## 8. 卡住时，按现象找原因

| 你看到的现象 | 先检查哪里 |
| --- | --- |
| 找不到 `node` 或 `npm` | 安装目录、PATH、是否重新打开终端 |
| 本地和别人的检查结果不一样 | `npx tsc --version`、锁文件、编辑器是否使用工作区 TypeScript |
| 提示找不到 `process` | `@types/node` 是否安装，`types` 是否包含 `node` |
| `npm start` 找不到文件 | 之前的 `npm run build` 是否成功，是否生成了 `dist/index.js` |
| 修改代码后输出还是原来的内容 | 是否运行了旧的 `dist` 文件，有没有重新构建 |
| 拆分文件后出现模块导入错误 | `type`、`NodeNext` 和导入路径扩展名是否一致 |

最后做个小练习：让程序接收一个用户对象，打印 `Ada 的编号是 u-1`，再把编号改成数字，看看错误落在哪一行。能解释这个错误，比记住一长串配置更说明你理解了第一步。

需要查某个选项时再翻：[TypeScript 安装说明](https://www.typescriptlang.org/download/)、[TSConfig 配置参考](https://www.typescriptlang.org/tsconfig/)、[Node 模块规则](https://www.typescriptlang.org/docs/handbook/modules/theory.html)。
