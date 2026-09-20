# JavaScript 基础：类型、函数、集合、DOM 与事件

页面上的数据变化，最终要由 JavaScript 响应事件并更新界面。先把值、函数、作用域和对象讲清，再操作 DOM，会更容易理解回调为什么拿到某个值，以及事件怎样传递。

JavaScript 是动态类型、基于原型、拥有词法作用域和一等函数的语言。浏览器把它与 DOM、事件、网络和存储 API 组合成前端运行环境。

## 1. 学习目标

- 理解原始类型、对象、相等和类型转换
- 掌握作用域、闭包、函数和 this
- 掌握数组/对象不可变更新
- 掌握 DOM 查询、事件传播和委托

## 2. 核心概念

### 1. 值、类型与相等

原始值包括 undefined、null、boolean、number、bigint、string、symbol；对象按引用比较。`===` 通常避免隐式转换，`Object.is` 对 NaN 和正负零语义不同。`null` 表示有意空值，`undefined` 常表示缺失。

**这里容易混淆的是：** `typeof null` 历史上返回 `"object"`；数组用 `Array.isArray` 检查。

### 2. 作用域、闭包与 this

`let/const` 是块级词法作用域；闭包让函数保留定义位置的变量。普通函数的 `this` 由调用方式决定，箭头函数捕获外层 this 且没有自己的 arguments。

**这里容易混淆的是：** 闭包可能延长对象生命期；事件监听和计时器应在组件销毁时清理。

### 3. 数组与对象

`map/filter/reduce/find/some/every` 表达集合变换；spread 只做浅拷贝，嵌套对象仍共享引用。`Map` 支持任意键，`Set` 表达唯一集合。

**这里容易混淆的是：** `sort()` 默认按字符串且原地修改；数字排序需比较器，保留原数组可用 `toSorted()`。

### 4. DOM 与事件

DOM 是浏览器里的节点树。事件传播通常要区分捕获、目标和冒泡阶段，但不是所有事件都会冒泡，要看事件的 `bubbles` 属性。比如 `focus` 不冒泡，做焦点委托时可以考虑 `focusin` 或捕获监听。事件委托把监听器放在稳定祖先，用 `closest` 找实际目标，适合动态列表。

`preventDefault()` 针对可取消事件的默认动作，不负责阻止传播；被动监听器也不能用它取消默认动作。`stopPropagation()` 处理传播，不等于取消浏览器默认动作。这两件事分开想，按钮点击和表单提交就更容易调试。参见 [事件的 bubbles 属性](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles)。

**这里容易混淆的是：** 阻止默认动作不等于阻止冒泡；过度 stopPropagation 会破坏组合。

## 3. 运行链路

```mermaid
flowchart TD
  A["Window"] --> B["Document"]
  B --> C["祖先元素 捕获"]
  C --> D["目标元素"]
  D --> E["祖先元素 冒泡"]
  E --> F["委托处理器"]
```

## 4. 最小示例

```javascript
const state = {
  orders: [
    { id: 1, status: 'PENDING' },
    { id: 2, status: 'PAID' },
  ],
}

const pending = state.orders
  .filter(order => order.status === 'PENDING')
  .map(order => ({ ...order, label: `订单 #${order.id}` }))

document.querySelector('#orders').addEventListener('click', event => {
  const button = event.target.closest('button[data-order-id]')
  if (!button) return
  const id = Number(button.dataset.orderId)
  if (!Number.isSafeInteger(id)) return
  console.log('open', id)
})
```

## 5. 练习与验证

1. 用闭包实现计数器并解释变量生命周期
2. 比较浅拷贝与结构化克隆
3. 用事件委托实现可增删列表

## 6. 常见误区

- 使用 var 造成循环闭包混淆
- 直接修改共享数组导致状态难追踪
- 对可能不存在的 DOM 节点直接调用方法

## 7. 掌握检查

把方法直接传成回调后，为什么 this 可能变化？怎样在运行前预测结果，再用控制台核对？

先不看答案，用本章示例解释一遍；再改变一个输入或配置，检查实际结果是否符合你的判断。

## 参考资料

- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [MDN DOM Introduction](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)
- [MDN Event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)
