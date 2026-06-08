
<template>
  <div class="main">

    <!-- Hero -->
    <section class="hero">
      <h1>서비스 관리 시스템</h1>
      <p>간편하게 업무를 관리하세요</p>
      <button>시작하기</button>
    </section>

    <!-- 기능 -->
    <section class="features">
      <div class="card">업무 관리</div>
      <div class="card">데이터 분석</div>
      <div class="card">협업</div>
    </section>

  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 100px 20px;
}

.features {
  display: flex;
  gap: 20px;
  padding: 40px;
}
.card {
  flex: 1;
  padding: 20px;
  background: white;
  border-radius: 12px;
}
</style>
