# ART-NOTES 鈥?maid-atelier 绱犳潗鍒ゅ畾渚濇嵁涓庤垶鍙板竷灞€绗旇

> 瀹¤瀵硅薄锛堝彧璇伙級锛歚~/.dsh/profiles/<profile>/node_modules/@smalltailqwq/dsh-client-ui-skin-maid-atelier`
> 锛堜笂琛屼负**鐢ㄦ埛鏈満璺緞绀轰緥**锛歚~` 浠ｈ〃褰撳墠鐢ㄦ埛涓荤洰褰曪紝`<profile>` 浠ｈ〃鎵€鐢?profile 鍚嶏紝渚嬪 `desktop`銆傚璁℃椂璇ュ寘瀹為檯浣嶄簬鏈満 profile 鐨?`node_modules` 涓嬶紝姝ゅ涓嶈褰曞叿浣撶敤鎴峰悕涓庣洏绗︺€傦級
> 浜у嚭锛歚docs/assets.json`锛堟満鍣ㄥ彲璇绘槧灏勶級銆佹湰鏂囦欢锛堝垽瀹氫緷鎹?+ 甯冨眬寤鸿锛夈€乣docs/ATTRIBUTION.md`锛堢讲鍚嶉摼锛夈€?> 鏈换鍔′负**鍙瀹¤**锛氭湭鍚戣鍖呯洰褰曞啓鍏ャ€佺Щ鍔ㄣ€佸垹闄ゆ垨澶嶅埗浠讳綍鏂囦欢锛涘伐浣滃尯鍐呮湭浜х敓浠讳綍璇ュ寘绱犳潗鐨勫壇鏈紙宸茬敤 `Get-ChildItem -Recurse -Include *.webp,*.ico` 鏍稿疄涓虹┖锛夈€?
## 0. 鍒ゅ畾鏂规硶锛堜负浠€涔堣繖浜?hash 涓嶆槸鐚滅殑锛?
姣忎釜瑙掕壊閮藉仛浜?*鍙屼晶浜ゅ弶鏍搁獙**锛岀己涓€涓嶅彲锛?
1. **瀹㈡埛绔鑹叉槧灏勪晶**锛歚lib/client.js` 涓?`const MAID_ATELIER_* = skinAssetUrl("<64浣峢ex>.webp")` 鐨?*瀛楅潰鍊?*锛堝苟閫愬瓧绗︽瘮瀵?64 浣?hex锛夈€?2. **瀹夸富璺敱鐧藉悕鍗曚晶**锛歚lib/index.js:53-85` 鐨?`var manifest_default = [...]` 鏁扮粍锛?*31 鏉?*锛屽凡鏍稿疄 31 鏉′笖浜掍笉閲嶅锛夈€傝矾鐢卞鐞嗗櫒 `installSkinAssets` 鐢?`const allowed = new Set(files)` 鍋氱櫧鍚嶅崟锛屽彧鏈夊懡涓櫧鍚嶅崟涓旀枃浠跺悕鍖归厤 `^[a-f0-9]{64}\.(png|webp)$` 鎵嶈繑鍥?200锛坄lib/index.js:19`锛夈€傚洜姝も€滃湪 manifest 涓€濈瓑浠蜂簬鈥滃悓婧愯矾鐢辩湡鐨勫彲 200 鎻愪緵鈥濄€?3. **瑙掕壊璇箟渚?*锛歚lib/client.js:2515-2533 createCharacterStage()` 鐨?`dataset.maidCharacter` 璧嬪€奸摼 + 瑙掕壊 CSS 瑙勫垯锛岀‘璁よ hash 瀵瑰簲鈥滃乏/鍙?vision鈥濆摢涓€涓涔夛紝鑰屼笉鏄潬鏂囦欢澶у皬鎴栨枃浠舵帓鍒楅『搴忔帹鏂€?
浜ゅ弶鏍￠獙瀹炴祴缁撴灉锛?1 鏉＄櫧鍚嶅崟锛?/6 鍛戒腑锛夛細

| 瑙掕壊 | client.js 琛?| 璇ヨ瀛楅潰鍊煎懡涓?| manifest 鍛戒腑 | manifest 涓嬫爣 | manifest 琛?|
|---|---|---|---|---|---|
| maid-left | 38 | 鉁?| 鉁?| 4 | lib/index.js:58 |
| maid-right | 39 | 鉁?| 鉁?| 15 | lib/index.js:69 |
| palace-light | 36 | 鉁?| 鉁?| 11 | lib/index.js:65 |
| palace-dark | 37 | 鉁?| 鉁?| 19 | lib/index.js:73 |
| chibi | 18 | 鉁?| 鉁?| 8 | lib/index.js:62 |
| vision | 56 | 鉁?| 鉁?| 17 | lib/index.js:71 |

> 璇存槑锛氫换鍔′功缁欏嚭鐨?6 涓敋鐐瑰叏閮ㄥ鏍镐负**閫愬瓧绗︿竴鑷?*锛屾湭鍙戠幇鍋忕Щ銆傚悓鏃舵彁绀轰竴涓湡瀹為櫡闃憋細`manifest_default` 鎸?hash 瀛楀吀搴忔帓鍒楋紝**鎺掑垪椤哄簭涓庤鑹叉棤鍏?*锛涗笖鐧藉悕鍗曚腑鍚屾椂瀛樺湪 `2818e...`锛坢aid-left锛変笌 `7c5a5...`锛坢aid-right锛夌瓑鐩镐技鍓嶇紑锛屼换浣曟埅鏂?hash 姣斿閮藉彲鑳介敊閰嶃€?
## 1. 閫愰」鍒ゅ畾渚濇嵁锛堝紩鐢ㄥ師琛屼唬鐮佹枃鏈級

