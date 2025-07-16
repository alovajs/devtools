import { mount } from '@vue/test-utils'
import HelloWorld from '../src/components/HelloWorld.vue'

describe('component TheCounter.vue', () => {
  it('should render', () => {
    const wrapper = mount(HelloWorld, { props: { msg: 'Hello' } })
    expect(wrapper.text()).toContain('Hello')
    expect(wrapper.html()).toMatchSnapshot()
  })
})
