import type { App } from 'vue'
import Antd from 'ant-design-vue'
import { createApp } from 'vue'
import AppComponent from './App.vue'
import 'ant-design-vue/dist/reset.css'

const app: App = createApp(AppComponent)
app.use(Antd)
app.mount('#app')