鍏ㄧ珯鏍峰紡琛ㄦ槸 `lib/client.js:78` 鐨勫崟涓帇缂╁瓧绗︿覆 `const css$1 = "..."`锛屼笅闈㈠紩鐢ㄧ殑 CSS 瑙勫垯鍧囧嚭鑷琛屻€?
### 1.1 maid-left 鈥?`2818e5359596b13c5d64f5b1c5d4a9e0c05be477824779af8af37a0e10016b07.webp`

- 澹版槑锛坄lib/client.js:38`锛夛細
  ```js
  const MAID_ATELIER_MAID_LEFT = skinAssetUrl("2818e5359596b13c5d64f5b1c5d4a9e0c05be477824779af8af37a0e10016b07.webp");
  ```
- 瑙掕壊璇箟锛坄lib/client.js:2520-2523`锛夛細
  ```js
  const left = document.createElement("img");
  left.dataset.maidCharacter = "left";
  left.alt = "";
  left.src = MAID_ATELIER_MAID_LEFT;
  ```
- 涓€鍙ヨ瘽鍒ゅ畾锛?*`left.src = MAID_ATELIER_MAID_LEFT` 鐩存帴鎶婅 hash 缁戝埌 `data-maid-character="left"` 鑺傜偣锛屾晠瀹冩槸宸︿晶涓荤珛缁樸€?*
- 甯冨眬浜嬪疄锛圕SS锛屽悓涓€琛岋級锛歚body[data-dsh-maid-atelier] [data-maid-character=left]{height:96%;bottom:0;left:clamp(8px,1.5%,24px)}`

### 1.2 maid-right 鈥?`7c5a5493e84418bc0435013c8605222718923872c15eb46fdd36158d201c0b1e.webp`

- 澹版槑锛坄lib/client.js:39`锛夛細
  ```js
  const MAID_ATELIER_MAID_RIGHT = skinAssetUrl("7c5a5493e84418bc0435013c8605222718923872c15eb46fdd36158d201c0b1e.webp");
  ```
- 瑙掕壊璇箟锛坄lib/client.js:2524-2527`锛夛細
  ```js
  const right = document.createElement("img");
  right.dataset.maidCharacter = "right";
  right.alt = "";
  right.src = MAID_ATELIER_MAID_RIGHT;
  ```
- 涓€鍙ヨ瘽鍒ゅ畾锛?*`right.src = MAID_ATELIER_MAID_RIGHT` 鎶婅 hash 缁戝埌 `data-maid-character="right"`锛屾晠瀹冩槸鍙充晶涓荤珛缁橈紙榛樿瑙嗚涓嬩笌 left 鎴愬鍑虹幇锛夈€?*
- 甯冨眬浜嬪疄锛圕SS锛夛細`body[data-dsh-maid-atelier] :is([data-maid-character=right],[data-maid-character=vision]){height:92%;bottom:0;right:clamp(8px,1.5%,24px)}`

### 1.3 vision 鈥?`98cf9484ee96018b1ddc6d61f30945ce973158002fe31a2be0790e44c6718515.webp`

- 澹版槑锛坄lib/client.js:56`锛屼綅浜?`//#region src/client/vision-art.generated.ts`锛夛細
  ```js
  const MAID_ATELIER_MAID_RIGHT_VISION = skinAssetUrl("98cf9484ee96018b1ddc6d61f30945ce973158002fe31a2be0790e44c6718515.webp");
  ```
- 瑙掕壊璇箟锛坄lib/client.js:2528-2531`锛夛細
  ```js
  const vision = document.createElement("img");
  vision.dataset.maidCharacter = "vision";
  vision.alt = "";
  vision.src = MAID_ATELIER_MAID_RIGHT_VISION;
  ```
- 涓€鍙ヨ瘽鍒ゅ畾锛?*`vision.src = MAID_ATELIER_MAID_RIGHT_VISION` 缁戝埌 `data-maid-character="vision"`锛屽畠鏄彸渚х珛缁樼殑 V4 Flash Vision 鍙樹綋锛岄粯璁?`opacity:0;visibility:hidden`锛堜粎 `flash-glasses=on` 妯″紡鎵嶆樉鐜帮級锛屼笉鏄涓変釜浜虹墿銆?*
- 鍏抽敭璇佹嵁锛欳SS `body[data-dsh-maid-atelier] [data-maid-character=vision]{opacity:0;visibility:hidden}`锛屼笖浠呭湪 `html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model=flash][data-dsh-whale-maid-flash-glasses=on] ... [data-maid-character=vision]{opacity:1;visibility:visible}` 鏃跺嚭鐜般€?- 灏哄鏃佽瘉锛歷ision 鍐呭湪姣斾緥 0.5262 涓?maid-right 鐨?0.5259 鍑犱箮鐩稿悓锛?394脳2649 vs 1077脳2048锛屽悓鏋勫浘鏇撮珮鍒嗚鲸鐜囷級锛屼笌鈥滃悓涓€鍙充晶浜虹墿鐨勫彉浣撯€濅竴鑷淬€?
### 1.4 chibi 鈥?`405917afdb68d725624bbf7e4f1619a35fc4004039b7d553c5528ca5f65308d3.webp`

- 澹版槑锛坄lib/client.js:18`锛屼綅浜?`//#region src/client/art.ts`锛屾敞閲婁负 *Generated sidebar and ornamental raster assets*锛夛細
  ```js
  const MAID_ATELIER_CHIBI = skinAssetUrl("405917afdb68d725624bbf7e4f1619a35fc4004039b7d553c5528ca5f65308d3.webp");
  ```
