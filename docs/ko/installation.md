# 설치

## Chrome / Chromium 기반 브라우저

1. 이 저장소를 다운로드하거나 복제합니다.
2. `chrome://extensions/`로 이동합니다.
3. **개발자 모드**를 활성화합니다(오른쪽 상단 토글).
4. **압축해제된 파일 로드**를 클릭하고 확장 폴더를 선택합니다.

## 파이어폭스

1. 이 저장소를 다운로드하거나 복제합니다.
2. `about:debugging#/runtime/this-firefox`로 이동합니다.
3. **임시 추가 기능 로드**를 클릭합니다.
4. 확장 폴더에서 `manifest.json` 파일을 선택합니다.

::: tip
Firefox의 임시 추가 기능은 브라우저가 닫힐 때 제거됩니다. 영구용
설치하려면 확장 기능을 Mozilla에서 서명하거나 Firefox에 설치해야 합니다.
`xpinstall.signatures.required`이 `false`로 설정된 개발자/Nightly.
:::
