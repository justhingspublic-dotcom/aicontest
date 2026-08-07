# Design QA｜2026 神盾盃公開前台

## 比較基準

- Source visual truth：`/Users/jonathanyu/Desktop/Travail/國防AI競賽/WEB DEMO/img/official-poster.png`
- Homepage desktop：`/Users/jonathanyu/Desktop/Travail/國防AI競賽/WEB DEMO/qa/current-refinement/home-desktop.png`
- Homepage mobile：`/Users/jonathanyu/Desktop/Travail/國防AI競賽/WEB DEMO/qa/current-refinement/home-mobile.png`
- Registration desktop：`/Users/jonathanyu/Desktop/Travail/國防AI競賽/WEB DEMO/qa/current-refinement/register-entry-desktop.png`
- Registration mobile：`/Users/jonathanyu/Desktop/Travail/國防AI競賽/WEB DEMO/qa/current-refinement/register-entry-mobile.png`
- Participant desktop：`/Users/jonathanyu/Desktop/Travail/國防AI競賽/WEB DEMO/qa/current-refinement/portal-desktop.png`
- Participant mobile：`/Users/jonathanyu/Desktop/Travail/國防AI競賽/WEB DEMO/qa/current-refinement/portal-mobile.png`
- Full comparison：`/Users/jonathanyu/Desktop/Travail/國防AI競賽/WEB DEMO/qa/current-refinement/visual-comparison.png`

## 尺寸與狀態

- Source：1080 × 1527 px，正式宣傳海報。
- Desktop implementation：1265 × 712 px；瀏覽器 viewport 約 1280 × 720，device scale factor 1。
- Mobile implementation：375 × 812 px；測試 viewport 390 × 844，畫面包含瀏覽器保留區。
- State：公開首頁、免帳號密碼報名入口與尚未建立團隊資料的參賽專區初始狀態。
- Normalization：完整比較將海報與桌機首頁等比例縮放至 764 px 高並排；輸出為 1897 × 764 px。Hero、主標、日期、色彩與正式海報嵌入皆可在同一張圖中辨識，因此不另做局部裁切。

## Findings

- Fonts and typography：passed。中文字級層次、粗體主標與等寬英文標籤延續海報語言；手機版以不拆開「下一步」為優先，避免主標出現不自然斷行。
- Spacing and layout rhythm：passed。首頁維持左側活動主張、右側正式海報的桌機構圖；手機版改為單欄，日期、地點與主要 CTA 仍維持清楚順序。
- Colors and visual tokens：passed。深海軍藍、訊號青綠、任務琥珀與淺灰藍均取自既有主視覺；深色區塊的次要文字已提高對比。
- Image quality and asset fidelity：passed。首頁直接使用正式宣傳海報原始圖，未以低解析替代；尚未提供正式 LOGO，因此目前保留一致的 AI 字樣識別占位，不假造主辦 LOGO。
- Copy and content：passed。主標、活動名稱、日期、地點、主辦單位、四大項目與總獎金延續正式素材；未知日期、聯絡資訊及官方連結維持「待公告」，沒有自行補造資料。
- CTA hierarchy：passed。主要 CTA 統一為「開始線上報名／開始報名」，次要 CTA 為賽事辦法或查詢修改；按鈕層級、陰影與邊界已加強。
- Passwordless registration：passed。已移除假登入與密碼欄位；參賽者由報名資訊頁直接建立團隊資料，並以聯絡信箱作為後續通知依據。正式身分確認機制保留為系統串接項目。
- Participant portal：passed。參賽專區沿用同一套網格、色彩與卡片語言；測試用重設按鈕已移除，公開文案不再把頁面稱為「原型」。上傳區仍清楚標示展示模式，避免誤認檔案已送至伺服器。
- Responsive and accessibility：passed。390 × 844 viewport 未發現水平溢位；手機選單可開關並更新可存取名稱，Esc 可關閉；主要表單控制有標籤與文字狀態。
- Interaction：passed。「開始報名」實測可由 `/html/register.html` 導向 `/html/portal.html#profile`；頁面不要求登入。
- Console：passed。首頁、報名入口與參賽專區主要檢查未發現 console error 或 warning。

## Comparison history

1. 初步檢查發現手機首頁主標的「下一步」可能拆字、深色區次要文字對比偏弱、CTA 層級不夠明確，屬 P2 視覺問題。
2. 流程檢查發現報名頁仍以假登入表單表達，但需求並無登入機制；已改為免帳號密碼的直接報名入口，並同步移除公開頁面的測試／原型措辭與參賽專區重設按鈕。
3. 修正後重新擷取桌機與手機畫面，完成正式海報對照、CTA 導向、手機選單、橫向溢位及 console 檢查，未發現剩餘 P0／P1／P2 問題。

## Follow-up polish

- P3：正式 LOGO 尚未提供，目前保留 AI 字樣識別占位；收到向量或高解析 LOGO 後再置換，不影響其他頁面設計定稿。
- P3：正式報名日期、聯絡窗口、官方網址、QR code、下載文件與宣傳影片仍待主辦單位提供。
- P3：目前為可操作的靜態前台；資料庫、檔案儲存、Email 通知、身份驗證與管理後台尚未串接。

final result: passed