- 瑙掕壊璇箟锛坄lib/client.js:2654-2661`锛夛細
  ```js
  const mascot = document.createElement("img");
  mascot.dataset.skinChrome = "sidebar-mascot";
  ...
  mascot.src = MAID_ATELIER_CHIBI;
  ```
- 涓€鍙ヨ瘽鍒ゅ畾锛?*璇?hash 鏄晶杈规爮 `data-skin-chrome="sidebar-mascot"` 鍚夌ゥ鐗╋紙Q 鐗堬級鍥撅紝婧愮爜涓敮涓€浣跨敤鐐瑰嵆涓?mascot銆?*
- 甯冨眬浜嬪疄锛圕SS锛夛細`... [data-skin-chrome=sidebar-mascot]{left:52%;bottom:calc(var(--maid-sidebar-swag-height) + 94px);...width:var(--maid-sidebar-mascot-width);object-fit:contain;object-position:center bottom;...height:auto;max-height:38%;position:absolute;transform:translate(-50%)translateZ(0)}`
  鍏朵腑 `--maid-sidebar-mascot-width: min(320px, calc(var(--maid-sidebar-width) * 0.82))`銆乣--maid-sidebar-width: 280px`锛坄lib/client.js:2873`锛夛紱绐?rail 妯″紡 `[data-maid-sidebar-size=rail]` 涓?mascot 鐩存帴 `display:none`銆?
### 1.5 palace-light 鈥?`52e7dce6993e3f955c3fbb2875885e7ab60fb38ca89adb15d977c7a85d58c073.webp`

- 澹版槑锛坄lib/client.js:36`锛屼綅浜?`//#region src/client/background-art.generated.ts`锛夛細
  ```js
  const MAID_ATELIER_PALACE_LIGHT = skinAssetUrl("52e7dce6993e3f955c3fbb2875885e7ab60fb38ca89adb15d977c7a85d58c073.webp");
  ```
- 瑙掕壊璇箟锛坄lib/client.js:2863-2865`锛夛細
  ```js
  const syncBackdrop = () => {
      const next = `url(${body.hasAttribute("data-ds-dark-theme") ? MAID_ATELIER_PALACE_DARK : MAID_ATELIER_PALACE_LIGHT})`;
      if (body.style.getPropertyValue("--maid-palace-art") !== next) body.style.setProperty("--maid-palace-art", next);
  };
  ```
- 涓€鍙ヨ瘽鍒ゅ畾锛?*`body` 鏈甫 `data-ds-dark-theme` 鏃?`--maid-palace-art` 鍙?`MAID_ATELIER_PALACE_LIGHT`锛屾晠瀹冩槸浜壊涓婚鐨勫娈胯儗鏅€?*
- 甯冨眬浜嬪疄锛圕SS锛夛細`body[data-dsh-maid-atelier] [data-skin-chrome=character-stage]{z-index:0;pointer-events:none;contain:strict;background:var(--maid-palace-art) center bottom / cover no-repeat;position:absolute;inset:0;overflow:hidden}`

### 1.6 palace-dark 鈥?`ae6917bb1aafa71e6a10cfcaa1289f13e265aa7f32d3fb7c1988004bf50f8983.webp`

- 澹版槑锛坄lib/client.js:37`锛夛細
  ```js
  const MAID_ATELIER_PALACE_DARK = skinAssetUrl("ae6917bb1aafa71e6a10cfcaa1289f13e265aa7f32d3fb7c1988004bf50f8983.webp");
  ```
- 瑙掕壊璇箟锛氬悓 1.5 鐨?`syncBackdrop()`锛宍body.hasAttribute("data-ds-dark-theme")` 涓虹湡鏃跺彇 `MAID_ATELIER_PALACE_DARK`銆?- 涓€鍙ヨ瘽鍒ゅ畾锛?*鏆楄壊涓婚锛坄data-ds-dark-theme`锛夊垎鏀笅 `--maid-palace-art` 鍙栬 hash锛屾晠瀹冩槸鏆楄壊涓婚瀹鑳屾櫙锛涗笌浜壊鐗堝悓灏哄锛?586脳992锛夛紝鏄悓涓€鏋勫浘鐨勪袱濂楅厤鑹层€?*
- 鏆楄壊涓婚涓嬬珛缁樺彟鍔犳护闀滐細`body[data-dsh-maid-atelier][data-ds-dark-theme] [data-maid-character]{filter:brightness(.84)saturate(.92)drop-shadow(0 22px 28px #0000004d)}`

