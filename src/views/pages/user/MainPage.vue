
<template>
  <div class="main">

    <!-- Hero Section -->
    <section class="hero">
      <h1>스마트 ERP 시스템</h1>
      <p>업무를 빠르고, 효율적으로 관리하세요</p>

      <div class="hero-buttons">
        <button class="primary">시작하기</button>
        <button class="secondary">소개 보기</button>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="card">
        <h3>업무 관리</h3>
        <p>작업을 체계적으로 관리</p>
      </div>
      <div class="card">
        <h3>데이터 분석</h3>
        <p>실시간 통계 제공</p>
      </div>
      <div class="card">
        <h3>협업 시스템</h3>
        <p>팀원과 빠른 소통</p>
      </div>
    </section>

    <!-- Stats -->
    <section class="stats">
      <div>
        <h2>120+</h2>
        <p>기업 사용</p>
      </div>
      <div>
        <h2>5000+</h2>
        <p>사용자</p>
      </div>
      <div>
        <h2>99%</h2>
        <p>만족도</p>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <h2>지금 바로 시작하세요</h2>
      <button>회원가입</button>
    </section>

  </div>
</template>

<style scoped>
.main {
  margin-top: 70px;
}

/* Hero */
.hero {
  text-align: center;
  padding: 120px 20px;
  background: linear-gradient(135deg, #5e72e4, #825ee4);
  color: white;
}

.hero h1 {
  font-size: 40px;
  margin-bottom: 15px;
}

.hero-buttons {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.primary {
  background: white;
  color: #5e72e4;
  padding: 12px 20px;
  border-radius: 25px;
  border: none;
}

.secondary {
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 12px 20px;
  border-radius: 25px;
}

/* Features */
.features {
  display: flex;
  gap: 20px;
  padding: 60px;
}

.card {
  flex: 1;
  padding: 30px;
  background: white;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

/* Stats */
.stats {
  display: flex;
  justify-content: space-around;
  padding: 60px;
  background: #f7fafc;
  text-align: center;
}

.stats h2 {
  font-size: 28px;
  color: #5e72e4;
}

/* CTA */
.cta {
  text-align: center;
  padding: 80px;
}

.cta button {
  margin-top: 20px;
  padding: 12px 30px;
  background: #5e72e4;
  color: white;
  border-radius: 30px;
  border: none;
}
</style>
