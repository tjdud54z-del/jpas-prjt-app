/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,

  env: {
    node: true,
    browser: true,
    es2022: true
  },

  /**
   * Vue SFC 파서
   */
  parser: 'vue-eslint-parser',

  parserOptions: {
    /**
     * <script setup lang="ts"> 내부는 TS 파서
     */
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.vue']
  },

  extends: [
    'eslint:recommended',

    // Vue 3 권장 규칙
    'plugin:vue/vue3-recommended',

    // Prettier와 충돌 제거
    '@vue/eslint-config-prettier'
  ],

  rules: {
    /**
     * Prettier를 ESLint 에러로 표시
     */
    'prettier/prettier': 'off',
    // 'prettier/prettier': [
    //   'error',
    //   {
    //     endOfLine: 'auto'
    //   }
    // ],

    /* =========================
       Vue 템플릿 관련 (Prettier에 위임)
    ========================= */

    // 속성 줄바꿈/정렬은 Prettier에게 맡김
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',

    // 컴포넌트 이름 정책 완화
    'vue/multi-word-component-names': 'off',
    'vue/no-reserved-component-names': 'off',

    // script / template / style 순서
    'vue/component-tags-order': [
      'error',
      {
        order: ['script', 'template', 'style']
      }
    ]
  }
}