## 2. 鍘熷鍍忕礌灏哄锛圵ebP 澶撮儴瑙ｆ瀽锛屾湭瑙ｇ爜鏁村浘锛?
瑙ｆ瀽鏂瑰紡锛氬彧璇诲墠 64 瀛楄妭锛屾寜 RIFF/WEBP 瀹瑰櫒閬嶅巻绗竴涓浘鍍?chunk鈥斺€?`VP8 `锛坙ossy锛夛細璺宠繃 3 瀛楄妭 frame tag 鍚庢牎楠岃捣濮嬬爜 `9d 01 2a`锛屽啀璇?2+2 瀛楄妭 14-bit 瀹介珮锛?`VP8L`锛坙ossless锛夛細璇?1 瀛楄妭 signature 鍚庣殑 32-bit 浣嶅煙锛宍w=(b&0x3fff)+1`銆乣h=((b>>14)&0x3fff)+1`锛?`VP8X`锛坋xtended锛夛細璇荤 1 涓瓧鑺?flags + 璺宠繃 3 瀛楄妭 reserved 鍚庤 24-bit `canvas width-1`/`height-1`銆?鍏ㄧ▼鏈皟鐢ㄤ换浣曞浘鍍忓簱銆佹湭鐢?.NET 瑙ｇ爜銆佹湭娓叉煋澶у浘銆?
| 瑙掕壊 | 灏哄 (w脳h) | 鍐呭湪姣斾緥 w/h | WebP chunk | 瀛楄妭鏁?| 涓庢簮鐮佹敞閲婄殑浜ゅ弶楠岃瘉 |
|---|---|---|---|---|---|
| maid-left | 1122 脳 2019 | 0.5557 | VP8L | 1 034 470 | 婧愮爜娉ㄩ噴绉?left 鍗?0.556 瀹藉害姣?鉁?|
| maid-right | 1077 脳 2048 | 0.5259 | VP8L | 1 209 838 | 婧愮爜娉ㄩ噴绉?right 鍗?0.526 瀹藉害姣?鉁?|
| vision | 1394 脳 2649 | 0.5262 | VP8L | 1 863 474 | 涓?maid-right 鍚屾瘮渚嬶紝浣愯瘉鈥滃悓涓€浜虹墿鍙樹綋鈥?|
| palace-light | 1586 脳 992 | 1.5988 | VP8 (lossy) | 279 480 | 鈮?6:10 妯悜鑳屾櫙 |
| palace-dark | 1586 脳 992 | 1.5988 | VP8 (lossy) | 270 544 | 涓庝寒鑹茬増鍚屽昂瀵?|
| chibi | 620 脳 553 | 1.1212 | VP8X锛宖lags `0x10`锛坅lpha 浣嶅凡缃級 | 91 476 | 妯悜 Q 鐗堬紝瀹瑰櫒澹版槑甯?alpha |

鍏」灏哄**鍏ㄩ儴鍙潬璇诲嚭**锛屾晠 `docs/assets.json` 涓棤 `null`銆?
寮鸿瘉鎹細`lib/client.js:2296-2299` 鐨勬敞閲婄嫭绔嬬粰鍑轰袱涓瘮渚嬧€斺€斺€淏oth maids are sized against the conversation column's HEIGHT 鈥?96% and 92% of the stage 鈥?standing side by side they need 0.556 + 0.526 of that height in WIDTH, the maids' intrinsic ratios.鈥濄€傛垜瀹炴祴鐨?1122/2019 = 0.5557銆?077/2048 = 0.5259 涓庝箣鍚诲悎鍒板皬鏁扮偣鍚庝笁浣嶏紝璇存槑**灏哄璇绘硶涓庢簮鐮佷綔鑰呯殑涓€鑷?*锛屼笉鏄阀鍚堛€?
鏈牳瀹為」锛堜笉缂栭€狅級锛歝hibi 鐨?VP8X 鍙鏄庡鍣ㄥ厑璁?alpha/鍏冩暟鎹紝鎴?*鏈В鐮佸儚绱犮€佹湭楠岃瘉瀹為檯閫忔槑搴︿笌 ICC profile**锛涘闇€纭閫忔槑閫氶亾锛屽簲鍦ㄥ疄鐜颁晶鐢ㄦ祻瑙堝櫒 `naturalWidth/naturalHeight` 涓庢覆鏌撶粨鏋滃鏍搞€?
## 3. 鍩轰簬灏哄鐨勮垶鍙板竷灞€寤鸿

### 3.1 涓荤珛缁橈細楂樺害鍗犳瘮涓庨敋鐐?
娌跨敤鍘熺毊鑲ょ殑鍑犱綍锛宐oot 鑸炲彴鎸?*鑸炲彴楂樺害 H 鐨勭櫨鍒嗘瘮**瀹氱珛缁橀珮搴︼紝`width:auto`锛岀粷涓嶆媺浼革細

```css
.maid { position: absolute; bottom: 0; width: auto; height: auto; object-fit: contain; object-position: center bottom; }
.maid[data-maid-character="left"]           { height: 96%; left:  clamp(8px, 1.5%, 24px); }
.maid[data-maid-character="right"]          { height: 92%; right: clamp(8px, 1.5%, 24px); }
```

