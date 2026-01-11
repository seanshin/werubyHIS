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
            <button onclick="navigateTo('admissions')" class="nav-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center ${state.currentView === 'admissions' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}">
              <i class="fas fa-hospital-user w-6"></i>
              <span>원무업무 통합</span>
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

        <!-- 차트 섹션 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">명세서 상태별 분포</h3>
            <div style="height: 300px; position: relative;">
              <canvas id="statusChart"></canvas>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">월별 청구 추이</h3>
            <div style="height: 300px; position: relative;">
              <canvas id="monthlyChart"></canvas>
            </div>
          </div>
        </div>

        <!-- 최근 청구 목록 -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">최근 청구 내역</h3>
            <button onclick="exportClaimsToExcel()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center">
              <i class="fas fa-file-excel mr-2"></i>
              엑셀 다운로드
            </button>
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
    
    // 차트 초기화 후 렌더링
    resetCharts()
    setTimeout(() => renderCharts(), 100)
  } catch (error) {
    console.error('Dashboard render error:', error)
  }
}

// 차트 인스턴스 저장
let statusChartInstance = null
let monthlyChartInstance = null
let chartsRendered = false
let chartRenderTimeout = null

// 차트 렌더링
async function renderCharts() {
  // 이미 렌더링 중이거나 완료된 경우 중복 실행 방지
  if (chartsRendered) {
    return
  }
  
  // 기존 타이머 취소
  if (chartRenderTimeout) {
    clearTimeout(chartRenderTimeout)
    chartRenderTimeout = null
  }
  
  try {
    // Chart.js가 로드되었는지 확인
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js가 아직 로드되지 않았습니다. 잠시 후 다시 시도합니다.')
      chartRenderTimeout = setTimeout(() => renderCharts(), 200)
      return
    }
    
    // 상태별 파이 차트
    const stats = state.stats
    if (stats && stats.claims_by_status) {
      const statusData = stats.claims_by_status
      const ctx1 = document.getElementById('statusChart')
      if (ctx1 && !statusChartInstance) {
        statusChartInstance = new Chart(ctx1, {
          type: 'doughnut',
          data: {
            labels: statusData.map(s => s.status),
            datasets: [{
              data: statusData.map(s => s.count),
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(251, 191, 36, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(239, 68, 68, 0.8)'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
              legend: {
                position: 'bottom'
              }
            },
            animation: {
              duration: 0 // 애니메이션 비활성화로 크기 변화 방지
            }
          }
        })
      }
    }
    
    // 월별 추세 그래프
    try {
      const monthlyData = await api.get('/dashboard/monthly-stats?months=6')
      if (monthlyData.success && monthlyData.data && monthlyData.data.length > 0) {
        const ctx2 = document.getElementById('monthlyChart')
        if (ctx2 && !monthlyChartInstance) {
          monthlyChartInstance = new Chart(ctx2, {
            type: 'line',
            data: {
              labels: monthlyData.data.map(d => d.month),
              datasets: [{
                label: '청구액',
                data: monthlyData.data.map(d => d.total_amount || 0),
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              aspectRatio: 1.5,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return (value / 1000).toFixed(0) + 'K'
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  display: true
                }
              },
              animation: {
                duration: 0 // 애니메이션 비활성화로 크기 변화 방지
              }
            }
          })
        }
      } else {
        // 데이터가 없을 때 메시지 표시
        const ctx2 = document.getElementById('monthlyChart')
        if (ctx2 && !monthlyChartInstance) {
          const parent = ctx2.parentElement
          if (parent) {
            parent.innerHTML = `
              <h3 class="text-lg font-semibold text-gray-900 mb-4">월별 청구 추이</h3>
              <div class="flex items-center justify-center" style="height: 300px;">
                <p class="text-gray-500">데이터가 없습니다</p>
              </div>
            `
          }
        }
      }
    } catch (monthlyError) {
      console.error('Monthly stats error:', monthlyError)
      // 오류 발생 시 메시지 표시
      const ctx2 = document.getElementById('monthlyChart')
      if (ctx2 && !monthlyChartInstance) {
        const parent = ctx2.parentElement
        if (parent) {
          parent.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-900 mb-4">월별 청구 추이</h3>
            <div class="flex items-center justify-center" style="height: 300px;">
              <p class="text-gray-500">차트를 불러올 수 없습니다</p>
            </div>
          `
        }
      }
    }
    
    chartsRendered = true
  } catch (error) {
    console.error('Chart render error:', error)
  }
}

// 대시보드 렌더링 시 차트 초기화
function resetCharts() {
  if (statusChartInstance) {
    statusChartInstance.destroy()
    statusChartInstance = null
  }
  if (monthlyChartInstance) {
    monthlyChartInstance.destroy()
    monthlyChartInstance = null
  }
  chartsRendered = false
  if (chartRenderTimeout) {
    clearTimeout(chartRenderTimeout)
    chartRenderTimeout = null
  }
}

// 엑셀 다운로드
function exportClaimsToExcel() {
  const claims = state.claims || []
  if (claims.length === 0) {
    showNotification('다운로드할 데이터가 없습니다', 'warning')
    return
  }
  
  // CSV 형식으로 변환
  const headers = ['청구번호', '환자명', '진료일', '진단명', '청구액', '상태']
  const rows = claims.map(claim => [
    claim.claim_number,
    claim.patient_name,
    formatDate(claim.visit_date),
    claim.diagnosis_name,
    claim.total_amount || 0,
    claim.status
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  // BOM 추가 (한글 깨짐 방지)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `명세서_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  showNotification('엑셀 파일이 다운로드되었습니다', 'success')
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
    case 'admissions':
      renderAdmissions()
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

// 원무업무 통합 페이지 렌더링
async function renderAdmissions() {
  try {
    const patients = await api.get('/patients')
    const claims = await api.get('/claims')
    const stats = await api.get('/dashboard/stats')
    
    // 오늘 접수한 환자 (샘플 데이터로 당일 생성된 환자)
    const today = new Date().toISOString().slice(0, 10)
    const todayPatients = patients.data.filter(p => p.created_at?.startsWith(today))
    
    // 오늘 수납 (당일 생성된 명세서)
    const todayClaims = claims.data.filter(c => c.created_at?.startsWith(today))
    const todayRevenue = todayClaims.reduce((sum, c) => sum + (c.total_amount || 0), 0)
    
    // 대기 환자 (작성중 명세서)
    const waitingClaims = claims.data.filter(c => c.status === '작성중')
    
    document.getElementById('content').innerHTML = `
      <div>
        <h2 class="text-3xl font-bold text-gray-900 mb-6">
          <i class="fas fa-hospital-user text-blue-600 mr-2"></i>
          원무업무 통합
        </h2>
        
        <!-- 주요 통계 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-100 text-sm">오늘 접수</p>
                <p class="text-4xl font-bold">${todayPatients.length}</p>
                <p class="text-blue-100 text-xs mt-1">명</p>
              </div>
              <div class="bg-white bg-opacity-20 rounded-full p-4">
                <i class="fas fa-user-plus text-3xl"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-100 text-sm">오늘 수납</p>
                <p class="text-4xl font-bold">${todayClaims.length}</p>
                <p class="text-green-100 text-xs mt-1">건</p>
              </div>
              <div class="bg-white bg-opacity-20 rounded-full p-4">
                <i class="fas fa-cash-register text-3xl"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-purple-100 text-sm">오늘 수납액</p>
                <p class="text-3xl font-bold">${Math.floor(todayRevenue / 1000)}K</p>
                <p class="text-purple-100 text-xs mt-1">원</p>
              </div>
              <div class="bg-white bg-opacity-20 rounded-full p-4">
                <i class="fas fa-won-sign text-3xl"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-orange-100 text-sm">대기 환자</p>
                <p class="text-4xl font-bold">${waitingClaims.length}</p>
                <p class="text-orange-100 text-xs mt-1">명</p>
              </div>
              <div class="bg-white bg-opacity-20 rounded-full p-4">
                <i class="fas fa-hourglass-half text-3xl"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 빠른 작업 버튼 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button onclick="navigateTo('patients')" class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center">
              <div class="bg-blue-100 rounded-full p-4 mr-4">
                <i class="fas fa-user-plus text-blue-600 text-2xl"></i>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-gray-900 text-lg">환자 접수</h3>
                <p class="text-gray-500 text-sm">신규 환자 등록 및 자격조회</p>
              </div>
            </div>
          </button>
          
          <button onclick="navigateTo('claims')" class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center">
              <div class="bg-green-100 rounded-full p-4 mr-4">
                <i class="fas fa-file-invoice-dollar text-green-600 text-2xl"></i>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-gray-900 text-lg">수납 처리</h3>
                <p class="text-gray-500 text-sm">진료비 수납 및 명세서 발행</p>
              </div>
            </div>
          </button>
          
          <button onclick="navigateTo('integrations')" class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center">
              <div class="bg-purple-100 rounded-full p-4 mr-4">
                <i class="fas fa-exchange-alt text-purple-600 text-2xl"></i>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-gray-900 text-lg">외부 연계</h3>
                <p class="text-gray-500 text-sm">보험 자격조회 및 실손연계</p>
              </div>
            </div>
          </button>
        </div>
        
        <!-- 대기 환자 목록 -->
        <div class="bg-white rounded-lg shadow mb-8">
          <div class="border-b px-6 py-4">
            <h3 class="text-lg font-bold text-gray-900">
              <i class="fas fa-hourglass-half text-orange-600 mr-2"></i>
              진료 대기 환자
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환자번호</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진료일</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진료과</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당의</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${waitingClaims.length === 0 ? `
                  <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                      <i class="fas fa-inbox text-4xl mb-2"></i>
                      <p>대기 중인 환자가 없습니다</p>
                    </td>
                  </tr>
                ` : waitingClaims.map(claim => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-900">${claim.patient_number || '-'}</td>
                    <td class="px-6 py-4 text-sm font-medium text-gray-900">${claim.patient_name}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${formatDate(claim.visit_date)}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${claim.department || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${claim.doctor_name || '-'}</td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(claim.status)}">
                        ${claim.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <button onclick="viewClaimDetail(${claim.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- 오늘 수납 내역 -->
        <div class="bg-white rounded-lg shadow">
          <div class="border-b px-6 py-4">
            <h3 class="text-lg font-bold text-gray-900">
              <i class="fas fa-receipt text-green-600 mr-2"></i>
              오늘 수납 내역
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">청구번호</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">환자명</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진단명</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총액</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">본인부담</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${todayClaims.length === 0 ? `
                  <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                      <i class="fas fa-inbox text-4xl mb-2"></i>
                      <p>오늘 수납 내역이 없습니다</p>
                    </td>
                  </tr>
                ` : todayClaims.map(claim => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-500">${new Date(claim.created_at).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}</td>
                    <td class="px-6 py-4 text-sm font-medium text-blue-600">${claim.claim_number}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${claim.patient_name}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${claim.diagnosis_name || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-900 font-semibold">${formatCurrency(claim.total_amount)}</td>
                    <td class="px-6 py-4 text-sm text-red-600 font-semibold">${formatCurrency(claim.copay_amount)}</td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(claim.status)}">
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
    console.error('Admissions render error:', error)
    document.getElementById('content').innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
        <p class="text-gray-600">데이터를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    `
  }
}

// 환자 등록 모달
async function showAddPatientModal() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
        <h3 class="text-2xl font-bold text-gray-900">환자 등록</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      
      <form id="patientForm" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">환자번호 *</label>
            <input type="text" name="patient_number" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">생년월일 *</label>
            <input type="date" name="birth_date" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">성별 *</label>
            <select name="gender" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">선택</option>
              <option value="M">남성</option>
              <option value="F">여성</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">보험유형 *</label>
            <select name="insurance_type" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">선택</option>
              <option value="건강보험">건강보험</option>
              <option value="의료급여">의료급여</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">보험번호</label>
            <input type="text" name="insurance_number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input type="tel" name="phone" placeholder="010-1234-5678" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <input type="text" name="address" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            취소
          </button>
          <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            등록
          </button>
        </div>
      </form>
    </div>
  `
  
  document.body.appendChild(modal)
  
  document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    
    try {
      await api.post('/patients', data)
      showNotification('환자가 등록되었습니다', 'success')
      modal.remove()
      renderPatients()
    } catch (error) {
      console.error('Patient registration error:', error)
    }
  })
}

// 명세서 작성 모달
async function showCreateClaimModal() {
  const patients = await api.get('/patients')
  
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
        <h3 class="text-2xl font-bold text-gray-900">명세서 작성</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      
      <form id="claimForm" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">환자 *</label>
          <select name="patient_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">선택</option>
            ${patients.data.map(p => `<option value="${p.id}">${p.patient_number} - ${p.name}</option>`).join('')}
          </select>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">진료일 *</label>
            <input type="date" name="visit_date" required value="${new Date().toISOString().slice(0, 10)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">진료과 *</label>
            <input type="text" name="department" required placeholder="내과" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">진단코드 *</label>
            <input type="text" name="diagnosis_code" required placeholder="A00.0" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">진단명 *</label>
            <input type="text" name="diagnosis_name" required placeholder="감기" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">담당의 *</label>
            <input type="text" name="doctor_name" required placeholder="홍길동" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">비고</label>
          <textarea name="notes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            취소
          </button>
          <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            작성
          </button>
        </div>
      </form>
    </div>
  `
  
  document.body.appendChild(modal)
  
  document.getElementById('claimForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    
    try {
      const result = await api.post('/claims', data)
      showNotification('명세서가 작성되었습니다', 'success')
      modal.remove()
      renderClaims()
    } catch (error) {
      console.error('Claim creation error:', error)
    }
  })
}

// 진료 항목 추가 모달
async function showAddItemModal(claimId) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg max-w-2xl w-full">
      <div class="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-2xl font-bold text-gray-900">진료 항목 추가</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      
      <form id="itemForm" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">항목코드 *</label>
            <input type="text" name="item_code" required placeholder="A001" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">항목명 *</label>
            <input type="text" name="item_name" required placeholder="일반진찰" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">구분 *</label>
            <select name="item_type" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">선택</option>
              <option value="진찰료">진찰료</option>
              <option value="처방">처방</option>
              <option value="검사">검사</option>
              <option value="치료">치료</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">단가 *</label>
            <input type="number" name="unit_price" required min="0" step="100" placeholder="10000" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">수량</label>
            <input type="number" name="quantity" min="1" value="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">급여율 (%)</label>
            <input type="number" name="insurance_coverage" min="0" max="100" value="70" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">비고</label>
          <textarea name="notes" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            취소
          </button>
          <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            추가
          </button>
        </div>
      </form>
    </div>
  `
  
  document.body.appendChild(modal)
  
  document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    data.unit_price = parseInt(data.unit_price)
    data.quantity = parseInt(data.quantity) || 1
    data.insurance_coverage = parseInt(data.insurance_coverage) || 70
    
    try {
      await api.post(`/claims/${claimId}/items`, data)
      showNotification('진료 항목이 추가되었습니다', 'success')
      modal.remove()
      viewClaimDetail(claimId)
    } catch (error) {
      console.error('Item addition error:', error)
    }
  })
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  renderLayout()
  renderDashboard()
})
