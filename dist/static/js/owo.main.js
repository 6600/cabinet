// Mon Aug 26 2019 09:08:04 GMT+0800 (GMT+08:00)

/* 方法合集 */
var _owo = {
  /* 对象合并方法 */
  assign: function(a, b) {
    var newObj = {}
    for (var key in a){
      newObj[key] = a[key]
    }
    for (var key in b){
      newObj[key] = b[key]
    }
    return newObj
  },
  /* 运行页面初始化方法 */
  runCreated: function (pageFunction) {
    // console.log(pageFunction)
    // 确保created事件只被执行一次
    if (!pageFunction["_isCreated"]) {
      pageFunction["_isCreated"] = true
      if (pageFunction.created) {
        pageFunction.created.apply(_owo.assign(pageFunction, {
          data: pageFunction.data,
          activePage: window.owo.activePage
        }))
      }
    }
    // console.log(pageFunction)
    if (!pageFunction.show) return
    pageFunction.show.apply(_owo.assign(pageFunction, {
      data: pageFunction.data,
      activePage: window.owo.activePage
    }))
  }
}

// 判断是否为手机
_owo.isMobi = navigator.userAgent.toLowerCase().match(/(ipod|ipad|iphone|android|coolpad|mmp|smartphone|midp|wap|xoom|symbian|j2me|blackberry|wince)/i) != null

_owo.bindEvent = function (eventName, eventFor, tempDom, templateName) {
  // 处理事件 使用bind防止闭包
  tempDom["on" + eventName] = function(event) {
    // 复制eventFor防止污染
    let eventForCopy = this.eventFor
    // 判断页面是否有自己的方法
    var newPageFunction = window.owo.script[window.owo.activePage]
    // console.log(this.attributes)
    if (templateName && templateName !== owo.activePage) {
      // 如果模板注册到newPageFunction中，那么证明模板没有script那么直接使用eval执行
      if (newPageFunction.template) newPageFunction = newPageFunction.template[templateName]
    }
    // 待优化可以单独提出来
    // 取出参数
    var parameterArr = []
    var parameterList = eventForCopy.match(/[^\(\)]+(?=\))/g)
    
    if (parameterList && parameterList.length > 0) {
      // 参数列表
      parameterArr = parameterList[0].split(',')
      // 进一步处理参数
      
      for (var i = 0; i < parameterArr.length; i++) {
        var parameterValue = parameterArr[i].replace(/(^\s*)|(\s*$)/g, "")
        // console.log(parameterValue)
        // 判断参数是否为一个字符串
        
        if (parameterValue.charAt(0) === '"' && parameterValue.charAt(parameterValue.length - 1) === '"') {
          parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1)
        }
        if (parameterValue.charAt(0) === "'" && parameterValue.charAt(parameterValue.length - 1) === "'") {
          parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1)
        }
        // console.log(parameterArr[i])
      }
    }
    eventForCopy = this.eventFor.replace(/\(.*\)/, '')
    // console.log(newPageFunction, eventForCopy)
    // 如果有方法,则运行它
    if (newPageFunction && newPageFunction[eventForCopy]) {
      // 绑定window.owo对象
      newPageFunction.$event = event
      newPageFunction[eventForCopy].apply(newPageFunction, parameterArr)
    } else {
      // 如果没有此方法则交给浏览器引擎尝试运行
      eval(this.eventFor)
    }
  }.bind({
    eventFor
  })
}

