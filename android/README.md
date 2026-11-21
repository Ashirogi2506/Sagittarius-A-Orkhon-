# «Ухаалаг Орхон» аппыг Google Play-д гаргах

Апп нь сайтыг (https://smart-orkhon.vercel.app) бүтэн дэлгэцээр нээдэг **Trusted Web Activity (TWA)**.
Тиймээс сайтыг шинэчлэх бүрт апп өөрөө шинэчлэгдэнэ; Play-д дахин илгээх шаардлагагүй.

Бэлэн байгаа зүйлс:

| Зүйл | Хаана |
|---|---|
| Аппын manifest, дүрс, оффлайн service worker | `src/app/manifest.ts`, `public/icons/`, `public/sw.js` |
| Нууцлалын бодлого (Play заавал шаарддаг) | https://smart-orkhon.vercel.app/privacy |
| Бүртгэл устгах заавар (Play заавал шаарддаг) | https://smart-orkhon.vercel.app/privacy#delete, аппын «Бүртгэлээ устгах» товч |
| Digital Asset Links (апп ↔ сайт итгэлцэл) | `/.well-known/assetlinks.json` (Vercel env-ээс уншина) |
| Play-ийн дүрс 512×512, баннер 1024×500 | `android/store/` |
| Дэлгүүрийн тайлбар, Data safety хариулт | `android/store-listing.md` |

Санал болгох **Package name: `mn.smartorkhon.app`** (Play-д нэг гарсны дараа өөрчлөх боломжгүй).

---

## 1. Google Play Console бүртгэл (таны хийх)

1. https://play.google.com/console → хөгжүүлэгчийн бүртгэл нээнэ ($25, нэг удаа). Байгууллагаар эсвэл хувь хүнээр.
2. Хувь хүний шинэ бүртгэл бол Google нь аппыг нийтлэхээс өмнө **12+ туршигчтай 14 хоногийн хаалттай тест** шаарддаг. Багийнхан, найз нөхдөө туршигчаар нэмээрэй.

## 2. Android багц (.aab) үүсгэх

### А. PWABuilder ашиглах (хамгийн хялбар, суулгах зүйлгүй)

1. https://www.pwabuilder.com нээж `https://smart-orkhon.vercel.app` гэж оруулна.
2. **Package for stores → Android → Generate Package** дарна.
3. Тохиргоо:
   - Package ID: `mn.smartorkhon.app`
   - App name: `Ухаалаг Орхон`, Launcher name: `Ухаалаг Орхон`
   - Version: `1.0.0`, Version code: `1`
   - Signing key: **Create new**
4. Татаж авсан zip дотор:
   - `*.aab` → Play Console-д оруулах файл
   - `*.apk` → утсандаа шууд суулгаж турших
   - `signing.keystore` + `signing-key-info.txt` → **гарын үсгийн түлхүүр ба нууц үг. Алдвал аппаа шинэчилж чадахгүй.** Нууц газар (password manager, офлайн диск) 2 хувь хадгална. GitHub-д хэзээ ч бүү оруул.
   - `assetlinks.json` → доорх 3-р алхамд хэрэгтэй SHA-256 хурууны хээ.

### Б. Bubblewrap (өөрийн компьютер дээр)

Google-ийн CLI. Анх ажиллуулахад JDK 17, Android SDK-г (~1 ГБ) өөрөө татахыг асууна.

```bash
npm i -g @bubblewrap/cli
```

```bash
bubblewrap init --manifest https://smart-orkhon.vercel.app/manifest.webmanifest --directory android/twa
```

```bash
cd android/twa && bubblewrap build
```

`init` асуухад Package ID-д `mn.smartorkhon.app`-г бичнэ. Гарын үсгийн нууц үгийг та өөрөө зохиож оруулна. `android/twa/`, `*.keystore` файлууд `.gitignore`-д орсон.

## 3. Апп ↔ сайтыг холбох (assetlinks)

Холбохгүй бол апп дээд талдаа хөтчийн мөртэй нээгдэнэ.

1. Play Console → апп → **Test and release → App integrity → App signing** хэсгээс
   **App signing key certificate**-ийн **SHA-256** утгыг хуулна. (Upload key-ийнхыг мөн нэмж болно.)
2. Vercel → smart-orkhon → **Settings → Environment Variables**:
   - `ANDROID_SHA256_FINGERPRINTS` = `AB:CD:…:EF` (хэд байвал таслалаар)
   - Package ID өөр бол `ANDROID_PACKAGE_ID` = таны ID
3. Дахин deploy хийгээд https://smart-orkhon.vercel.app/.well-known/assetlinks.json нээж хээ гарч байгаа эсэхийг шалгана.

## 4. Play Console-д бөглөх

`android/store-listing.md`-ийн текстийг хуулж тавина. Дэлгэцийн зураг (2–8 ширхэг): аппыг утсандаа суулгаад
нүүр, шуурхай мэдээ, автобус, асуудал мэдээлэх, үйлчилгээ хэсгүүдийн дэлгэцийг утсаараа авна.
