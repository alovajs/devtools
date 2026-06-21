import type { App } from 'vue'
import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import AppComponent from './App.vue'

const app: App = createApp(AppComponent)
app.use(Antd)
app.mount('#app')