- **閿氱偣**锛歚bottom: 0` + `object-position: center bottom`銆傚師鐨偆绔嬬粯鏄?*閫忔槑鑳屾櫙鐨勫叏韬珛缁樸€佽剼搴曡创搴曡竟**锛屾墍浠ュ繀椤诲簳瀵归綈锛涚敤 `center center` 浼氭妸浜虹墿鎮诞銆佷笖椤堕儴瑁呴グ锛堝附楗?鍙戦グ锛夊鏄撹鍒囥€?- **缁濅笉鐢?`background-size: cover` 澶勭悊绔嬬粯**锛屼篃涓嶈璁?`width:100%`锛?.55 鐨勭獎闀挎瘮渚嬩竴鏃︽寜瀹藉害閾烘弧灏变細鎶婇珮搴︽拺鍒板搴︾殑 1.8 鍊嶏紝澶撮儴鍑虹敾銆?- 寤鸿 boot 鍔ㄧ敾棰濆鐣欏嚭**椤堕儴瀹夊叏鍖?*锛?6%/92% 宸叉槸涓婇檺锛岃嫢鍔ㄧ敾鏈変粠涓嬪線涓娾€滃嚭鍦衡€濅綅绉伙紝璧峰甯х粰 `translateY(6%~10%)`銆佺粨鏉熷抚褰?0锛屼笉瑕佺敤 `scale` 鏀惧ぇ瓒呰繃 1.0锛屽惁鍒欑瓑鍚屾媺浼搞€?
### 3.2 鍙屼汉骞舵帓鐨勫搴﹂绠楋紙鍐冲畾鈥滆兘涓嶈兘鍚屾椂鍑哄満鈥濓級

涓や汉楂樺害姣?脳 鍐呭湪姣斾緥锛屽緱鍒?*骞舵帓鎵€闇€瀹藉害**锛堢浉瀵?H锛夛細

| 鐘舵€?| left 楂樺害 | right/vision 楂樺害 | 瀹藉害鍜?(脳 H) |
|---|---|---|---|
| 榛樿锛堟棤瀵硅瘽锛?| 96% | 92% | 0.96脳0.5557 + 0.92脳0.5259 = **1.0173 H** |
| 瀵硅瘽婵€娲?| 64% | 62% | **0.6817 H** |
| 鈮?00px 涓斿璇濇縺娲?| 46% | 44% | **0.4870 H** |

鍒ゅ畾寮忥細褰?*鍙敤鑸炲彴瀹藉害 < 1.0173 脳 H + 32px** 鏃跺弻浜轰細閲嶅彔銆傚師鐨偆姝ｆ槸鐢ㄨ繖涓垽瀹氳Е鍙戔€滆涓€涓汉婊戣蛋鈥濈殑闄嶇骇閫昏緫锛歚CROWDED_GAP_PX = 32` / `RESTORE_GAP_PX = 96`锛坄lib/client.js:2323/2325`锛屽惈 32鈫?6 鐨勫洖婊為槻鎶栵級锛屾嫢鎸ゆ椂鎸夋ā鍨嬪垎鏀彧淇濈暀涓€浜猴細
- `html[data-dsh-whale-model=pro] 鈥?[data-maid-figures-crowded] :is([data-maid-character=right],[data-maid-character=vision]){opacity:0;translate:100vw}` 鈫?pro 淇濈暀 **left**锛?- `html:not([data-dsh-whale-model=pro]) 鈥?[data-maid-figures-crowded] [data-maid-character=left]{opacity:0;translate:-100vw}` 鈫?榛樿锛堥潪 pro锛変繚鐣?**right**銆?
鈫?**boot 鍔ㄧ敾寤鸿**锛氶粯璁よ矾寰勬寜鈥滀繚鐣?maid-right鈥濆疄鐜帮紙涓庣毊鑲ら粯璁ゅ垎鏀竴鑷达級锛屽苟娌跨敤 32/96px 鍥炴粸锛岄伩鍏嶇獥鍙ｆ嫋鎷芥椂闂儊銆傚疄闄呴绠楋細1920脳1080锛圚=1080锛夐渶瀹?鈮?099px锛屽瘜浣欙紱1366脳768 闇€ 鈮?81px锛屽瘜浣欙紱1280脳900 涓斿彸渚у紑 400px 闈㈡澘鏃跺垪瀹?鈮?00px < 948px 鈫?瑙﹀彂鍙屼汉闄嶇骇銆?
### 3.3 Q 鐗堬紙chibi锛変綋閲?
- 鍐呭湪姣斾緥 1.1212锛?20脳553锛夛紝杩戞柟褰㈡í鍚戙€傚師鐨偆鐢ㄦ硶鏄?*鎸変晶杈规爮瀹藉害鐨?82% 涓斾笂闄?320px銆乣height:auto`銆乣max-height:38%`銆乣object-fit:contain`**銆?- 鑸炲彴寮忓嚭鍦哄缓璁細鎶?chibi 褰撲綔**浣撻噺鍙傜収鐗?*锛岄珮搴﹀彇 **鑸炲彴楂樺害鐨?12%鈥?8%**锛堝搴﹁嚜鐒朵负 0.135鈥?.202 H锛屾瘮涓荤珛缁樺皬涓€涓噺绾э紝閬垮厤鎶㈤暅锛夛紱`object-fit: contain`锛?*涓嶈鍒囥€佷笉鍙樺舰**銆?- 瀹氫綅寤鸿璐村湪涓荤珛缁樼殑**鍐呬晶涓嬭**锛堜笌涓荤珛缁樺簳杈瑰悓楂橈級锛屾í鍚戜笉瓒婅繃鑸炲彴涓嚎锛沗prefers-reduced-motion` 涓嬮潤鎬佸憟鐜般€?
### 3.4 瀹鑳屾櫙閾哄睍鏂瑰紡

- 鍘熺毊鑲わ細`background: var(--maid-palace-art) center bottom / cover no-repeat`锛屼綔鐢ㄤ簬 `inset:0` 鐨勫叏鑸炲彴灞傦紝`z-index:0`銆乣pointer-events:none`銆乣contain:strict`銆?- 灏哄 1586脳992锛?.5988 鈮?16:10锛夈€俙cover` + `center bottom` 鐨勫惈涔夛細**缂╂斁绯绘暟鍙?max(W/1586, H/992)**锛屽簳杈逛笌姘村钩涓績鎭掑榻愶紝鍥犳鍦版澘/鍙伴樁绾挎案杩滆惤鍦ㄨ垶鍙板簳閮紝浠ｄ环鏄í鍚戞孩鍑洪儴鍒嗚瑁併€?- 妯悜锛堝楂樻瘮 > 1.6锛屽 1920脳1080 = 1.78锛夛細鎸夊搴﹂摵婊°€佸瀭鐩村皯閲忔孩鍑猴紝瑁佸垏鍙戠敓鍦?*椤堕儴**锛堢┕椤?鍚婄伅锛夛紝浜虹墿涓庡湴闈笉鍙楀奖鍝?鈫?鍙洿鎺ユ部鐢?`cover / center bottom`銆?- 绾靛悜/绐勫睆锛堝 390脳844 = 0.46锛夛細`cover` 浼氭寜楂樺害鏀惧ぇ鍒?1350脳844锛?*鍙墿涓棿绾?29% 鐨勭珫鏉?*锛屼袱渚х考妤艰瑁佹帀銆傛鏃朵袱绉嶅彲閫夌瓥鐣ワ細
  1. **淇濇寔 `cover` + `center bottom`**锛氱敾闈㈡棤鐣欑櫧銆佹棤鎷肩紳锛屼唬浠锋槸澶卞幓涓や晶锛涜儗鏅棤浜鸿劯銆佽鍒囧畨鍏紝**鎺ㄨ崘**銆?  2. 鏀圭敤 `background-size: auto 100%` 骞剁粰鑸炲彴琛ヤ竴涓悓鑹插簳锛坄--maid-navy-950:#091333` / `--maid-navy-900:#10204d`锛岃 `lib/client.js:78`锛夐伩鍏嶄袱渚ч湶鐧姐€?  **涓嶈鐢?`contain`**锛氫細鍑虹幇涓婁笅鎴栧乏鍙宠壊甯︼紝闄ら潪鍚屾椂閾烘弧鍚岃壊搴曘€?- 涓婚鍒囨崲锛氫寒/鏆椾袱寮犲悓灏哄鍚屾瀯鍥撅紝boot 鏈熼棿鎸?`prefers-color-scheme` 鎴栧涓?`data-ds-dark-theme` 閫変竴寮犲嵆鍙紝涓嶈浜ゅ弶娣″叆涓ゅ紶鍏ㄥ睆鍥撅紙閬垮厤鍚屾椂瑙ｇ爜涓ゅ紶 27 涓囧瓧鑺傜骇浣嶅浘閫犳垚棣栧抚 jank锛夛紱鑻ュ繀椤绘贰鍏ワ紝璁╀寒鑹插眰甯搁┗銆佹殫鑹插眰鍙犲姞杩囨浮銆?
