# 简介

一个超简洁的Electron应用

其灵感来源于@seal的`不再咬手手`。

![TODO](https://edeity.oss-cn-shenzhen.aliyuncs.com/public/todo.jpg)

## 下载安装

- 不定期发布

- [百度网盘](https://pan.baidu.com/s/1_ATx2kpTuqLoDP9BSHNNrg)：提取码: `i43x`
  - 若链接失效，请通知作者

## 调试 或 构建

```shell
# 请勿使用npm

yarn # install deps 安装依赖

# 调试
yarn start # web页面调试
electron . # electron页面调试

# 构建
yarn clear # 清除旧代码
yarn build # 生成chrome插件
yarn dist # 生成electron应用
# ===
yarn build-app # yarn clear & yarn build & yarn dist

# 发布页面
yarn deploy # 发布github pages
```

## 功能

- [ ] UIL操作
  - [x] 基本操作
    - [x] 输入、显示、拖拽
  - [ ] 快捷键
    - [x] `Ctrl + Shift + D`：显示隐藏
    - [ ] `CTRL + Z`：事务级别的**Redo**、**Undo**等
- [ ] 分类
  - [x] 预置、未完成/已完成、自定义
  - [ ] 日期或时间分类
- [ ] 存储
  - [x] 持久化、导入导出
  - [ ] 后端同步
- [ ] 系统
  - [x] chrome插件、系统提醒、系统托盘、图标
- [x] 显示
  - [x] 主题色：**黑色** | **白色** 主题
  - [x] 自定义语法
    - 时间：` >${number}${unit} ${hour}:${minute}:${seconds}`。eg：`>1h`（一个小时后）、`> 18:00`（当地时间18：00）、`>1d 8:20`（明天早上八点20分）
        - 标签：`[A, B]`或`[A][B]`
      - [x] 行级Markdown语法
    - 超链接：`[baidu](https://www.baidu.com)`、强调：`*xxx*`、`**xxx**`、`***xxx***`、修饰：\``code`\`、`~~delete~~`
  - [ ] 行级富文本编辑器
- [ ] 发布
    - [ ] 自动更新
    - [ ] 持续集成
    - [ ] Github Release

## 其他

- 加速下载`Electron`（`.zshrc`或`.bashrc`配置文件）

```bash
export ELECTRON_MIRROR="https://npm.taobao.org/mirrors/electron/"
```

- 更新所有旧的依赖项

```bash
yarn upgrade-interactive [--latest]
```
