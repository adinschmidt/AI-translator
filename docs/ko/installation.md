# 설치

서명된 버전은 [Chrome 웹 스토어](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) 또는 [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/)에서 설치합니다.

소스를 빌드하려면 [Bun](https://bun.sh)을 설치하고 저장소 루트에서 실행합니다.

```sh
bun install --frozen-lockfile
bun run build
```

빌드는 `dist/`를 교체합니다. Chrome의 `chrome://extensions/`에서 개발자 모드를 켜고 압축 해제된 확장 프로그램으로 `dist/chrome/`을 로드합니다. Firefox 142 이상에서는 `about:debugging#/runtime/this-firefox`에서 임시 부가 기능으로 `dist/firefox/manifest.json`을 선택합니다. 임시 설치는 Firefox를 닫으면 해제됩니다.

[릴리스](https://github.com/adinschmidt/AI-translator/releases)의 브라우저별 ZIP을 풀어도 됩니다. 소스 폴더를 직접 로드하지 마세요. 다시 빌드한 뒤 확장 프로그램과 웹페이지를 새로고침합니다.