### 3.5 绐勫睆浼樺厛绾у彇鑸?
鍘熺毊鑲ょ殑闄嶇骇姊害锛堝彲鐩存帴浣滀负 boot 鐨勫彇鑸嶄緷鎹級锛氣墹1080px 绔嬬粯閫忔槑搴﹂檷鍒?0.74锛涒墹700px 涓斿璇濇縺娲绘椂楂樺害闄嶄负 46%/44%锛涒墹700px 绔栧睆涓旀棤瀵硅瘽鏃剁粺涓€ 62%锛涙嫢鎸ゆ椂鍙暀涓€浜猴紱渚ц竟鏍?rail 妯″紡涓?chibi 鐩存帴闅愯棌銆?
boot 鍑哄満鍔ㄧ敾寤鸿浼樺厛绾э細
1. **瀹鑳屾櫙**锛堝缁堜繚鐣欙紝`cover`锛涘畠鏄€滆垶鍙版劅鈥濈殑鏉ユ簮锛屾垚鏈渶浣庯級銆?2. **鍙充晶涓荤珛缁?maid-right**锛堥粯璁や繚鐣欎綅锛涢珮搴?鈮?min(榛樿姣斾緥, 鐢卞搴﹀弽鎺ㄧ殑涓婇檺)锛夈€?3. **宸︿晶绔嬬粯 maid-left**锛堥绠椾笉澶熸椂绗竴涓浣嶏級銆?4. **chibi**锛堟渶鍚庡姞鍏ワ紝绐勫睆鍙渷锛夈€?5. **vision 鍙湪 boot 涓畬鍏ㄤ笉浣跨敤**锛氬畠榛樿涓嶅彲瑙侊紝浠呮槸 flash 瑙嗚鍙樹綋锛岀敤瀹冨綋鈥滅涓変釜鍑哄満浜虹墿鈥濅細鍋忕鍘熺毊鑲よ涔夈€?
绐勫睆楂樺害涓婇檺锛氬崟绔嬬粯涓嶈兘鍙寜鐧惧垎姣旇楂橈紝鍚﹀垯 0.5259 鐨勬瘮渚嬩細鍦ㄧ獎瑙嗗彛妯悜婧㈠嚭銆傚缓璁?`height: min(92%, calc(<鍙敤瀹藉害> / 0.5259 * 0.92))` 褰㈠紡锛堟垨绛変环鐨?`max-width: calc(100% - 48px)` 鍏滃簳鈥斺€斿師鐨偆鍦?鈮?00px 鐨?model-exit 鍒嗘敮灏辩敤浜?`max-width: calc(100% - 48px)`锛夈€備互 390脳844 绔栧睆涓轰緥锛氬崟浜?92% 楂樺害 鈫?楂?776px銆佸 408px > 390px 婧㈠嚭锛涘帇鍒?62% 鈫?楂?523px銆佸 275px 鍙绾炽€?*绔栧睆鎵嬫満鐩存帴鍗曚汉 + 62%** 鏄畨鍏ㄩ粯璁ゃ€?
## 4. 鍚屾簮璺敱浜嬪疄涓庨闄╋紙瀹炵幇渚у繀椤荤煡閬擄級

