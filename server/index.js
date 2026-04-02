require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const path = require('path')
const http = require('http')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()
const PORT = process.env.PORT || 5043
const RUSTDESK_WEB = process.env.RUSTDESK_WEB_URL || 'https://rustdesk.taybouts.com'

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

app.use('/api', require('./routes/peers'))
app.use('/api/status', require('./routes/status'))

app.get('/api/config', (req, res) => {
  res.json({
    rustdeskWebUrl: '/rustdesk',
    rustdeskServer: process.env.RUSTDESK_SERVER || '',
  })
})

// Proxy RustDesk web client — same origin, rewrite base href for correct asset paths
app.use('/rustdesk', createProxyMiddleware({
  target: RUSTDESK_WEB,
  changeOrigin: true,
  pathRewrite: { '^/rustdesk': '' },
  selfHandleResponse: true,
  on: {
    proxyRes: (proxyRes, req, res) => {
      const contentType = proxyRes.headers['content-type'] || ''
      // Copy headers
      Object.keys(proxyRes.headers).forEach(key => {
        if (key !== 'content-length' && key !== 'content-encoding') {
          res.setHeader(key, proxyRes.headers[key])
        }
      })
      res.status(proxyRes.statusCode)

      if (contentType.includes('text/html')) {
        // Rewrite base href so Flutter loads assets from /rustdesk/
        let body = ''
        proxyRes.on('data', chunk => { body += chunk.toString() })
        proxyRes.on('end', () => {
          body = body.replace('<base href="/">', '<base href="/rustdesk/">')
          res.send(body)
        })
      } else {
        proxyRes.pipe(res)
      }
    }
  }
}))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

app.listen(PORT, () => {
  console.log(`T-Desk running at http://localhost:${PORT}`)
})
