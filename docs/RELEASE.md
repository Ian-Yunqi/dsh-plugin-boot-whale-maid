# RELEASE 鈥?鎵撳寘璁板綍涓庤В鍖呭鏍?
> **褰撳墠缁撹锛堝楠岃褰曡 搂10锛夛細鏈寘宸查€氳繃鍥涙潯楠屾敹锛屽彲鍙戝竷銆?* 涓嬪垪 搂1鈥撀? 淇濈暀鐨勬槸**绗竴娆℃墦鍖呮椂鐐?*锛?026-10-10 22:29锛夌殑璁板綍锛屽綋鏃?`scripts/assert.mjs` 灏氭湭褰掗浂銆佷笖鍖呭唴鏈変袱澶勭浜鸿矾寰勶紱杩欎袱椤圭幇鍧囧凡鍦?搂10 鐨勫楠屼腑娑堥櫎銆?> 鍘嗗彶璁板綍涓嶈拷婧敼鍐欙紝浠ュ厤璇昏€呰浠ヤ负鏃╂湡缁撹灏辨槸鏈€缁堢粨璁恒€?
- 棣栨璁板綍鏃堕棿锛?026-10-10 22:29锛堟湰鍦帮級
- 鎵撳寘鐩綍锛歚dsh-plugin-boot-whale-maid/`
- 鍖呭悕 / 鐗堟湰锛歚dsh-plugin-boot-whale-maid` @ `0.1.0`

---

## 1. 鎵撳寘鍛戒护

鏈細璇濋噷 npm 鐨?*榛樿缂撳瓨鐩綍涓嶅彲鍐?*锛屽繀椤绘樉寮忔寚瀹氬伐浣滃尯鍐呯殑缂撳瓨鐩綍锛?
```bash
cd dsh-plugin-boot-whale-maid
npm pack --cache .npm-cache
```

瀹炴祴瀵圭収锛?
| 鍛戒护 | 缁撴灉 |
|---|---|
| `npm pack --dry-run` | **澶辫触**锛宍exit=-4048`锛歚npm error Log files were not written due to an error writing to the directory: <npm-cache>\_logs`锛坄The operation was rejected by your operating system.`锛夈€傚叾涓?`<npm-cache>` 涓虹敤鎴锋湰鏈?npm 缂撳瓨鐩綍锛圵indows 涓婇粯璁や负 `%LOCALAPPDATA%\npm-cache`锛夛紝姝ゅ涓嶈褰曞叿浣撶敤鎴峰悕涓庣洏绗?|
| `npm pack --dry-run --cache .npm-cache` | **鎴愬姛**锛宍exit=0`锛?3 files |
| `npm pack --cache .npm-cache` | **鎴愬姛**锛宍exit=0` |

`.npm-cache/` 涓?`.packcheck/` 鍧囧凡鍔犲叆 `.gitignore`锛屼笖**涓嶅湪** `package.json` 鐨?`files` 鐧藉悕鍗曞唴锛屽洜姝?*涓嶄細**杩涘叆 `.tgz`锛堝凡瀹炴祴锛歚dist/` 鍐呭彧鏈?`.tgz` 涓€涓枃浠讹級銆?
## 2. 鏋勫缓浜х墿

| 椤圭洰 | 鍊?|
|---|---|
| 缁濆璺緞 | `<workspace>\dsh-plugin-boot-whale-maid\dist\dsh-plugin-boot-whale-maid-0.1.0.tgz`锛坄<workspace>` 涓轰氦浠樺伐浣滃尯鏍圭洰褰曪紝姝ゅ涓嶈褰曞叿浣撶敤鎴峰悕涓庣洏绗︼級 |
| 鏂囦欢澶у皬 | **101 941 瀛楄妭**锛堢害 99.6 KiB锛?|
| SHA256 | `5802d6cd01f5311bf107651bd51784ecedaf9e3fa8b34d3ffee999c7ad0539eb` |
| npm shasum | `a965eabdaf1a694177eeb85f6d32b16bba07d954`锛堟墦鍖呮椂 npm 鑷姤锛?|
| 鎵撳寘鏃惰В鍖呭悗澶у皬 | 320.7 kB |

鏍￠獙鍛戒护锛?
```bash
node -e "const fs=require('fs');const d='dsh-plugin-boot-whale-maid/dist';const f=fs.readdirSync(d).filter(x=>x.endsWith('.tgz'));if(!f.length)throw new Error('no tgz');console.log('tgz',f.join(','),fs.statSync(d+'/'+f[0]).size)"
certutil -hashfile dsh-plugin-boot-whale-maid\dist\dsh-plugin-boot-whale-maid-0.1.0.tgz SHA256
```

> **閲嶈锛氳 `.tgz` 鐨勫揩鐓т笌褰撳墠婧愮爜宸蹭笉涓€鑷淬€?* 鍏跺唴鍚殑 `scripts/assert.mjs` 涓?**89 264 瀛楄妭 / sha256 `25ae2db0a3e54681dbbcced9d8a7ab60b1fdf8824aca4cd503755064c4549c3c`**锛岃€岃鏂囦欢鍦ㄦ垜鎵撳寘鍚?*浠嶈鎸佺画淇敼**锛堣娴嬬獥鍙ｅ唴 89 036 鈫?89 087 鈫?89 264 鈫?89 988 瀛楄妭锛夈€傚畠姝ｅ湪琚叾浠栨垚鍛樹慨澶嶄腑锛屽睘浜?*鍙樺姩涓殑鏂囦欢**锛涗笂琛?SHA256 鍙搴斾笂杩板揩鐓э紝閲嶆柊鎵撳寘浼氬緱鍒颁笉鍚岀殑鍝堝笇銆?
## 3. 瑙ｅ寘娓呭崟锛坄tar -xzf` 鍚庯紝`package/` 鍓嶇紑宸茬渷鐣ワ級

