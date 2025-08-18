<template>
  <div class="about-app">
    <div class="about-content">
      <div class="about-icon">
        <span class="icon-emoji">🖥️</span>
      </div>
      <h1 class="about-title">Webintosh</h1>
      <p class="about-version">Version 0.1.2</p>
      <p class="about-tagline">A web-based desktop environment</p>
      
      <div class="about-details">
        <p class="about-description">
          Webintosh brings the familiar desktop experience to your browser, 
          complete with windows, apps, and a dock.
        </p>
        
        <div class="about-info">
          <div class="info-row">
            <span class="info-label">Built with:</span>
            <span class="info-value">Nuxt 3, Vue 3, TypeScript</span>
          </div>
          <div class="info-row">
            <span class="info-label">License:</span>
            <span class="info-value">MIT</span>
          </div>
          <div class="info-row">
            <span class="info-label">Repository:</span>
            <a href="https://github.com/rahul-kurup/webintosh" 
               target="_blank" 
               rel="noopener noreferrer"
               class="info-link">
              GitHub
            </a>
          </div>
        </div>
      </div>
      
      <div class="about-footer">
        <p class="copyright">© 2025 Webintosh Project</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AboutApp' })
</script>

<style scoped>
.about-app {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(180deg, #f6f6f7 0%, #ececed 100%);
  user-select: none;
}

.about-content {
  text-align: center;
  padding: 40px;
  max-width: 400px;
}

.about-icon {
  margin-bottom: 20px;
}

.icon-emoji {
  font-size: 64px;
  display: inline-block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.about-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #1d1d1f;
}

.about-version {
  font-size: 14px;
  color: #86868b;
  margin: 0 0 4px;
}

.about-tagline {
  font-size: 14px;
  color: #86868b;
  margin: 0 0 30px;
  font-style: italic;
}

.about-details {
  margin: 30px 0;
}

.about-description {
  font-size: 13px;
  color: #1d1d1f;
  line-height: 1.5;
  margin: 0 0 24px;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 12px;
  text-align: left;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #86868b;
  font-weight: 500;
}

.info-value {
  color: #1d1d1f;
}

.info-link {
  color: #007aff;
  text-decoration: none;
  transition: opacity 0.2s;
}

.info-link:hover {
  opacity: 0.7;
}

.about-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #d2d2d7;
}

.copyright {
  font-size: 11px;
  color: #86868b;
  margin: 0;
}
</style>
