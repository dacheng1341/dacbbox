<template>
  <div id="app-container">
    <router-view></router-view>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}
#app-container {
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}
</style>