/* owo事件处理 */
// 参数1: 当前正在处理的dom节点
// 参数2: 当前正在处理的模块名称
// 参数3: 当前正在处理的模块根dom
_owo.handleEvent = function (tempDom, templateName) {
  var activePage = window.owo.script[owo.activePage]
  
  if (tempDom.attributes) {
    for (let ind = 0; ind < tempDom.attributes.length; ind++) {
      var attribute = tempDom.attributes[ind]
      // 判断是否为owo的事件
      // ie不支持startsWith
      if (attribute.name[0] == ':') {
        var eventName = attribute.name.slice(1)
        var eventFor = attribute.textContent
        switch (eventName) {
          case 'show' : {
            // 初步先简单处理吧
            var temp = eventFor.replace(/ /g, '')
            // 取出条件
            var condition = temp.split("==")
            if (activePage.data[condition[0]] != condition[1]) {
              tempDom.style.display = 'none'
            }
            break
          }
          case 'tap': {
            // 根据手机和PC做不同处理
            if (_owo.isMobi) _owo.bindEvent('touchend', eventFor, tempDom, templateName)
            else _owo.bindEvent('click', eventFor, tempDom, templateName)
            break
          }
          default: {
            _owo.bindEvent(eventName, eventFor, tempDom, templateName)
          }
        }
      }
    }
  }
  
  // 判断是否有子节点需要处理
  if (tempDom.children) {
    // 递归处理所有子Dom结点
    for (var i = 0; i < tempDom.children.length; i++) {
      // 获取子节点实例
      var childrenDom = tempDom.children[i]

      // 每个子节点均要判断是否为模块
      if (childrenDom.attributes['template'] && childrenDom.attributes['template'].textContent) {
        // 如果即将遍历进入模块 设置即将进入的模块为当前模块
        // 获取模块的模块名
        _owo.handleEvent(childrenDom, childrenDom.attributes['template'].textContent)
      } else {
        _owo.handleEvent(childrenDom, templateName)
      }
    }
  } else {
    console.info('元素不存在子节点!')
    console.info(tempDom)
  }
}// 单页面-页面资源加载完毕事件
_owo.showPage = function() {
  var page = owo.entry
  owo.activePage = page
  // 查找入口
  var entryDom = document.querySelector('.ox[template="' + page + '"]')
  if (entryDom) {
    _owo.handlePage(window.owo.script[page], entryDom)
    _owo.handleEvent(entryDom, null)
  } else {
    console.error('找不到页面入口! 设置的入口为: ' + page)
  }
}

/*
 * 传递函数给whenReady()
 * 当文档解析完毕且为操作准备就绪时，函数作为document的方法调用
 */
_owo.ready = (function() {               //这个函数返回whenReady()函数
  var funcs = [];             //当获得事件时，要运行的函数
  
  //当文档就绪时,调用事件处理程序
  function handler(e) {
    // 确保事件处理程序只运行一次
    if(window.owo.state.isRrady) return
    window.owo.state.isRrady = true
    //如果发生onreadystatechange事件，但其状态不是complete的话,那么文档尚未准备好
    if(e.type === 'onreadystatechange' && document.readyState !== 'complete') {
      return
    }
    
    // 运行所有注册函数
    for(var i=0; i<funcs.length; i++) {
      funcs[i].call(document);
    }
    funcs = null;
  }
  //为接收到的任何事件注册处理程序
  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', handler, false)
    document.addEventListener('readystatechange', handler, false)            //IE9+
    window.addEventListener('load', handler, false)
  } else if(document.attachEvent) {
    document.attachEvent('onreadystatechange', handler)
    window.attachEvent('onload', handler)
  }
  //返回whenReady()函数
  return function whenReady (fn) {
    if (window.owo.state.isRrady) {
      fn.call(document)
    } else {
      funcs.push(fn)
    }
  }
})()

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)




/* 运行页面所属的方法 */
_owo.handlePage = function (newPageFunction, entryDom) {
  // console.log(entryDom)
  newPageFunction['$el'] = entryDom
  // 快速选择器
  newPageFunction['query'] = function (str) {
    return this.$el.querySelectorAll(str)
  }
  /* 判断页面是否有自己的方法 */
  if (!newPageFunction) return
  // console.log(newPageFunction)
  _owo.runCreated(newPageFunction)
  // debugger
  // 判断页面是否有下属模板,如果有运行所有模板的初始化方法
  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key]
    // 待修复,临时获取方式,这种方式获取到的dom不准确
    var childDom = entryDom.querySelectorAll('[template="' + key +'"]')[0]
    if (!childDom) {
      console.error('组件丢失！')
      continue
    }
    // 递归处理
    _owo.handlePage(templateScript, childDom)
  }
}
