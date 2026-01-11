import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import patients from './routes/patients'
import claims from './routes/claims'
import integrations from './routes/integrations'
import payments from './routes/payments'
import dashboard from './routes/dashboard'
import type { Bindings } from './types/bindings'

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// API 라우트 등록
app.route('/api/patients', patients)
app.route('/api/claims', claims)
app.route('/api/integrations', integrations)
app.route('/api/payments', payments)
app.route('/api/dashboard', dashboard)

// 메인 페이지
app.get('/', (c: any) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>의료 청구/연계 시스템</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app">
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p class="mt-4 text-gray-600">로딩 중...</p>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