- 瀹㈡埛绔?URL 鏋勯€狅紙`lib/client.js:9-11`锛夛細
  ```js
  function skinAssetUrl(file) {
      return new URL(`skin-assets/maid-atelier/${file}`, document.baseURI).href;
  }
  ```
  娉ㄦ剰鏄?*鐩稿 `document.baseURI` 鐨勮В鏋?*锛堟棤鍓嶅鏂滄潬锛夛紝鍙吋瀹瑰弽鍚戜唬鐞嗘寕杞借矾寰勪笌 dsh-app 杞彂锛沗assets.json` 涓粺涓€璁颁负缁濆璺緞褰㈠紡 `/skin-assets/maid-atelier/<hash>.webp`銆俠oot 鎻掍欢鍦ㄨ嚜宸辩殑 shadow root / 瀹夸富鍗婅竟閲屽簲鍋氬悓鏍风殑鐩稿瑙ｆ瀽锛堟垨鐩存帴鐢?`new URL('skin-assets/maid-atelier/'+file, document.baseURI)`锛夛紝涓嶈鎶婂煙鍚嶅啓姝汇€?- 瀹夸富璺敱娉ㄥ唽锛坄lib/index.js:4-6, 90`锛夛細`const prefix = \`/skin-assets/${id}\``锛岃皟鐢ㄥ `installSkinAssets(ctx, "maid-atelier", new URL("../assets/runtime/", import.meta.url), manifest_default)` 鈫?鍓嶇紑鍗?`/skin-assets/maid-atelier`銆?- 鏈嶅姟缁嗚妭锛氫粎 `GET`/`HEAD`锛堝惁鍒?405 + `Allow: GET, HEAD`锛夛紱`!allowed.has(file)` 鎴栨枃浠跺悕涓嶅尮閰?`^[a-f0-9]{64}\.(png|webp)$` 鈫?404锛沗Content-Type: image/webp`锛沗Cache-Control: public, max-age=31536000, immutable`锛沗ETag: "<hash>"`锛涘懡涓?`If-None-Match` 杩斿洖 304锛沗X-Content-Type-Options: nosniff`銆?- 鈿狅笍 **渚濊禆椋庨櫓锛堝缓璁疄鐜颁晶鏄惧紡澶勭悊锛?*锛氳璺敱鐢?**maid-atelier 鐨偆鎻掍欢鐨勪富鏈哄崐杈?*娉ㄥ唽锛坄webCtx.effect(...)` 闅忔彃浠跺惎鐢ㄨ€屽瓨鍦級銆傚洜姝?`/skin-assets/maid-atelier/*` **鍙湁鍦?maid-atelier 鐨偆鎻掍欢宸插畨瑁呭苟鍚敤鏃舵墠杩斿洖 200**锛涙湭瀹夎/鏈惎鐢ㄦ椂鏄?404銆俠oot 鎻掍欢**涓嶅緱鍋囪绱犳潗涓€瀹氬彲杈?*锛氬簲鍦ㄥ姩鐢诲惎鍔ㄥ墠瀵归甯х珛缁樺仛涓€娆?`img.decode()` / `onerror` 鎺㈡祴锛屽け璐ユ椂閫€鍖栦负绾?CSS锛堟笎鍙?+ 鏂囧瓧/鍑犱綍锛夊嚭鍦猴紝淇濊瘉鈥?50ms 鍐呭彲璺宠繃鈥濅笌涓嶉樆濉炵湡鐣岄潰闇插嚭銆傝繖涓€鏉℃槸鏈璁＄粰鍑虹殑銆侀渶瑕佷富鎺у喅绛栫殑瀹炵幇绾︽潫銆?
## 5. 鍙鍚堣鑷瘉

- 瀹¤浠呬娇鐢?`read`/`grep` 涓庝笁娆″彧璇?Node 鎺㈡祴锛坄fs.readSync` 鍓?64 瀛楄妭銆乣fs.statSync`锛夛紝鏈墦寮€浠讳綍鏂囦欢鐢ㄤ簬鍐欏叆锛涙湭瀵硅鍖呯洰褰曟墽琛屽鍒?绉诲姩/鍒犻櫎銆?- 宸ヤ綔鍖烘湭鍑虹幇璇ョ洰褰曚换浣曠礌鏉愬壇鏈紙`.webp`/`.ico` 鎵弿涓虹┖锛夛紱`docs/` 鍐呭彧鏈夋枃鏈笌 JSON锛屾棤浣嶅浘銆?
---

## 6. F9 澶嶆牳锛氭爣棰樹笌鍙崇珛缁樼殑妯悜鍏崇郴锛堜富鎺ф敹灏捐ˉ璁帮級

> 鏈妭鐢?captain 鍦ㄦ敹灏鹃樁娈佃ˉ鍏ャ€倀15 淇鏃跺绾︾ 9 鏉¤姹傛妸 F9 缁撹鍐欒繘鏈枃浠讹紝
> 浣嗗綋鏃?`docs/` 涓嶅湪 t15 鐨?inScope 鍐咃紝鏁呯敱鏈鏀跺熬浠诲姟琛ヨ銆?> **鑼冨洿鍙樻洿濡傚疄璁板綍**锛氭湰鑺傚睘浜庢柊澧炶ˉ璁帮紝涓嶆敼鍐欐湰鏂囦欢鏃㈡湁绔犺妭锛屼篃涓嶈拷婧敼鍐欎换浣曞凡瀹屾垚浠诲姟鐨勭粨璁恒€?
### 6.1 缁撹

**F9 涓嶆垚绔嬩负缂洪櫡銆?* 褰撳墠瀹炵幇锛坄lib/client.js:1126-1152`锛夌敤**涓荤珛缁樼湡瀹炲彸缂?+ 32px** 瀹氫綅鏍囬锛?
```js
const leftInset = Math.max(8, Math.min(0.06 * stageW, 96));
const leftSpriteRight = leftInset + STAGE_CONFIG.maidLeftHeight * stageH * 0.5557; // 涓荤珛缁樼湡瀹炲彸缂?const rightInset = Math.max(8, Math.min(0.05 * stageW, 80));
const rightSpriteLeft = stageW - rightInset - STAGE_CONFIG.maidRightHeight * stageH * 0.5259;
```

骞跺 `--wm-title-avail` 鍋氫簩娆′笂闄愶紱**`roomForTitle` 涓哄亣鏃跺彸绔嬬粯璁╀綅**锛坄showRight = false`锛夈€?鍥犳"鏍囬鍘嬩汉鐗?鍦ㄥ嚑浣曚笂**鎭掍笉鎴愮珛**銆?
### 6.2 瀹炴祴渚濇嵁

| 鑸炲彴灏哄 | 鏍囬缁樺埗鐩掑彸缂?| 鍙崇珛缁樺乏缂?| 缁撴灉 |
|---|---|---|---|
| 1920脳1080 | 1285.49 px | 1317.49 px | 鍑€绌?**32.00 px**锛屼笉閲嶅彔 |
| 1600脳900 | 鈥?| 鈥?| 鍑€绌?**44.5 px**锛屼笉閲嶅彔 |
| 1440脳900 | 鈥?| 鈥?| **鍙崇珛缁樿浣?*锛屾爣棰樿幏寰楁洿瀹界殑瀹芥澗鐩?|

浠ヤ笂涓夌粍涓?`assert.mjs` 鐨?section 18 瑙勫垯绾ф柇瑷€浜掔浉鍗拌瘉锛堝悓涓€鍐荤粨淇瀹炴祴閫氳繃锛夈€?
### 6.3 鏃х畻寮忎负浣曠湅璧锋潵"閲嶅彔"

鐢ㄦ埛濂戠害涔︿腑鎻忚堪鐨?`left:58%; width:min(40vw,620px)` 鏄?*杩佺Щ鍓嶇殑鏃х畻寮?*锛?鍦?1920脳1080 涓嬪畠鎶婃爣棰樼洅鎺ㄥ埌 1113.6 + 637.08 = **1750.68 px**锛屼笌鍙崇珛缁樿捣鐐?1317.49 px
閲嶅彔绾?**433 px**銆傝绠楀紡**宸蹭笉鍦ㄥ喕缁撲唬鐮佷腑**锛屽洜姝?*鏃笉闇€瑕佹敼鍧愭爣锛屼篃涓嶉渶瑕佽鍙崇珛缁樻棤鏉′欢璁╀綅**銆?
### 6.4 涓庤瑙夎瘉鎹殑鍏崇郴

鐪熷疄娴忚鍣ㄦ埅鍥捐 `screenshots/stage-02-maids-landed.png` 涓?`stage-03-title-reveal.png`锛?浠ュ強 `docs/VISUAL-REVIEW.md` 搂Z锛堜富鎺ф敹灏鹃檮褰曪級銆?
