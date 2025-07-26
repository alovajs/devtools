<script setup lang="ts">
import { ref } from 'vue'
import { MType, useVscodeMessage } from '~/hooks/use-message'
import { getVscodeApi } from '~/utils'

const message = ref('')
const state = ref('')
const vscodeApi = getVscodeApi()
const { onVscode, sendAndReceiveToVscode, sendMessageToVscode } = useVscodeMessage()
function onSetState() {
  vscodeApi?.setState(state.value)
}

function onGetState() {
  state.value = vscodeApi?.getState() || ''
}

function onPostMessage() {
  sendMessageToVscode({
    type: MType.hello,
    data: `💬: ${message.value || 'Empty'}`,
  })
}

const receive = ref('')
function onPostAndReceive() {
  sendAndReceiveToVscode<string>({
    type: MType.hello,
    data: `😀: ${message.value || 'Empty'}`,
  }).then(({ data }) => {
    receive.value = data
  })
}

onVscode<string>(({ data }) => {
  // eslint-disable-next-line no-console
  console.log('watch [hello3]: ', data)
})
</script>

<template>
  <main>
    <h1>Hello Vue!</h1>
    <n-button type="primary" @click="onPostMessage">
      Post Message
    </n-button>
    <div style="margin-top: 8px">
      <n-button type="info" @click="onPostAndReceive">
        Post Message And Receive
      </n-button>
      <span v-if="receive" style="margin-left: 8px">{{ receive }}</span>
    </div>
    <div>
      <n-input v-model:value="message">
        Please enter a message
      </n-input>
      <div>Message is: {{ message }}</div>
    </div>
    <div>
      <n-input v-model:value="state">
        Please enter a state
      </n-input>
      <div>State is: {{ state }}</div>
      <div>
        <n-button type="tertiary" @click="onSetState">
          setState
        </n-button>
        <n-button type="success" style="margin-left: 8px" @click="onGetState">
          getState
        </n-button>
      </div>
    </div>
  </main>
</template>
