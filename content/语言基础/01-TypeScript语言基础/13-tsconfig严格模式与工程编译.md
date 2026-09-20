# tsconfig、严格模式、项目引用与工程编译

`tsconfig.json` 看起来只是几个开关，但它会影响哪些文件被检查、哪些 API 被认为存在，以及代码怎样输出。不要急着复制一份很长的配置。先确定代码在哪里运行，再逐项理解严格检查和模块选项，就能解释为什么需要这些设置。

读配置时按四件事分类：检查哪些文件，提供哪些类型定义，怎样理解模块，最后输出什么。一个开关让报错消失，未必就是正确修复；还要确认它符合项目实际运行的环境。

## 升级时先看实际配置，不要先关检查

配置文件回答的是“编译器应该怎样理解这个项目”。升级后突然报错，可能是默认值改变，也可能是新检查找到了原来漏掉的问题；两种情况需要不同处理。先运行 `npx tsc --version` 确认用的是项目版本，再用 `npx tsc --showConfig` 查看继承完成后的配置。

[TypeScript 6.0 发布说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)记录了严格检查、全局类型加载和 `rootDir` 默认行为的变化。一个实用做法是显式指定 `strict`、`types`、`rootDir`，然后逐个解释报错。服务端需要 Node 类型就安装并声明它们；浏览器项目则别为了消除报错把 Node 全局一并带进来。

检查通过后还要运行生成的 JavaScript。类型检查回答“这段代码是否符合已知类型”，运行测试回答“它是否真的做了预期的事”，两者相互补充。这里保留现有练习使用的 5.9.3 基线，没有顺便升级网站自身的编译器或依赖。

## 1. 文件选择

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["dist", "coverage"],
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  }
}
```

`exclude` 不是安全边界：被已包含文件导入的模块仍会进入程序。用 `npx tsc --explainFiles` 检查文件为何被纳入。

## 2. 严格模式族

`strict` 开启一组更强检查，未来版本可能向该组增加选项，所以升级后出现新诊断是正常的。重要成员包括：

- `strictNullChecks`：把 `null`/`undefined` 纳入类型。
- `noImplicitAny`：不允许无法推断而产生隐式 `any`。
- `strictFunctionTypes`：更严格检查函数参数兼容性。
- `strictPropertyInitialization`：要求类字段在构造完成前初始化。
- `useUnknownInCatchVariables`：`catch` 变量按 `unknown` 处理。

## 3. 推荐的额外防错选项

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

这些选项可能增加局部代码量，但能让数组越界、可选属性语义、覆写和分支遗漏显式出现。

## 4. `target`、`module`、`moduleResolution`、`lib`

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2024"],
    "types": ["node"]
  }
}
```

- Node 服务不应无意包含 `DOM`，否则 `window` 会在检查阶段虚假可用。
- 浏览器应用通常包含 `DOM`，但不应无意包含 Node 全局。
- `types` 控制自动注入的 `@types` 包；它不限制显式导入的声明。
- 不要仅凭“TypeScript 7”这个主版本号猜测默认值。先记录 `npx tsc --version` 的实际结果，再阅读对应发布说明；本章显式写出关键配置，避免依赖版本默认值。

## 5. 检查与生成分离

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "tsc -p tsconfig.build.json"
  }
}
```

应用可能由 Vite/SWC 转换源码，而 `tsc --noEmit` 独立保证类型检查。库通常还需要声明 emit。

## 6. 配置继承

`tsconfig.base.json`：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true
  }
}
```

包配置：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

数组型配置通常会替换而非自动合并父配置，应使用 `--showConfig` 查看最终结果。

## 7. 项目引用

```json
{
  "files": [],
  "references": [
    { "path": "./packages/domain" },
    { "path": "./packages/api" }
  ]
}
```

```bash
npx tsc --build
npx tsc --build --clean
```

项目引用为大型仓库建立显式依赖和增量构建边界。被引用项目通常启用 `composite`，公共边界通过声明文件传递。

## 8. 增量构建与缓存

`incremental` 产生 `.tsbuildinfo` 缓存检查图。缓存不是产物真相，CI 缓存键至少包含 TypeScript 版本、配置和锁文件；出现难解差异时清理后全量构建。

## 9. `skipLibCheck` 的取舍

它跳过声明文件内部检查，可加快构建并缓解依赖声明冲突，但不会让本项目使用声明时完全无检查。库作者和类型基础设施应优先保持关闭；大型应用若开启，需要跟踪上游问题，避免长期掩盖重复类型版本。

## 10. 配置诊断命令

```bash
npx tsc --showConfig
npx tsc --explainFiles
npx tsc --traceResolution
npx tsc --extendedDiagnostics
```

参考：[TSConfig Reference](https://www.typescriptlang.org/tsconfig/)、[strict](https://www.typescriptlang.org/tsconfig/strict.html)、[Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)、[TypeScript 6.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)。

## 11. Freshness metadata

- `last_verified`: `2026-08-26`
- `version_scope`: `TypeScript 7.0 / 6.0 migration`
- `source_type`: `TypeScript 官方文档`
- `stability`: `fast-moving`

