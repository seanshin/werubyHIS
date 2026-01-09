// 전역 상태 관리
const state = {
  currentView: 'dashboard',
  patients: [],
  claims: [],
  currentClaim: null,
  stats: null
}

// API 클라이언트
const api = {
  async get(url) {
    try {
      const response = await axios.get(`/api${url}`)
      return response.data
    } catch (error) {
      console.error('API Error:', error)
      showNotification('오류가 발생했습니다: ' + (error.response?.data?.error || error.message), 'error')
      throw error
    }
  },
  async post(url, data) {
    try {
      const response = await axios.post(`/api${url}`, data)
      return response.data
    } catch (error) {
      console.error('API Error:', error)
      showNotification('오류가 발생했습니다: ' + (error.response?.data?.error || error.message), 'error')
      throw error
    }
  },
  async put(url, data) {
    try {
      const response = await axios.put(`/api${url}`, data)
      return response.data
    } catch (error) {
      console.error('API Error:', error)
      showNotification('오류가 발생했습니다: ' + (error.response?.data?.error || error.message), 'error')
      throw error
    }
  },
  async delete(url) {
    try {
      const response = await axios.delete(`/api${url}`)
      return response.data
    } catch (error) {
      console.error('API Error:', error)
      showNotification('오류가 발생했습니다: ' + (error.response?.data?.error || error.message), 'error')
      throw error
    }
  }
}

// 알림 표시
function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }
  
  const notification = document.createElement('div')
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`
  notification.textContent = message
  
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.classList.add('animate-fade-out')
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

// 날짜 포맷팅
function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('ko-KR')
}

// 금액 포맷팅
function formatCurrency(amount) {
  if (!amount) return '0원'
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
}

// 상태 뱃지 색상
function getStatusColor(status) {
  const colors = {
    '작성중': 'bg-gray-100 text-gray-800',
    '사전점검완료': 'bg-blue-100 text-blue-800',
    '청구대기': 'bg-yellow-100 text-yellow-800',
    '청구완료': 'bg-green-100 text-green-800',
    '심사중': 'bg-purple-100 text-purple-800',
    '심사완료': 'bg-indigo-100 text-indigo-800',
    '보완필요': 'bg-red-100 text-red-800',
    '지급완료': 'bg-teal-100 text-teal-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// 레이아웃 렌더링
function renderLayout() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <!-- 헤더 -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-hospital-alt text-blue-600 mr-2"></i>
              의료 청구/연계 시스템
            </h1>
            <div class="text-sm text-gray-500">
              <i class="fas fa-clock mr-1"></i>
              ${new Date().toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
      </header>

      <div class="flex">
        <!-- 사이드바 -->
        <aside class="w-64 bg-white shadow-sm min-h-screen">
          <nav class="p-4 space-y-2">
            <button onclick="navigateTo('dashboard')" class="nav-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center ${state.currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}">
              <i class="fas fa-chart-line w-6"></i>
              <span>대시보드</span>
            </button>
            <button onclick="navigateTo('patients')" class="nav-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center ${state.currentView === 'patients' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}">
              <i class="fas fa-users w-6"></i>
              <span>환자 관리</span>
            </button>
            <button onclick="navigateTo('claims')" class="nav-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center ${state.currentView === 'claims' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}">
              <i class="fas fa-file-medical w-6"></i>
              <span>명세서 관리</span>
            </button>
            <button onclick="navigateTo('integrations')" class="nav-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center ${state.currentView === 'integrations' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}">
              <i class="fas fa-exchange-alt w-6"></i>
              <span>외부기관 연계</span>
            </button>
            <button onclick="navigateTo('payments')" class="nav-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center ${state.currentView === 'payments' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}">
              <i class="fas fa-won-sign w-6"></i>
              <span>입금 관리</span>
            </button>
          </nav>
        </aside>

        <!-- 메인 컨텐츠 -->
        <main class="flex-1 p-8">
          <div id="content"></div>
        </main>
      </div>
    </div>
  `
}

