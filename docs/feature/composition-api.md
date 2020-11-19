# Composition Api

## 动机
> 为什么Vue3要推出composition-api，它能带来什么好处？

### 更好的逻辑复用和代码组织
vue本身更适合构建中小型应用，当在业务逻辑复杂，应用程序较为庞大的项目中，会存在由于多人维护，模板中的代码逻辑复杂且分散，代码可读性极差等情况。当然，这也是由于Vue本身变成模型的限制。主要问题可分为以下两类：

- 随着功能需求的迭代，某些组件的代码会变得越来越难以理解和维护，同时基于选项组织代码的方式，会让相关联的逻辑变得分散，需要一种能够逻辑内聚的方式去解决现在这种问题。
- vue2中缺少组件之间的逻辑重用的机制（mixin本身存在缺陷）
### 更好的类型推导

## 概览

![image.png](https://cdn.nlark.com/yuque/0/2020/png/2589904/1605786171351-c596eb2d-da27-4858-a0fd-a63c08c0dfd0.png#align=left&display=inline&height=792&margin=%5Bobject%20Object%5D&name=image.png&originHeight=792&originWidth=612&size=129706&status=done&style=none&width=612)

## Api介绍

### setup
> 单文件组件的脚本入口，利用composition api和内置生命周期钩子聚合逻辑

setup是新的组件选项，通常利用composition api和生命周期钩子将页面逻辑聚合在一个函数中，当setup函数中页面逻辑足够复杂时，以逻辑关注点将其拆分成更小的单元进行组合。
#### setup调用时机？
setup调用时机在`beforeCreated`之前，通常在组件初始化props之后，所以此时没有上下文实例`this`
#### setup参数解释
setup中的第一个参数是`prop`，第二个参数是`context`，由于setup中this不可用，所以许多内置的属性或者方法通过挂载到`context`上下文中，其属性值有attrs、slots、emit、parent、root，用法与vue2中api保持一致。
```javascript
const MyComponent = {
  props: {
    name: String
  },

  setup(props, context) {
    console.log(props.name);
    // context.attrs
    // context.slots
    // context.emit
    // context.parent
    // context.root
  }
}
```
其中`prop`是响应式的，因为你可以直接在watchEffect或者watch中对其进行监听
```javascript
export default {
  props: {
    name: String,
  },
  setup({ name }) {
    // 由于解构了props，失去响应式功能，watch api并不能正常回调
    watchEffect(() => {
      console.log(`name is: ` + name)
    })
  },
}
```
#### 其他生命周期怎么使用？
相比较vue2中的生命周期选项，vue3中都要一套与之对应的生命周期钩子，具体映射可参加下方。
![image.png](https://cdn.nlark.com/yuque/0/2020/png/2589904/1605788890935-e43d56c6-18aa-4316-8c73-b6ddc38fb7ed.png#align=left&display=inline&height=310&margin=%5Bobject%20Object%5D&name=image.png&originHeight=620&originWidth=1080&size=124165&status=done&style=none&width=540)
使用示例
```javascript
<script lang="ts">
import position from './position'
import DemoBox from './components/demo-box.vue'
import { ToRefs, onMounted, onUnmounted } from 'vue'
export default {
  setup () {
    const { x, y }: ToRefs<{ x: number; y: number; }> = position()

    onMounted(() => {
      console.log('当前组件已经挂载')
    })

    onUnmounted(() => {
      console.log('当前组件已经卸载')
    })

    return {
      x,
      y
    }
  }
}
</script>
```
#### 渲染函数/JSX中使用
```javascript
import { h, ref, reactive } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const object = reactive({ foo: 'bar' })

    return () => h('div', [count.value, object.foo])
  },
}
```
### 响应式系统API
#### reactive
> 主要用于将对象进行包裹，返回响应式的代理

其作用类似`Vue.observable()`，默认响应式转化是深层的，会将嵌套的子属性进行递归代理。基于`proxy`进行代理。
ps: 注意响应式代理与原始对象并不相等，一般不要操作原始对象
```javascript
<template>
  <div class="home">
    {{count.num}}
  </div>
</template>

<script>
import { reactive } from 'vue'
export default {
  setup () {
    const count = reactive({ num: 0 })
    count.num++

    return {
      count,
      ...count // 此时模板中直接使用num进行渲染时不是响应式的
    }
  }
}
</script>
```
#### ref
> 用于将基本数据类型进行响应式代理

##### 基础使用

- 传入基础类型时：其返回值是一个对象，具有单一属性value
- 传入引用类型时：内部会将引用类型参数用reactive api进行处理。当传入的引用类型为对象时，会自动进行解套。传入的为数组或者map等数据结构时，不会解套
- 作为DOM实例或者组件实例使用：需在模板上动态绑定ref props为setup函数中返回的ref属性
```javascript
<template>
  <div class="home" :ref="homeRef">
    {{count}}
  </div>
</template>

<script>
import { ref } from 'vue'
export default {
  setup () {
    const count = ref(0)
    
    // 对象会自动解套
    const objRef = ref({ num: 1 })
    console.log(objRef.num) // 1
    
    // 数组或者map不会自动解套
    const arrayRef = ref(['item1'])
    console.log(arrayRef[0].value) // item1

    const homeRef = ref(null)

    const add = () => {
      count.value++
    }

    return {
      count,
      add,
      homeRef
    }
  }
}
</script>

```
#### computed
> 会自动对依赖的响应式属性进行监听，当依赖项改变时，会自动重新计算更改后的值

##### 基础使用
```javascript
<script>
import { computed } from 'vue'
export default {
  setup () {
    const count = ref(0)

    const doubleCount = computed(() => count * 2)

    return {
      count,
      doubleCount
    }
  }
}
</script>
```
##### 手动更改计算状态
```javascript
export default {
  setup () {
    const count = ref(0)

    const doubleCount = computed({
      get: () => count * 2,
      set: (val) => {
        count.value = val
      }
    })

    return {
      count,
      doubleCount
    }
  }
}
```
#### readonly
> 返回响应式对象或者普通对象的代理，使其内部的属性均为只读，代理是深层的

```javascript
<script>
import { readonly } from 'vue'
export default {
  setup () {
    const readonlyCount = readonly({ num: 0 })

    const add = () => {
      readonlyCount.num++ // 会报错
    }

    return {
      readonlyCount,
      add
    }
  }
}
</script>
```
#### watchEffect
> 对函数中响应式属性进行依赖追踪，并在其内部值改变时重新运行该函数

```javascript
<script>
import { watchEffect } from 'vue'
export default {
  setup () {
    const count = ref(0)

    watchEffect(() => {
      console.log('执行副作用函数') // 该函数会在初始化时立即执行（同步执行）
      if (count > 0) {
        console.log('状态改变,执行副作用函数') // 在响应式属性改变时异步执行（异步，且通常在更新渲染后）
      }
    })

    return {
      count
    }
  }
}
</script>
```
#### watch
> 与vue2中的this.$watch无异，区别在于可同时对多个属性进行监听

watch api与vue2中的`this.$watch`相同，相比较于`watchEffect`，不同的是它的执行默认是懒执行的，只有在属性值改变时才会触发，同时还要显式的去依赖响应的属性值。而且回调中可以同时获取更改前后的值
```javascript
// 侦听一个 getter
const state = reactive({ count: 0 })
watch(
  () => state.count,
  (count, prevCount) => {
    /* ... */
  }
)

// 直接侦听一个 ref
const count = ref(0)
watch(count, (count, prevCount) => {
  /* ... */
})

// 侦听多个数据源
watch([fooRef, barRef], ([foo, bar], [prevFoo, prevBar]) => {
  /* ... */
})
```
### 依赖注入
> vue3中通过`provide`和`inject`来完成父组件到子组件的依赖注入

其中应该注意的是，provide提供的key只能为`Symbol`，所以在要inject的子组件中需要import一个相同的`Symbol`。同时inject可以传递第二个参数作为默认值
```javascript
import { provide, inject } from 'vue'
const ThemeSymbol = Symbol()
const Ancestor = {
  setup() {
    provide(ThemeSymbol, 'dark')
  },
}
const Descendent = {
  setup() {
    const theme = inject(ThemeSymbol, 'light') // 其中第二个参数为默认值
    return {
      theme,
    }
  }
}
```
### 其他响应式工具API
> 辅助响应式api的应用

响应式工具类的api总共有

- unRef
- toRef
- toRefs
- isRef
- isProxy
- isReactive
- isReadonly

篇幅原因，这里只挑选出重点的toRefs进行讲解
#### toRefs
> 把一个响应式对象转换成普通对象，该普通对象的每个 property 都是一个 ref ，和响应式对象 property 一一对应。

```javascript
<script>
import { reactive, toRefs } from 'vue'
export default {
  setup () {
    const count = reactive({ num: 0 })
    
    const refsCount = toRefs(count)
    
    // 由于被ref包裹过,所以在js中调用该变量时，均使用.value调用
    console.log(refsCount.num.value) // 0

    return {
      ...refsCount
    }
  }
}
</script>
```







