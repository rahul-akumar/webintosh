<template>
  <div class="shortcuts-root">
    <header class="sc-header">
      <h1 class="sc-title">Webintosh Shortcuts</h1>
      <p class="sc-sub">Alt-based accelerators to avoid browser conflicts</p>
    </header>

    <section class="sc-section">
      <h2 class="sc-h2">Global</h2>
      <table class="sc-table" aria-label="Global shortcuts">
        <thead>
          <tr>
            <th scope="col">Shortcut</th>
            <th scope="col">Action</th>
            <th scope="col">Context</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>N</kbd></td>
            <td>Open Window / New Window / New Document (focus-aware)</td>
            <td>Desktop / App (Finder / TextEdit)</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>W</kbd></td>
            <td>Close Window</td>
            <td>Focused Window</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>M</kbd></td>
            <td>Minimize Window</td>
            <td>Focused Window</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>Z</kbd></td>
            <td>Zoom (Toggle Maximize)</td>
            <td>Focused Window</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>`</kbd></td>
            <td>Cycle Windows Forward</td>
            <td>App/Desktop</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>/</kbd></td>
            <td>Open Shortcuts</td>
            <td>Everywhere</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="sc-section">
      <h2 class="sc-h2">Notes</h2>
      <ul class="sc-ul">
        <li>When Desktop is in focus, <kbd>Alt</kbd> + <kbd>N</kbd> opens a generic window.</li>
        <li>When Finder is in focus, <kbd>Alt</kbd> + <kbd>N</kbd> opens a new Finder window.</li>
        <li>When TextEdit is in focus, <kbd>Alt</kbd> + <kbd>N</kbd> creates a new TextEdit document window.</li>
        <li>Right-click on the Desktop opens a context menu with quick actions.</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ShortcutsApp' })
</script>

<style scoped>
.shortcuts-root {
  padding: 16px;
  font-size: 14px;
  color: #222;
}

.sc-header {
  margin-bottom: 12px;
}
.sc-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #111;
}
.sc-sub {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.sc-section {
  margin-top: 16px;
}

.sc-h2 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.sc-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  overflow: hidden;
}
.sc-table th,
.sc-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}
.sc-table thead th {
  background: #f8f8f8;
  font-weight: 600;
  color: #333;
}
.sc-table tbody tr:last-child td {
  border-bottom: 0;
}

.sc-ul {
  margin: 0;
  padding-left: 18px;
  color: #333;
}
.sc-ul li { margin: 6px 0; }

kbd {
  display: inline-block;
  padding: 2px 6px;
  border: 1px solid #ccc;
  border-bottom-color: #bbb;
  border-radius: 4px;
  background: #f7f7f7;
  box-shadow: inset 0 -1px 0 #bbb;
  font-size: 12px;
  line-height: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
}
</style>