// 대시보드 렌더링
async function renderDashboard() {
  try {
    const response = await api.get('/dashboard/stats')
    state.stats = response.data

    const claims = await api.get('/claims?status=')
    state.claims = claims.data

    document.getElementById('content').innerHTML = `
      <div>
        <h2 class="text-3xl font-bold text-gray-900 mb-6">대시보드</h2>
        
        <!-- 통계 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">전체 환자</p>
                <p class="text-3xl font-bold text-gray-900">${state.stats.total_patients}</p>
              </div>
              <div class="bg-blue-100 rounded-full p-3">
                <i class="fas fa-users text-blue-600 text-2xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">이번 달 청구</p>
                <p class="text-3xl font-bold text-gray-900">${formatCurrency(state.stats.this_month_claims)}</p>
              </div>
              <div class="bg-green-100 rounded-full p-3">
                <i class="fas fa-file-invoice-dollar text-green-600 text-2xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">입금 대기</p>
                <p class="text-3xl font-bold text-gray-900">${state.stats.pending_payments.count}</p>
              </div>
              <div class="bg-yellow-100 rounded-full p-3">
                <i class="fas fa-clock text-yellow-600 text-2xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">입금 예정액</p>
                <p class="text-3xl font-bold text-gray-900">${formatCurrency(state.stats.pending_payments.amount)}</p>
              </div>
              <div class="bg-purple-100 rounded-full p-3">
                <i class="fas fa-won-sign text-purple-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- 최근 청구 목록 -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">최근 청구 내역</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">청구번호</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환자명</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진료일</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진단명</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">청구액</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${state.claims.slice(0, 10).map(claim => `
                  <tr class="hover:bg-gray-50 cursor-pointer" onclick="viewClaimDetail(${claim.id})">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${claim.claim_number}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${claim.patient_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(claim.visit_date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${claim.diagnosis_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(claim.total_amount)}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}">
                        ${claim.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
  } catch (error) {
    console.error('Dashboard render error:', error)
  }
}

// 환자 목록 렌더링
async function renderPatients() {
  try {
    const response = await api.get('/patients')
    state.patients = response.data

    document.getElementById('content').innerHTML = `
      <div>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-3xl font-bold text-gray-900">환자 관리</h2>
          <button onclick="showAddPatientModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
            <i class="fas fa-plus mr-2"></i>
            환자 등록
          </button>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환자번호</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">생년월일</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">성별</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">보험유형</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${state.patients.map(patient => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${patient.patient_number}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${patient.name}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(patient.birth_date)}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${patient.gender === 'M' ? '남' : '여'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${patient.insurance_type}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${patient.phone || '-'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button onclick="checkEligibility(${patient.id})" class="text-blue-600 hover:text-blue-800 mr-3">
                      <i class="fas fa-check-circle"></i> 자격조회
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  } catch (error) {
    console.error('Patients render error:', error)
  }
}

// 명세서 목록 렌더링
async function renderClaims() {
  try {
    const response = await api.get('/claims')
    state.claims = response.data

    document.getElementById('content').innerHTML = `
      <div>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-3xl font-bold text-gray-900">명세서 관리</h2>
          <button onclick="showCreateClaimModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
            <i class="fas fa-plus mr-2"></i>
            명세서 작성
          </button>
        </div>

        <!-- 필터 -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="flex gap-4">
            <select onchange="filterClaims(this.value)" class="border border-gray-300 rounded-lg px-4 py-2">
              <option value="">전체 상태</option>
              <option value="작성중">작성중</option>
              <option value="사전점검완료">사전점검완료</option>
              <option value="청구대기">청구대기</option>
              <option value="청구완료">청구완료</option>
              <option value="심사중">심사중</option>
              <option value="심사완료">심사완료</option>
            </select>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">청구번호</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환자명</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진료일</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진단명</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">청구액</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${state.claims.map(claim => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onclick="viewClaimDetail(${claim.id})">
                    ${claim.claim_number}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${claim.patient_name}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(claim.visit_date)}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${claim.diagnosis_name}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(claim.total_amount)}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}">
                      ${claim.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${claim.status === '작성중' || claim.status === '사전점검완료' ? `
                      <button onclick="precheckClaim(${claim.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                        <i class="fas fa-check"></i> 사전점검
                      </button>
                    ` : ''}
                    ${claim.status === '사전점검완료' || claim.status === '청구대기' ? `
                      <button onclick="submitClaim(${claim.id})" class="text-green-600 hover:text-green-800 mr-2">
                        <i class="fas fa-paper-plane"></i> 청구
                      </button>
                    ` : ''}
                    ${claim.status === '청구완료' || claim.status === '심사중' ? `
                      <button onclick="simulateReview(${claim.id})" class="text-purple-600 hover:text-purple-800 mr-2">
                        <i class="fas fa-clipboard-check"></i> 심사결과생성
                      </button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  } catch (error) {
    console.error('Claims render error:', error)
  }
}

// 명세서 상세 보기
async function viewClaimDetail(id) {
  try {
    const response = await api.get(`/claims/${id}`)
    const claim = response.data
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h3 class="text-2xl font-bold text-gray-900">명세서 상세</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- 기본 정보 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-500">청구번호</label>
              <p class="font-semibold">${claim.claim_number}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500">상태</label>
              <p><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}">${claim.status}</span></p>
            </div>
            <div>
              <label class="text-sm text-gray-500">환자명</label>
              <p class="font-semibold">${claim.patient_name}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500">환자번호</label>
              <p class="font-semibold">${claim.patient_number}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500">진료일</label>
              <p class="font-semibold">${formatDate(claim.visit_date)}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500">진료과</label>
              <p class="font-semibold">${claim.department}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500">진단코드</label>
              <p class="font-semibold">${claim.diagnosis_code}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500">진단명</label>
              <p class="font-semibold">${claim.diagnosis_name}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500">담당의</label>
              <p class="font-semibold">${claim.doctor_name}</p>
            </div>
          </div>

          <!-- 진료 항목 -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-lg font-semibold">진료 항목</h4>
              ${claim.status === '작성중' ? `
                <button onclick="showAddItemModal(${claim.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                  <i class="fas fa-plus mr-1"></i> 항목 추가
                </button>
              ` : ''}
            </div>
            <table class="min-w-full divide-y divide-gray-200 border">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">항목코드</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">항목명</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">구분</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">단가</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">수량</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">금액</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">급여율</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${claim.items && claim.items.length > 0 ? claim.items.map(item => `
                  <tr>
                    <td class="px-4 py-2 text-sm">${item.item_code}</td>
                    <td class="px-4 py-2 text-sm">${item.item_name}</td>
                    <td class="px-4 py-2 text-sm">${item.item_type}</td>
                    <td class="px-4 py-2 text-sm text-right">${formatCurrency(item.unit_price)}</td>
                    <td class="px-4 py-2 text-sm text-right">${item.quantity}</td>
                    <td class="px-4 py-2 text-sm text-right">${formatCurrency(item.total_price)}</td>
                    <td class="px-4 py-2 text-sm text-right">${item.insurance_coverage}%</td>
                  </tr>
                `).join('') : '<tr><td colspan="7" class="px-4 py-4 text-center text-gray-500">진료 항목이 없습니다</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- 금액 정보 -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-sm text-gray-500">총 진료비</p>
                <p class="text-xl font-bold text-gray-900">${formatCurrency(claim.total_amount)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">보험자부담금</p>
                <p class="text-xl font-bold text-blue-600">${formatCurrency(claim.insurance_amount)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">본인부담금</p>
                <p class="text-xl font-bold text-red-600">${formatCurrency(claim.copay_amount)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('Claim detail error:', error)
  }
}

// 외부기관 연계 렌더링
async function renderIntegrations() {
  try {
    const response = await api.get('/integrations')
    
    document.getElementById('content').innerHTML = `
      <div>
        <h2 class="text-3xl font-bold text-gray-900 mb-6">외부기관 연계</h2>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연계유형</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일시</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">응답일시</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">결과</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${response.data.map(integration => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${integration.integration_type}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(integration.requested_at).toLocaleString('ko-KR')}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${integration.responded_at ? new Date(integration.responded_at).toLocaleString('ko-KR') : '-'}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${integration.status === '성공' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                      ${integration.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    <button onclick="showIntegrationDetail('${integration.response_data}')" class="text-blue-600 hover:text-blue-800">
                      <i class="fas fa-eye"></i> 상세
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  } catch (error) {
    console.error('Integrations render error:', error)
  }
}

// 입금 관리 렌더링
async function renderPayments() {
  try {
    const response = await api.get('/payments')
    
    document.getElementById('content').innerHTML = `
      <div>
        <h2 class="text-3xl font-bold text-gray-900 mb-6">입금 관리</h2>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">청구번호</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환자명</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">입금예정일</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">입금액</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${response.data.map(payment => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${payment.claim_number}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.patient_name}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(payment.payment_date)}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${formatCurrency(payment.payment_amount)}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.payment_type}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === '입금완료' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                      ${payment.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${payment.status === '입금대기' ? `
                      <button onclick="confirmPayment(${payment.id})" class="text-green-600 hover:text-green-800">
                        <i class="fas fa-check"></i> 입금확인
                      </button>
                    ` : '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  } catch (error) {
    console.error('Payments render error:', error)
  }
}

// 네비게이션
function navigateTo(view) {
  state.currentView = view
  renderLayout()
  
  switch(view) {
    case 'dashboard':
      renderDashboard()
      break
    case 'patients':
      renderPatients()
      break
    case 'claims':
      renderClaims()
      break
    case 'integrations':
      renderIntegrations()
      break
    case 'payments':
      renderPayments()
      break
  }
}

// 명세서 필터
async function filterClaims(status) {
  const url = status ? `/claims?status=${status}` : '/claims'
  const response = await api.get(url)
  state.claims = response.data
  renderClaims()
}

// 자격조회
async function checkEligibility(patientId) {
  try {
    const response = await api.post('/integrations/eligibility', { patient_id: patientId })
    showNotification('자격조회가 완료되었습니다', 'success')
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md">
        <h3 class="text-xl font-bold mb-4">자격조회 결과</h3>
        <div class="space-y-2">
          <p><span class="font-semibold">유효여부:</span> ${response.data.valid ? '유효' : '무효'}</p>
          <p><span class="font-semibold">보험유형:</span> ${response.data.insurance_type}</p>
          <p><span class="font-semibold">상태:</span> ${response.data.status}</p>
          <p><span class="font-semibold">적용시작일:</span> ${response.data.coverage_start}</p>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          확인
        </button>
      </div>
    `
    document.body.appendChild(modal)
  } catch (error) {
    console.error('Eligibility check error:', error)
  }
}

// 사전점검
async function precheckClaim(claimId) {
  try {
    const response = await api.post(`/claims/${claimId}/precheck`)
    
    if (response.passed) {
      showNotification('사전점검이 완료되었습니다', 'success')
    } else {
      showNotification('사전점검에서 오류가 발견되었습니다', 'warning')
    }
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md">
        <h3 class="text-xl font-bold mb-4">사전점검 결과</h3>
        <div class="space-y-4">
          <div class="flex items-center">
            <i class="fas ${response.passed ? 'fa-check-circle text-green-600' : 'fa-exclamation-circle text-red-600'} text-2xl mr-3"></i>
            <span class="font-semibold">${response.passed ? '통과' : '실패'}</span>
          </div>
          
          ${response.errors && response.errors.length > 0 ? `
            <div>
              <p class="font-semibold text-red-600 mb-2">오류:</p>
              <ul class="list-disc list-inside text-sm space-y-1">
                ${response.errors.map(err => `<li>${err}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${response.warnings && response.warnings.length > 0 ? `
            <div>
              <p class="font-semibold text-yellow-600 mb-2">경고:</p>
              <ul class="list-disc list-inside text-sm space-y-1">
                ${response.warnings.map(warn => `<li>${warn}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        <button onclick="this.closest('.fixed').remove(); navigateTo('claims')" class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          확인
        </button>
      </div>
    `
    document.body.appendChild(modal)
  } catch (error) {
    console.error('Precheck error:', error)
  }
}

// 청구 제출
async function submitClaim(claimId) {
  if (!confirm('청구를 제출하시겠습니까?')) return
  
  try {
    const response = await api.post(`/claims/${claimId}/submit`)
    showNotification(response.message, 'success')
    navigateTo('claims')
  } catch (error) {
    console.error('Submit error:', error)
  }
}

// 심사결과 시뮬레이션
async function simulateReview(claimId) {
  if (!confirm('심사결과를 생성하시겠습니까? (시뮬레이션)')) return
  
  try {
    const response = await api.post(`/claims/${claimId}/review-result`)
    showNotification('심사결과가 생성되었습니다', 'success')
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md">
        <h3 class="text-xl font-bold mb-4">심사결과</h3>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span>결과:</span>
            <span class="font-semibold ${response.data.result_type === '적정' ? 'text-green-600' : 'text-red-600'}">
              ${response.data.result_type}
            </span>
          </div>
          <div class="flex justify-between">
            <span>청구금액:</span>
            <span class="font-semibold">${formatCurrency(response.data.original_amount)}</span>
          </div>
          <div class="flex justify-between">
            <span>인정금액:</span>
            <span class="font-semibold">${formatCurrency(response.data.approved_amount)}</span>
          </div>
          ${response.data.reduction_amount > 0 ? `
            <div class="flex justify-between text-red-600">
              <span>삭감금액:</span>
              <span class="font-semibold">${formatCurrency(response.data.reduction_amount)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between border-t pt-2">
            <span>지급예정액:</span>
            <span class="font-bold text-blue-600">${formatCurrency(response.data.payment_amount)}</span>
          </div>
        </div>
        <button onclick="this.closest('.fixed').remove(); navigateTo('claims')" class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          확인
        </button>
      </div>
    `
    document.body.appendChild(modal)
  } catch (error) {
    console.error('Review simulation error:', error)
  }
}

// 입금 확인
async function confirmPayment(paymentId) {
  if (!confirm('입금을 확인하시겠습니까?')) return
  
  try {
    await api.post(`/payments/${paymentId}/confirm`)
    showNotification('입금이 확인되었습니다', 'success')
    renderPayments()
  } catch (error) {
    console.error('Payment confirm error:', error)
  }
}

// 연계 상세 보기
function showIntegrationDetail(responseData) {
  const data = JSON.parse(responseData)
  
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md">
      <h3 class="text-xl font-bold mb-4">연계 응답 상세</h3>
      <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">${JSON.stringify(data, null, 2)}</pre>
      <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
        닫기
      </button>
    </div>
  `
  document.body.appendChild(modal)
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  renderLayout()
  renderDashboard()
})
