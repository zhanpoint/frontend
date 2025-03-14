注意：该项目全栈项目的前端部分，后端部分使用的是django4.2版本框架

# 该前端React项目的主题是：梦境



## 我的前端React项目技术栈规则列表如下：

| id   | 规则详情                                                     |
| ---- | :----------------------------------------------------------- |
| 1    | 该React项目使用的是19版本，通过vite构建，所有组件语言均为JSX编写而非TSX，是基于JavaScript的 |
| 2    | 路由组件必须使用第三方库react-router-dom                     |
| 3    | UI组件必须使用第三方组件库Shadcn UI                          |
| 4    | 状态管理时必须使用 React 内置的 useState/useReducer          |
| 5    | 网络请求时必须使用Axios前端请求库                            |
| 6    | 表单处理时必须使用Formik表单库                               |
|      |                                                              |
|      |                                                              |
|      |                                                              |



## 前端项目页面的整体展示风格规则：

### 色彩方案

- 主色调：深蓝色 (#1E3A8A) - 代表夜空和深度思考

- 辅助色：

  - 淡紫色 (#9F7AEA) - 代表梦幻和想象

  - 靛蓝色 (#4F46E5) - 代表深度睡眠

  - 星光金 (#F59E0B) - 代表灵感闪现

- 中性色：

  - 深灰 (#1F2937) - 用于文本

  - 淡灰 (#F3F4F6) - 用于背景

  - 白色 (#FFFFFF) - 用于卡片和内容区

### 设计元素

- 形状：

- 阴影：轻柔渐变阴影

- 插图：梦境相关的抽象和星空元素

- 动效：流畅的过渡和微妙的悬浮动画

- 字体：

- 标题：无衬线圆润字体（如Poppins）

- 正文：易读现代字体（如Inter）



## 代码生成规则

- 要求模块化组件结构，每个组件职责清晰，逻辑分离
- 所有样式都移至单独的 CSS 文件中，不再使用内联样式
- 简洁清晰的代码注释，代码文档化
- 组件结构清晰简洁，复用性高，易于维护管理
- 配置与代码分离

## 前端目录结构（基于React 19 + Vite + JSX）

```
frontend/
├── .vscode/             # VS Code配置
├── node_modules/        # 依赖包
├── public/              # 静态资源
│   ├── favicon.ico
│   ├── robots.txt
│   └── assets/
│       └── images/      # 图片资源
├── src/                 # 源代码
│   ├── assets/          # 前端资源
│   │   ├── icons/       # 图标
│   │   ├── images/      # 图片
│   │   └── styles/      # 全局样式
│   ├── components/      # 通用组件
│   │   ├── common/      # 基础公共组件
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── ...
│   │   ├── layout/      # 布局组件
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   ├── dream/       # 梦境相关组件
│   │   │   ├── DreamCard.jsx
│   │   │   ├── DreamForm.jsx
│   │   │   ├── DreamList.jsx
│   │   │   └── DreamTags.jsx
│   │   ├── user/        # 用户相关组件
│   │   │   ├── ProfileCard.jsx
│   │   │   ├── UserAvatar.jsx
│   │   │   └── ...
│   │   └── knowledge/   # 知识板块组件
│   │       ├── KnowledgeCard.jsx
│   │       ├── ArticleList.jsx
│   │       └── ...
│   ├── hooks/           # 自定义钩子
│   │   ├── useDreamForm.js
│   │   ├── useAuth.js
│   │   └── ...
│   ├── pages/           # 页面组件
│   │   ├── Home.jsx     # 首页
│   │   ├── Login.jsx    # 登录页
│   │   ├── Register.jsx # 注册页
│   │   ├── Profile/     # 个人中心相关页面
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── MyDreams.jsx
│   │   │   ├── MyArticles.jsx
│   │   │   └── Settings.jsx
│   │   ├── Dream/       # 梦境相关页面
│   │   │   ├── DreamCreate.jsx
│   │   │   ├── DreamDetail.jsx
│   │   │   ├── DreamEdit.jsx
│   │   │   └── DreamsList.jsx
│   │   ├── Community/   # 社区相关页面
│   │   │   ├── CommunityHome.jsx
│   │   │   ├── DreamWall.jsx
│   │   │   └── TopContributors.jsx
│   │   └── Knowledge/   # 知识中心页面
│   │       ├── KnowledgeHome.jsx
│   │       ├── DreamSymbols.jsx
│   │       ├── DreamScience.jsx
│   │       └── DreamTechniques.jsx
│   ├── services/        # API服务
│   │   ├── api.js       # Axios实例和拦截器
│   │   ├── authService.js
│   │   ├── dreamService.js
│   │   ├── userService.js
│   │   └── ...
│   ├── utils/           # 工具函数
│   │   ├── dateUtils.js
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── ...
│   ├── context/         # React Context
│   │   ├── AuthContext.js
│   │   ├── ThemeContext.js
│   │   └── ...
│   ├── lib/             # Shadcn UI组件和配置
│   │   ├── utils.js
│   │   └── ...
│   ├── App.jsx          # 应用入口组件
│   ├── main.jsx         # 应用渲染入口
│   └── routes.jsx       # React Router路由配置
├── .gitignore           # Git忽略文件
├── index.html           # HTML模板
├── package.json         # 项目依赖配置
├── vite.config.js       # Vite配置
├── jsconfig.json        # JavaScript配置
└── README.md            # 项目说明
```

