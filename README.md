# 3jsColab

这是从 `three-test` 独立整理出来的可分享外观核心版本，保留完整参数化柜型、材质、把手、台面和基础布局逻辑。

## 保留内容

- 柜身、门板、抽屉、固隔、活隔、结构板材、电器占位和调整脚等原件。
- `three-test` 当前柜型目录中的全部地柜、高柜、墙柜、填缝柜、侧封侧落和空间占位型号。
- X排从右向左、Y排从后向前的基础逆时针布局。
- Three.js场景、灯光、阴影、OrbitControls。
- 全部门板与柜体 JPG材质。
- 六大把手类别、完整把手选项、预览图片和参数化把手实体。
- 乐天石 PM832台面、突出量、厚度与后挡水。
- 柜型、X/Y数量、宽高深、离地高度、门片数量、层板数量、颜色和把手的简单调整。

## 未包含内容

- OpenAI、Gemini及其他AI Provider。
- 本地文字解析、AI布局解析、对话与Agent工具。
- AutoCAD JSON输出和生产资料。
- 复杂房间、门窗及完整销售配置界面。
- `.env.local`、API Key、原项目Git历史和`node_modules`。

## 运行

```bash
npm install
npm run dev
```

然后打开 [http://localhost:3000](http://localhost:3000)。

## 结构

```text
app/                         Next.js页面和样式
components/BasicKitchenDemo  外观核心参数调整界面
components/KitchenViewer     Three.js显示与各种原件几何
lib/generators/              完整柜身、门板、抽屉、隔板、台面等原件
lib/catalog/                 完整柜型与台面材质目录
lib/layout/                  基础逆时针布局
lib/config/                  共用尺寸标准
```