鍏?**13** 涓枃浠讹紝涓?`package.json` 鐨?`files` 鐧藉悕鍗曪紙`lib`銆乣cordis.patch.yml`銆乣scripts`銆乣docs`銆乣README.md`銆乣LICENSE`锛夐€愭潯瀵圭収锛?
| 鏂囦欢 | 澶у皬 | 鐧藉悕鍗曟潯鐩?|
|---|---|---|
| `lib/index.js` | 12 691 B | `lib` |
| `lib/client.js` | 59 065 B | `lib` |
| `cordis.patch.yml` | 1 939 B | `cordis.patch.yml` |
| `scripts/smoke.mjs` | 22 581 B | `scripts` |
| `scripts/assert.mjs` | 89 264 B | `scripts` |
| `scripts/preview.html` | 17 444 B | `scripts` |
| `docs/assets.json` | 3 265 B | `docs` |
| `docs/ART-NOTES.md` | 19 111 B | `docs` |
| `docs/ATTRIBUTION.md` | 11 511 B | `docs` |
| `docs/VERIFICATION.md` | 55 501 B | `docs` |
| `package.json` | 1 613 B | 锛坣pm 寮哄埗鍖呭惈锛岄潪鐧藉悕鍗曟潯鐩級 |
| `README.md` | 21 201 B | `README.md` |
| `LICENSE` | 5 516 B | `LICENSE` |

- **鏃犲浣欐枃浠?*锛氶櫎 `package.json`锛坣pm 淇濊瘉鍖呭惈鐨勬竻鍗曟枃浠讹級涔嬪锛屾病鏈変换浣曠櫧鍚嶅崟涔嬪鐨勫唴瀹广€?- 鎵€鏈夊繀闇€鏂囦欢**瀛樺湪涓旈潪绌?*锛歚lib/index.js`銆乣lib/client.js`銆乣cordis.patch.yml`銆乣scripts/smoke.mjs`銆乣scripts/assert.mjs`銆乣scripts/preview.html`銆乣docs/assets.json`銆乣docs/ART-NOTES.md`銆乣docs/ATTRIBUTION.md`銆乣README.md`銆乣LICENSE` 鍏ㄩ儴涓?0 瀛楄妭浠ヤ笂銆?- `docs/VERIFICATION.md` 鍦ㄦ湰娆℃墦鍖呮椂**宸插瓨鍦?*锛堢敱鏍蜂緥瀹¤浠诲姟浜у嚭锛夛紝鍥犳宸查殢涔嬪叆鍖咃紱`docs/VISUAL-REVIEW.md` 涓?`screenshots/` 鍦ㄦ墦鍖呮椂鐐?*灏氫笉瀛樺湪**锛屾晠涓嶅湪鍖呭唴銆傛涓烘墦鍖呮椂鐐圭殑鐪熷疄鐘舵€侊紝鏈负鍑戞竻鍗曡€岀瓑寰呮垨浼€犮€?
### 3.1 绂佹鍐呭鏍稿锛堝叏閮ㄩ€氳繃锛?
| 妫€鏌?| 缁撴灉 |
|---|---|
| `node_modules` | **涓嶅瓨鍦?* |
| `.npm-cache` / `.packcheck` / `.git` | **鍧囦笉瀛樺湪** |
| 鍘熺毊鑲ゅ浘鐗囧瓧鑺傦紙`.webp/.png/.jpg/.jpeg/.ico/.gif/.bmp`锛?| **0 涓?* |
| 涓存椂鎺㈤拡鏂囦欢锛坄probe*`銆乣isolate*`銆乣asar-*`銆乣temp-*`銆乣*.orig/*.bak/*.rej`锛?| **0 涓?* |

> 绱犳潗璇存槑锛氬姩鐢诲彧鍦ㄨ繍琛屾椂鎸夊悓婧?URL 寮曠敤 `/skin-assets/maid-atelier/<hash>.webp`锛屽寘鍐?*涓嶅惈浠讳綍浣嶅浘瀛楄妭**锛屼笌 `LICENSE` 搂2 鍜?`docs/ATTRIBUTION.md` 鐨勫０鏄庝竴鑷达紝宸茬敱鏈潯鏈烘鏍稿銆?
## 4. 瑙ｅ寘鍚庣殑閲嶈窇楠屾敹锛?*鏈叏閮ㄩ€氳繃**锛?
鍦?*瑙ｅ寘鐩綍鍐?*鎵ц锛堣瘉鏄庡彂甯冪墿鑷韩鑷唇锛屼笉渚濊禆宸ヤ綔鍖哄叾瀹冩枃浠讹級锛?
| # | 鍛戒护 | 閫€鍑虹爜 | 杈撳嚭 |
|---|---|---|---|
| 1 | `node --check lib/index.js` | **0** | 鏃犺緭鍑?|
| 2 | `node --check lib/client.js` | **0** | 鏃犺緭鍑?|
| 3 | `node scripts/smoke.mjs` | **0** | `74/74 checks passed` |
| 4 | `node scripts/assert.mjs` | **1** | `checks: 386, failures: 7` 鈫?`RESULT: FAIL` |

1鈥? 閫氳繃锛?*绗?4 鏉′笉閫氳繃**锛屽洜姝ゃ€屽洓鏉″叏閮ㄩ€€鍑虹爜 0銆嶇殑楠屾敹鏉′欢**鏈弧瓒?*銆?
## 5. 闃诲椤癸紙鏈鏈兘楠屾敹鐨勫師鍥狅級

### 5.1 `scripts/assert.mjs` 鑷韩澶辫触锛?*楂?*锛岄樆濉炲彂甯冿級

- 鐜拌薄锛氳В鍖呭悗杩愯閫€鍑虹爜 1锛宍RESULT: FAIL`銆傚揩鐓у唴涓?`checks: 386, failures: 7`锛涘悓涓€鏃跺埢宸ヤ綔鍖烘簮鐮佷负 `checks: 401, failures: 23`銆傝鏂囦欢鍦ㄦ垜鏍告煡鏈熼棿**鎸佺画琚慨鏀?*锛堣娴嬪埌 89 036 鈫?89 087 鈫?89 264 鈫?89 988 瀛楄妭锛夛紝**灞炰簬鍙樺姩涓殑鏂囦欢**锛屾垜鏃犳硶鍦ㄥ畠绋冲畾鍓嶇粰鍑哄彲淇＄粨璁恒€?- 宸茬‘璁?*涓嶆槸鎵撳寘鎹熷潖**锛氭簮鐮佷笌瑙ｅ寘浠跺湪鎵撳寘鏃?sha256 涓€鑷达紙鎵撳寘鍓嶅悗 `assert.mjs` 鍝堝笇鐩稿悓锛宍stable: True`锛夛紱澶辫触鍚屾牱鑳藉湪**宸ヤ綔鍖烘簮鐮?*涓婂鐜般€?- 澶辫触鏍蜂緥锛堟埅鑷?22:29 宸ヤ綔鍖烘簮鐮侊紝鍏?23 鏉★級锛?  - `before its segment the main sprite is still hidden :: expected 0, got 1`
  - `the host is opaque for phases 0..5 :: expected 1, got 0`
  - `the curtain panels are off-screen at every phase from 2 to 6 :: null`
  - `the first painted frame is visible :: expected visible, got hidden`
  - `still visible during preloading :: expected visible, got hidden`
  - `the phase has reached 4 :: expected 4, got 3`
  - `degraded curtain starts visible :: expected visible, got hidden`
  - `the reserved title box stops before the right maid starts :: title ends at 1750.6840000000002, right maid starts at 1317.46576`
- 杩欎簺鏄?*浜у搧琛屼负**鏂█锛堝涓?`data-state` 鏃跺簭銆丆SS 绾ц仈鎺ㄥ鍑虹殑 opacity/transform銆佹爣棰橀鐣欐涓庡彸绔嬬粯鐨勫嚑浣曞叧绯伙級锛屼笉鏄墦鍖呭紩鍏ョ殑闂锛涘叾涓嫢骞查」鎸囧悜 `lib/client.js` 鐨勬牱寮?鏃跺簭锛岄渶瑕佸叾鎵€鏈夎€呭垽鏂槸**浠ｇ爜缂洪櫡**杩樻槸**鏂█鏈韩杩囦弗**銆傛垜**鏈?*鏀瑰姩 `lib/` 鎴?`scripts/assert.mjs`锛堝潎涓嶅湪鏈换鍔¤寖鍥村唴锛夈€?
### 5.2 绉佷汉璺緞娉勬紡锛?*涓?*锛? 澶勭粷瀵硅矾寰勶級

瀵硅В鍖呭悗**鍏ㄩ儴 13 涓枃鏈枃浠?*鍋氱粷瀵硅矾寰?鐢ㄦ埛鏍囪瘑鎵弿锛屽懡涓?3 澶勶紙鍙︽湁 1 澶勮鎶ワ紝瑙佷笅锛夛細

| 鏂囦欢 | 琛?| 鍐呭锛堣劚鏁忓悗鐨勮褰曞舰寮忥級 |
|---|---|---|
| `docs/ART-NOTES.md` | 3 | `C:\Users\<user>\.dsh\profiles\desktop\node_modules\@smalltailqwq\dsh-client-ui-skin-maid-atelier` |
| `docs/VERIFICATION.md` | 228 | `C:\Users\<user>\.dsh\profiles\desktop\node_modules\@smalltailqwq\dsh-client-ui-skin-maid-atelier\lib\client.js` |
| `package.json` | 48 | `"deepseek-harness"` 鈥?**璇姤**锛氳繖鏄?`keywords` 鏁扮粍閲岀殑鍏抽敭璇嶏紝涓嶆槸璺緞 |

- 涓ゅ鍧囦负**褰撴椂**锛坱19 鎵撳寘鏃剁偣锛夌殑瑙傛祴璁板綍锛屽凡鎸夋湰鑺備笅鏂?搂5.3 瀹屾垚鑴辨晱锛歚ART-NOTES.md` 鏀逛负 `~/.dsh/profiles/<profile>/...` 涓€у崰浣嶅苟娉ㄦ槑涓虹敤鎴锋湰鏈鸿矾寰勭ず渚嬶紱`VERIFICATION.md` 鍦ㄥ叾鍚庣殑鏀瑰啓涓凡涓嶅惈璇ヨ矾寰勩€?- 鎵弿鑼冨洿涓庢柟娉曪細瑙ｅ寘鍚庡**鍏ㄩ儴鏂囨湰鏂囦欢**锛堝惈鏃犳墿灞曞悕鐨?`LICENSE`锛夐€愪釜鍋氭鍒欐壂鎻忥紝鍖归厤妯″紡涓?`[A-Za-z]:\\+Users\\+<name>`銆乣[A-Za-z]:/+Users/+<name>`銆乣/(Users|home)/<name>/`銆乣AppData`銆乣deepseek-harness`銆乣default-workspace`銆乣.packcheck`銆乣.npm-cache` 浠ュ強鏈満鐢ㄦ埛鍚嶃€傛壂鎻忚剼鏈负涓存椂鎺㈤拡锛屾斁鍦?`.packcheck/`锛堝凡 gitignore銆佷笉鍏ュ寘銆佷笉鍏ュ簱锛夛紝鍙湪闇€瑕佹椂閲嶈窇銆?
### 5.3 鑴辨晱涓庢磥鍑€搴︿慨姝ｏ紙鏈换鍔″畬鎴愶紝闄勫甫璇存槑锛?
- `docs/ART-NOTES.md:3` 鐨勭浜虹粷瀵硅矾寰勫凡鏇挎崲涓轰腑鎬у崰浣?`~/.dsh/profiles/<profile>/node_modules/@smalltailqwq/dsh-client-ui-skin-maid-atelier`锛屽苟鍔犳敞銆岀敤鎴锋湰鏈鸿矾寰勭ず渚嬨€嶏紝**鏈敼鍔ㄨ鏂囨。鐨勭粨鏋勪笌鍏跺畠鍐呭**锛堝彧鏇挎崲璺緞瀛楃涓诧級銆?- `docs/VERIFICATION.md` 鍦ㄥ綋鍓嶇増鏈腑**宸蹭笉鍚?* `C:\Users\<user>` 褰㈠紡鐨勮矾寰勶紙鐢辫鏂囨。鐨勬墍鏈夎€呭湪鍚庣画鏀瑰啓涓Щ闄わ級锛屾晠鏈鏈鍏跺仛璺緞鏇挎崲锛屼互鍏嶈鐩栦粬浜烘渶鏂板唴瀹广€?- 鏈枃浠讹紙`RELEASE.md`锛夎嚜韬師鍏堜篃甯︽湁 2 澶勭粷瀵硅矾寰勪笌鑷韩宸ヤ綔鍖鸿矾寰勶紝宸蹭竴骞朵腑鎬у寲锛屽洜涓哄畠鍚屾牱浼氶殢鍖呭彂甯冦€?- 鍏充簬 `package.json` 鐨?`deepseek-harness`锛?*璇姤**銆傚畠鏄?`keywords` 鏁扮粍涓殑鍏抽敭璇嶏紙鐢ㄤ簬鍖呮绱級锛屼笉鏄枃浠剁郴缁熻矾寰勶紱`docs/` 涓嚭鐜扮殑 `deepseek-harness` 鑻ュ睘姝ｆ枃鍙欒堪浜﹀悓銆?- 璇存槑锛歚scripts/assert.mjs` 鍐呭惈 `h:\\`锛堟鍒欓噷鍖归厤鐩樼鐨勫瓧闈㈤噺锛夊睘**浠ｇ爜**鑰岄潪璺緞娉勬紡锛屼笖璇ユ枃浠朵笉鍦ㄦ湰浠诲姟鑼冨洿鍐咃紝鏈敼鍔ㄣ€?
## 6. 鏈獙璇侀」锛堣瘹瀹炲０鏄庯級

1. **鐪熷疄娴忚鍣ㄤ笌鐪熸満琛ㄧ幇**锛氬叏閮ㄧ粨璁烘潵鑷?Node 涓嬬殑璇硶妫€鏌ヤ笌鍋?DOM 鏂█锛屾湭鍦ㄦ祻瑙堝櫒娓叉煋寮曟搸涓洰瑙嗘牳瀵瑰竷灞€銆佸瓧鍙枫€佺獎灞忛噸鎺掍笌 `prefers-color-scheme` 鍒嗘敮銆?2. **鐪熷疄绱犳潗涓嬬殑缇庢湳鏁堟灉**锛氬寘鍐呬笉鍚礌鏉愬瓧鑺傦紙杩欐槸鏈夋剰鐨勶級锛岀礌鏉愮敱鍚屾簮璺敱鍦ㄨ繍琛屾椂鎻愪緵锛涘嵆浣胯濂戒篃鍙兘鍥犵毊鑲ゆ彃浠舵湭鍚敤鑰?404 璧伴檷绾у箷銆傛湰娆?*鏈?*鍦ㄥ惎鐢?maid-atelier 鎻掍欢鐨勭幆澧冮噷楠岃瘉 200/404 涓庣紦瀛樺ご銆?3. **瀹夎鍒?profile 鍚庣殑寮€鏈哄疄娴?*锛氭寜浠诲姟瑕佹眰**鏈?*瀹夎鍒颁换浣?profile锛屼篃**鏈?*閲嶅惎鐢ㄦ埛瀹㈡埛绔紝鍥犳娉ㄥ叆鏃跺簭銆佷笌瀹夸富鍏跺畠鎻掍欢锛堝挨鍏?dsh-550c-boot锛夌殑瀹炴満浜掓枼琛屼负鍧囨湭瀹炴祴銆?4. **npm 瀹夎浣撻獙**锛氬彧鍋氬埌 `npm pack` 浜у嚭涓庤В鍖呭鏍革紝鏈湪骞插噣鐜涓?`npm i` 璇?`.tgz` 楠岃瘉渚濊禆瑙ｆ瀽锛堣鍖?`peerDependencies` 鍏ㄤ负 optional锛夈€?5. **`assert.mjs` 鐨勬渶缁堢粨璁?*锛氬洜鏂囦欢鍦ㄦ牳鏌ユ湡闂存寔缁彉鍔紝鏈枃鍙褰?*蹇収涓庡綋鏃惰娴?*锛涘叾鏈€缁堥€氳繃涓庡惁闇€鍦ㄥ叾绋冲畾鍚庨噸璺戠 4 鏉″懡浠ょ‘璁ゃ€?
## 7. 鏈湴 git 浠撳簱

瑙佷粨搴撳唴鎻愪氦璁板綍銆備粨搴撲互 `.gitignore` 鎺掗櫎 `node_modules/`銆乣.npm-cache/`銆乣.packcheck/`銆乣dist/*.tgz`銆佺紪杈戝櫒涓庣郴缁熶复鏃舵枃浠讹紱`.tgz` 灞炴瀯寤轰骇鐗╋紝涓嶈繘鐗堟湰搴擄紙鍏跺搱甯岃褰曞湪鏈枃 搂2锛夈€?
鏈満**娌℃湁**鍏ㄥ眬 git 韬唤閰嶇疆锛屾彁浜や娇鐢ㄤ竴娆℃€у唴鑱旇韩浠斤紝**鏈?*鍐欏叆鍏ㄥ眬鎴栫郴缁熺骇 config锛?
```bash
git -c user.name="dsh-plugin-boot-whale-maid" -c user.email="noreply@localhost" commit -m "..."
```

**鏈帹閫佽繙绔€佹湭鍒涘缓 GitHub Release**锛氭湰鏈烘棤 `gh` CLI 涓?`GITHUB_TOKEN`锛屾帹閫佷笌 Release 鎸変富鎺ф寚绀虹敱鍚庣画姝ラ澶勭悊銆?
## 8. 澶嶇幇鏈澶嶆牳

```bash
cd dsh-plugin-boot-whale-maid

# 1) 鎵撳寘锛堥粯璁ょ紦瀛樹笉鍙啓锛屽繀椤绘寚瀹氱紦瀛樼洰褰曪級
npm pack --cache .npm-cache
mkdir -p dist && mv dsh-plugin-boot-whale-maid-0.1.0.tgz dist/    # Windows: move 鍒?dist\

# 2) 瑙ｅ寘鍒颁复鏃剁洰褰?mkdir -p .packcheck && tar -xzf dist/dsh-plugin-boot-whale-maid-0.1.0.tgz -C .packcheck

# 3) 鍦ㄨВ鍖呯洰褰曞唴閲嶈窇鍥涙潯楠屾敹
cd .packcheck/package
node --check lib/index.js
node --check lib/client.js
node scripts/smoke.mjs
node scripts/assert.mjs

# 4) 娓呯悊涓存椂鐩綍锛?packcheck 宸?gitignore锛屽唴鍚В鍖呬欢涓庤矾寰勬壂鎻忔帰閽堬級
cd ../.. && rm -rf .packcheck
```

---

## 9. 鏈鐨勫垽瀹?
| 楠屾敹鏉′欢 | 缁撴灉 |
|---|---|
| 鐢熸垚鍙畨瑁呯殑 `.tgz`锛坄npm pack`锛?| **閫氳繃**锛坄exit=0`锛?3 files锛?|
| 瑙ｅ寘娓呭崟涓?`files` 鐧藉悕鍗曢€愭潯瀵圭収锛屽叆鍙ｄ笌蹇呰鏂囦欢榻愬叏銆佹棤澶氫綑鏂囦欢 | **閫氳繃**锛埪?锛?|
| 瑙ｅ寘浠朵笉鍚?`node_modules`锛忕礌鏉愬瓧鑺傦紡涓存椂鎺㈤拡 | **閫氳繃**锛埪?.1锛?|
| 瑙ｅ寘浠朵笉鍚浜虹粷瀵硅矾寰?| **涓嶉€氳繃**锛埪?.2锛? 澶勭粷瀵硅矾寰勶級 |
| 瑙ｅ寘鍚庡洓鏉￠噸璺戝叏閮ㄩ€€鍑虹爜 0 | **涓嶉€氳繃**锛埪?锛岀 4 鏉?`assert.mjs` 閫€鍑虹爜 1锛?|
| 缁欏嚭 `.tgz` 璺緞銆佸ぇ灏忎笌 SHA256 | **閫氳繃**锛埪?锛?|

**缁撹锛氫氦浠樼墿宸蹭骇鍑轰笖澶ч儴鍒嗘牳瀵归€氳繃锛屼絾涓婅堪涓ら」鏈弧瓒筹紝鏁呮湰鍖呭湪淇鍓嶄笉鍙彂甯冦€?* 闃诲椤瑰潎涓?*鍖呭鎵€鏈夎€?*鐨勬枃浠讹紙`scripts/assert.mjs`銆乣lib/client.js` 鐨勬椂搴忎笌鏍峰紡銆乣docs/` 鐨勪袱澶勮矾寰勶級锛屾湭鍦ㄦ湰浠诲姟鑼冨洿鍐呮搮鑷敼鍔ㄣ€?
---

## 10. 澶嶉獙璁板綍锛堟渶缁堜氦浠橈級

鍓嶄竴鑺?搂9 鏄?*绗竴娆℃墦鍖呮椂鐐?*鐨勫垽瀹氥€傛湰鑺傝褰曞叾闃诲椤瑰叏閮ㄦ秷闄ゅ悗鐨?*閲嶆柊鎵撳寘涓庡楠?*锛屾鍗虫渶缁堜氦浠樸€?
- 澶嶉獙鏃堕棿锛?*2026-10-10 22:5x锛堟湰鍦帮級**
- 瑙﹀彂鏉′欢锛歚scripts/assert.mjs` 宸插洖鍒?**exit 0**锛堝綊闆跺墠**鏈?*閲嶆柊鎵撳寘锛岄伩鍏嶄骇鍑虹浜屼釜宸茬煡涓嶅彲鍙戝竷鐨勫揩鐓э級

### 10.1 鏈浜や粯鐨?`.tgz`

| 椤圭洰 | 鍊?|
|---|---|
| 缁濆璺緞 | `<workspace>\dsh-plugin-boot-whale-maid\dist\dsh-plugin-boot-whale-maid-0.1.0.tgz`锛坄<workspace>` 涓轰氦浠樺伐浣滃尯鏍圭洰褰曪級 |
| 鏂囦欢澶у皬 / SHA256 | **浠ュ彂甯冨綋娆″疄娴嬩负鍑?* 鈥斺€?瑙佷笅鏂广€屼负浠€涔堜笉鍐欐銆嶏紱浜や粯璇存槑閲岀粰鍑虹殑 SHA256 鍗虫潈濞佹牎楠屽€?|
| 鎵撳寘鍛戒护 | `npm pack --cache .npm-cache`锛坄exit=0`锛宍total files=23`锛宲ackage size 573.6 kB / unpacked 912.0 kB锛?|
| `dist/` 鍐呮枃浠舵暟 | **1**锛堝敮涓€涓€浠斤紝宸插垹闄ゅ叏閮ㄤ綔搴熷揩鐓э級 |

> **涓轰粈涔堜笉鍦ㄨ繖閲屽啓姝诲搱甯屼笌鏂囦欢鏁?*锛歚screenshots/`锛堟湰鎻掍欢鑸炲彴鎴浘锛変笌 `docs/VISUAL-REVIEW.md` 鍦ㄦ湰鑺傚啓浣滄湡闂?*浠嶈鍏朵粬鎴愬憳鎸佺画鍐欏叆**鈥斺€旀垜瀹炴祴鍒?`npm pack` 鐨?`total files` 浠?14 鈫?17 鈫?18 鈫?22 鈫?23 鍙樺寲銆傝嫢鎶婃煇涓腑闂村€煎啓姝诲湪姝わ紝鏂囨。涓€鍏ュ寘灏变細**鑷浉鐭涚浘**锛堝綊妗ｅ唴鏂囨。鎻忚堪鐨勬槸涓婁竴鐗堝綊妗ｏ級銆?> 鍥犳锛?*`.tgz` 鐨勬潈濞佹牎楠屽€间互鍙戝竷褰撴缁欏嚭鐨?SHA256 涓哄噯**锛屾湰鏂囦欢鍙褰曟柟娉曚笌鐩稿浜嬪疄銆傝繖姣斾竴涓紓浜絾閿欒鐨勬暟瀛楁洿鏈夌敤銆?
### 10.2 鏃у搱甯屼綔搴熷０鏄?
浠ヤ笅鍝堝笇**涓€寰嬩綔搴燂紝涓嶅緱浣滀负浜や粯鐗╂牎楠屽€?*锛堝叾鍐呭瑕佷箞鍚け璐ョ殑 `assert.mjs`锛岃涔堟槸鏇存棭鐨勪笉瀹屾暣蹇収锛夛細

| 浣滃簾鍝堝笇 (SHA256) | 澶у皬 | 璇存槑 |
|---|---|---|
| `5802d6cd01f5311bf107651bd51784ecedaf9e3fa8b34d3ffee999c7ad0539eb` | 101 941 B | 绗竴娆℃墦鍖咃紝鍐呭惈 `RESULT: FAIL` 鐨?`assert.mjs`锛屼笖鍚?2 澶勭浜鸿矾寰?|
| `09816fb8cb5bdf3c1e513c23a472d8f8f6d01db8125fb62a7a7b4d0d9ffdc1ae` | 85 571 B | 鏇存棭鐨勪笉瀹屾暣蹇収 |

鐜板凡浠?`dist/` 涓?*鍏ㄩ儴鍒犻櫎**锛沗dist/` 鍙繚鐣欎笂琛?搂10.1 閭ｄ竴浠藉楠岄€氳繃鐨勪骇鐗┿€?
### 10.3 鑴辨晱缁撴灉

| 鏂囦欢 | 澶勭悊 |
|---|---|
| `docs/ART-NOTES.md:3` | 绉佷汉缁濆璺緞 鈫?涓€у崰浣?`~/.dsh/profiles/<profile>/node_modules/@smalltailqwq/dsh-client-ui-skin-maid-atelier`锛屽苟鍔犳敞銆岀敤鎴锋湰鏈鸿矾寰勭ず渚嬨€嶃€?*浠呮浛鎹㈣矾寰勫瓧绗︿覆锛屾湭鏀瑰姩鏂囨。缁撴瀯涓庡叾瀹冨唴瀹?* |
| `docs/VERIFICATION.md` | 褰撳墠鐗堟湰**宸蹭笉鍚?*璇ョ被璺緞锛堢敱鍏舵墍鏈夎€呭湪鍚庣画鏀瑰啓涓Щ闄わ級锛屾晠鏈敼鍔紝浠ュ厤瑕嗙洊浠栦汉鏈€鏂板唴瀹?|
| `docs/RELEASE.md`锛堟湰鏂囦欢锛?| 鑷韩鐨?2 澶勭粷瀵硅矾寰勪笌宸ヤ綔鍖鸿矾寰勫凡涓€骞朵腑鎬у寲 |

澶嶆壂缁撴灉锛堝**瑙ｅ寘鍚庣殑 14 涓枃浠?*閫愪釜鎵弿锛夛細

- 濂戠害妫€鏌?`t.includes('C:' + '\' + 'Users')` 鈫?**leaks 0**
- 鏇翠弗鐨勩€屽惈鐪熷疄鐢ㄦ埛鍚嶃€嶆ā寮?`[A-Za-z]:\\+Users\\+<name>` / `/Users/<name>/` / `/home/<name>/` 鈫?**0 鍛戒腑**
- **璇姤璇存槑**锛歚package.json` 鐨?`keywords` 涓湁 `"deepseek-harness"`锛屽畠鏄寘妫€绱㈠叧閿瘝鑰?*涓嶆槸**鏂囦欢绯荤粺璺緞锛涙湰鏂囦欢涓?`docs/` 姝ｆ枃鍑虹幇鐨?`deepseek-harness` 鍚屽睘鍙欒堪鐢ㄨ瘝锛岄潪娉勬紡銆俙scripts/assert.mjs` 鍐呯殑鐩樼瀛楅潰閲忓睘**姝ｅ垯浠ｇ爜**锛屼害闈炶矾寰勶紙璇ユ枃浠朵笉鍦ㄦ湰浠诲姟鑼冨洿锛屾湭鏀瑰姩锛夈€?
### 10.4 瑙ｅ寘鍚庡洓鏉￠噸璺戯紙鍦ㄨВ鍖呯洰褰曞唴鎵ц锛?
| # | 鍛戒护 | 閫€鍑虹爜 | 杈撳嚭 |
|---|---|---|---|
| 1 | `node --check lib/index.js` | **0** | 鏃犺緭鍑?|
| 2 | `node --check lib/client.js` | **0** | 鏃犺緭鍑?|
| 3 | `node scripts/smoke.mjs` | **0** | `74/74 checks passed` |
| 4 | `node scripts/assert.mjs` | **0** | `checks: 405, failures: 0` 鈫?`RESULT: PASS` |

**鍥涙潯鍏ㄩ儴閫€鍑虹爜 0**锛屽彂甯冪墿鑷韩鑷唇锛堜笉渚濊禆宸ヤ綔鍖哄叾瀹冩枃浠讹級銆?
### 10.5 娲佸噣搴﹀鏍革紙瑙ｅ寘鍚庯級

| 妫€鏌?| 缁撴灉 |
|---|---|
| 鏂囦欢鎬绘暟 | 瑙佷笅鏂广€屾椂鐐硅鏄庛€嶏紱鏋勬垚涓?`files` 鐧藉悕鍗曞唴瀹?+ npm 寮哄埗鍖呭惈鐨?`package.json` |
| `node_modules` | 涓嶅瓨鍦?|
| `.npm-cache` / `.packcheck` / `.git` | 鍧囦笉瀛樺湪 |
| `dist/` 鎴?`.gitignore` 琚墦鍏ュ寘鍐?| 涓嶅瓨鍦紙`dist/` 涓?`.npm-cache/`銆乣.packcheck/` 涓嶅湪 `files` 鐧藉悕鍗曞唴锛屾晠鏈氨涓嶄細鍏ュ寘锛沗.gitignore` 鍚岀悊锛?|
| **鍘熺毊鑲ょ礌鏉愬瓧鑺?*锛坄/skin-assets/maid-atelier/*` 鐨勪换浣曞壇鏈級 | **0** 鈥斺€?鍖呭唴娌℃湁浠讳綍 `@smalltailqwq/dsh-client-ui-skin-maid-atelier` 鐨勫浘鐗囨垨瀛楄妭 |
| 鍥剧墖绫绘枃浠讹紙`.webp/.png/.jpg/.jpeg/.ico/.gif/.bmp`锛?| **>0**锛屽叏閮ㄤ负**鏈彃浠惰嚜宸辩殑鑸炲彴鎴浘**锛屼綅浜?`screenshots/`锛?280脳720 PNG锛屾潵鑷瑙堥〉鐨?SVG 鍗犱綅鍥惧舰锛岄潪鐪熷疄绔嬬粯銆侀潪鍘熺毊鑲ょ礌鏉愶級銆?*璇ョ洰褰曞湪澶嶉獙鏈熼棿姝ｈ鍏朵粬鎴愬憳鎸佺画鍐欏叆**锛堣娴嬪埌浠?3 涓鑷?8 涓級锛屾晠纭垏鏁伴噺闅忔椂鐐瑰彉鍖栵紝鍏ㄦ枃涓嶅啓姝绘暟瀛?|
| 涓存椂鎺㈤拡锛坄probe*`/`tmp-*`/`temp-*`/`asar-*`/`scan-paths`/`desensitize`/`*.orig`/`*.bak`/`*.rej`锛?| **0** |
| 鍖呭唴 `.tgz` | 0 |
| 鍚湡瀹炵敤鎴峰悕鐨勭粷瀵硅矾寰勶紙鏂囨湰鏂囦欢锛?| **0** |

> **涓夌偣闇€瑕佸瀹炶鏄庯細**
> 1. **銆? 鍥剧墖瀛楄妭銆嶈繖涓€鏉′笉鍐嶅瓧闈㈡垚绔?*锛氬寘鍐呮湁鑻ュ共 PNG锛屽叏閮ㄦ槸**鏈彃浠惰嚜宸辫垶鍙扮殑鎴浘**锛坄screenshots/`锛夛紝鍥犱负 `package.json` 鐨?`files` 鐧藉悕鍗曢噷鏈?`docs`锛堢洰褰曟潯鐩級銆傜湡姝ｇ殑绾㈢嚎锛?*涓嶅惈鍘熺毊鑲や换浣曞浘鐗囨垨瀛楄妭**锛?*浠嶇劧鎴愮珛涓斾负 0**銆傝嫢瑕佹眰鍖呭唴涓€涓瓧鑺傜殑鍥剧墖閮芥病鏈夛紝闇€瑕佹妸 `screenshots/` 鎺掗櫎鍑烘墦鍖呪€斺€旈偅瑕佹敼 `package.json`锛坄files` 鐧藉悕鍗曪級鎴栨柊澧?`.npmignore`锛屼簩鑰呴兘**涓嶅湪鏈换鍔¤寖鍥村唴**锛屾晠鏈搮鑷敼鍔紝浠呭湪姝よ褰曞苟涓婃姤銆?> 2. **鏃剁偣璇存槑锛堥噸瑕侊級**锛歚screenshots/` 鍦ㄦ湰娆″楠屾湡闂?*姝ｈ鍏朵粬鎴愬憳鎸佺画鍐欏叆**锛堟垜瑙傛祴鍒拌鐩綍浠?3 涓枃浠跺鑷?8 涓紝`npm pack` 鐨?`total files` 闅忎箣浠?17 鍙樺埌 22锛夈€傚洜姝ゃ€屾枃浠舵€绘暟銆嶄笌銆屼綋绉€嶆槸**澶嶉獙褰撴鐨勫揩鐓у€?*锛屾湰鏂囦欢涓嶅啓姝诲畠浠紱璇蜂互 搂10.1 鐨?**SHA256** 浣滀负鍞竴鏉冨▉鏍￠獙鍊笺€?> 3. 鏈妭鏁板瓧瀵瑰簲**鏈€缁?* `.tgz`锛埪?0.1 鐨勫搱甯岋級銆?

### 10.6 鏈妭鐨勬渶缁堝垽瀹?
| 楠屾敹鏉′欢 | 缁撴灉 |
|---|---|
| `docs/ART-NOTES.md` / `docs/VERIFICATION.md` 鏃犵浜虹粷瀵硅矾寰?| **閫氳繃**锛埪?0.3锛?|
| 鍏ㄩ儴寰呮墦鍖呮枃鏈枃浠跺鎵粷瀵硅矾寰?0 鍛戒腑 | **閫氳繃**锛埪?0.3锛屽惈璇姤璇存槑锛?|
| 瑙ｅ寘鍚庡洓鏉￠噸璺戝叏閮ㄩ€€鍑虹爜 0 | **閫氳繃**锛埪?0.4锛?|
| 缁欏嚭鏂?`.tgz` 璺緞銆佸ぇ灏忋€丼HA256锛屾棫鍝堝笇浣滃簾 | **閫氳繃**锛埪?0.1銆伮?0.2锛?|
| 瑙ｅ寘鐗╂棤 `node_modules`锛廯.npm-cache`/`.packcheck`/`.git`锛忎复鏃舵帰閽?| **閫氳繃**锛埪?0.5锛?|
| 瑙ｅ寘鐗╂棤**鍘熺毊鑲?*鍥剧墖鎴栧瓧鑺?| **閫氳繃**锛埪?0.5锛氬師鐨偆鍓湰 0锛?|
| 瑙ｅ寘鐗┿€? 鍥剧墖瀛楄妭銆嶏紙瀛楅潰锛?| **鏈弧瓒?*锛埪?0.5锛氬惈 3 涓湰鎻掍欢鑷埗鎴浘 PNG锛岀害 107 KB锛岀粡 `docs` 鐧藉悕鍗曞叆鍖咃紱闇€鏀?`package.json` 鎵嶈兘鎺掗櫎锛屼笉鍦ㄦ湰浠诲姟鑼冨洿锛?|

**缁撹锛氫笁椤瑰師濮嬮樆濉烇紙绉佷汉璺緞銆乣assert.mjs` 鏈綊闆躲€佷綔搴熷揩鐓ф贩鏉傦級宸插叏閮ㄦ秷闄わ紝鍥涙潯楠屾敹閲嶈窇鍏ㄧ豢锛屾湰 `.tgz` 鍙彂甯冦€?* 鍞竴鏈弧瓒崇殑鏄€屽寘鍐?0 鍥剧墖瀛楄妭銆嶇殑**瀛楅潰**瑕佹眰锛屽師鍥犳槸鏈彃浠惰嚜宸辩殑鑸炲彴鎴浘闅?`screenshots/` 鍏ュ寘锛涘畠**涓嶆槸**鍘熺毊鑲ょ礌鏉愶紙绾㈢嚎浠嶄负 0锛夛紝浣嗚嫢瑕佹眰鍖呭唴闆跺浘鐗囷紝闇€鐢辨湁 `package.json` 鍐欐潈鐨勪换鍔℃妸璇ョ洰褰曟帓闄ゅ嚭鎵撳寘銆備粛鏈獙璇佺殑浜嬮」锛堢湡瀹炴祻瑙堝櫒鐩銆佺湡瀹炵礌鏉愮編鏈晥鏋溿€佸畨瑁呭埌 profile 鍚庣殑寮€鏈哄疄娴嬨€佸共鍑€鐜 `npm i` 浣撻獙锛夋部鐢?搂6 鐨勫０鏄庯紝鏈澶嶉獙**涓?*鏀瑰彉瀹冧滑銆?

