# 3jsColab

這是從 `three-test` 獨立整理出來的可分享外觀核心版本，保留完整參數化櫃型、材質、把手、檯面和基礎布局邏輯。

## 保留內容

- 櫃身、門板、抽屜、固隔、活隔、結構板材、電器占位和調整腳等元件。
- `three-test` 目前櫃型目錄中的全部地櫃、高櫃、牆櫃、填縫櫃、側封側落和空間占位型號。
- X排從右向左、Y排從後向前的基礎逆時針布局。
- Three.js場景、燈光、陰影、OrbitControls。
- 全部門板與櫃體 JPG材質。
- 六大把手類別、完整把手選項、預覽圖片和參數化把手實體。
- 樂天石 PM832檯面、突出量、厚度與後擋水。
- 櫃型、X/Y數量、寬高深、離地高度、門片數量、層板數量、顏色和把手的簡單調整。


## 執行

```bash
npm install
npm run dev
```

然後開啟 [http://localhost:3000](http://localhost:3000)。

## 結構

```text
app/                         Next.js頁面和樣式
components/BasicKitchenDemo  外觀核心參數調整介面
components/KitchenViewer     Three.js顯示與各種元件幾何
lib/generators/              完整櫃身、門板、抽屜、隔板、檯面等元件
lib/catalog/                 完整櫃型與檯面材質目錄
lib/layout/                  基礎逆時針布局
lib/config/                  共用尺寸標準
```
